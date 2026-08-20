import { supabase } from './supabase';

/**
 * Parses raw CSV text into structured JSON array with normalized headers.
 */
export function parseCSV(csvText) {
  const lines = csvText.split(/\r\n|\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('CSV file contains no readable data rows.');

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(',');
    if (currentLine.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = currentLine[index].trim();
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Validates parsed financial data according to target Claw schema rules.
 */
export function validateFinancialSchema(rows, targetClaw) {
  const validationErrors = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return { isValid: false, errors: ['No data rows available for validation.'] };
  }

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    if (targetClaw === 'bookkeeper-claw') {
      if (!row.amount && !row.debit && !row.credit) {
        validationErrors.push(`Row ${rowNum}: Missing transaction amount.`);
      }
      if (!row.date) {
        validationErrors.push(`Row ${rowNum}: Missing transaction date.`);
      }
    } else if (targetClaw === 'ap-claw') {
      if (!row.invoice_number && !row.invoiceno && !row.bill_id) {
        validationErrors.push(`Row ${rowNum}: Missing invoice identifier.`);
      }
      if (!row.amount && !row.total) {
        validationErrors.push(`Row ${rowNum}: Missing total bill amount.`);
      }
    }
  });

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
  };
}

/**
 * Detects duplicate entries using hash generation on amount, date, and invoice ID.
 */
export async function detectDuplicates(rows, targetClaw) {
  if (!supabase) return { cleanRows: rows, duplicateCount: 0 };

  try {
    const { data: existingLogs } = await supabase
      .from('audit_logs')
      .select('metadata')
      .eq('claw_key', targetClaw)
      .limit(100);

    const existingHashes = new Set(
      (existingLogs || [])
        .map((log) => log.metadata?.hash)
        .filter(Boolean)
    );

    let duplicateCount = 0;
    const cleanRows = [];

    rows.forEach((row) => {
      const rowHash = btoa(
        `${row.date || ''}_${row.amount || row.total || ''}_${row.invoice_number || row.description || ''}`
      );

      if (existingHashes.has(rowHash)) {
        duplicateCount++;
      } else {
        cleanRows.push({ ...row, _hash: rowHash });
      }
    });

    return { cleanRows, duplicateCount };
  } catch (err) {
    console.warn('Duplicate detection check bypassed:', err.message);
    return { cleanRows: rows, duplicateCount: 0 };
  }
}

/**
 * Main execution handler for file reading, parsing, and pipeline validation.
 */
export async function processFilePayload(file, targetClaw) {
  const fileText = await file.text();
  let parsedData = [];

  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'csv') {
    parsedData = parseCSV(fileText);
  } else if (extension === 'json') {
    parsedData = JSON.parse(fileText);
  } else {
    // Basic fallback parser structure for PDF or plain text invoices
    parsedData = [
      {
        filename: file.name,
        uploaded_at: new Date().toISOString(),
        raw_preview: fileText.substring(0, 200),
      },
    ];
  }

  // 1. Schema Validation
  const schemaCheck = validateFinancialSchema(parsedData, targetClaw);
  if (!schemaCheck.isValid) {
    throw new Error(`Schema Validation Failed: ${schemaCheck.errors.slice(0, 2).join(' ')}`);
  }

  // 2. Duplicate Detection
  const { cleanRows, duplicateCount } = await detectDuplicates(parsedData, targetClaw);

  // 3. Persist pipeline record to Supabase audit trail
  if (supabase) {
    await supabase.from('audit_logs').insert([
      {
        claw_key: targetClaw,
        action_type: 'Data Pipeline Ingestion',
        file_name: file.name,
        file_size_bytes: file.size,
        status: 'Completed',
        metadata: {
          total_extracted_records: parsedData.length,
          clean_records: cleanRows.length,
          duplicates_flagged: duplicateCount,
          hash: cleanRows[0]?._hash || null,
        },
        created_at: new Date().toISOString(),
      },
    ]);
  }

  return {
    totalParsed: parsedData.length,
    cleanRecords: cleanRows.length,
    duplicatesFlagged: duplicateCount,
    preview: cleanRows.slice(0, 5),
  };
}