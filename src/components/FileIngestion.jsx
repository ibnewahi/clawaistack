import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { processFilePayload } from '../lib/fileProcessor';

export default function FileIngestion({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [targetClaw, setTargetClaw] = useState('bookkeeper-claw');

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMessage(null);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);

    try {
      // 1. Upload raw file to Supabase Storage bucket
      if (supabase) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${targetClaw}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        await supabase.storage
          .from('financial-documents')
          .upload(filePath, file)
          .catch((e) => console.warn('Supabase storage fallback notice:', e.message));
      }

      // 2. Run Parsing, Schema Validation, and Duplicate Engine
      const pipelineResult = await processFilePayload(file, targetClaw);

      setUploading(false);
      setUploadComplete(true);

      if (onUploadSuccess) {
        onUploadSuccess({
          name: file.name,
          size: file.size,
          targetClaw,
          ...pipelineResult,
        });
      }

      // Automatically reset & close modal after success feedback
      setTimeout(() => {
        setUploadComplete(false);
        setFile(null);
        onClose();
      }, 1600);

    } catch (err) {
      console.error('Ingestion pipeline failed:', err);
      setUploading(false);
      setErrorMessage(err.message || 'Failed to process document schema.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#13151b] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-emerald-400" />
          Ingest Financial Document
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Upload invoices, bank statements, or receipts for automated claw processing and reconciliation.
        </p>

        {/* Target Claw Pipeline Selector */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Target AI Claw Pipeline
          </label>
          <select
            value={targetClaw}
            onChange={(e) => setTargetClaw(e.target.value)}
            className="w-full bg-[#181a22] border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="bookkeeper-claw">Bookkeeper Claw (Bank Statements / Receipts)</option>
            <option value="ap-claw">AP Matcher Claw (Vendor Bills / Invoices)</option>
            <option value="controller-claw">Controller Audit Claw (General Ledger Exports)</option>
            <option value="cfo-claw">CFO Forecast Claw (P&L & Cash Reports)</option>
          </select>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center ${
            dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-[#181a22] hover:border-zinc-700'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center space-y-2">
              <FileText className="h-10 w-10 text-emerald-400 animate-bounce" />
              <span className="text-xs font-medium text-white font-mono">{file.name}</span>
              <span className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
              <button 
                onClick={() => { setFile(null); setErrorMessage(null); }}
                className="text-[11px] text-rose-400 hover:underline mt-1 cursor-pointer"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                Drag and drop your document here, or <label className="text-emerald-400 hover:underline cursor-pointer">browse<input type="file" className="hidden" onChange={handleChange} accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.json" /></label>
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">Supports PDF, CSV, Excel, and JSON files up to 10MB</p>
            </>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleUploadAndProcess}
            disabled={!file || uploading || uploadComplete}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              !file 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : uploadComplete 
                ? 'bg-emerald-500 text-black' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-black'
            }`}
          >
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Parsing & Validating...</span>
              </>
            ) : uploadComplete ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Successfully Ingested!</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload & Process</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}