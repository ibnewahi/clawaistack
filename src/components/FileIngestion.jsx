import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { prepareDocumentUpload, finalizeDocumentUpload } from '../lib/documentApi';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DOCUMENT_BUCKET = 'financial-documents';
const ALLOWED_FILE_TYPES = {
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/csv'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
};

const validateSelectedFile = (selectedFile) => {
  if (!selectedFile || selectedFile.size <= 0 || selectedFile.size > MAX_FILE_SIZE_BYTES) {
    return false;
  }

  const extension = selectedFile.name.split('.').pop()?.trim().toLowerCase();
  const mimeType = selectedFile.type.trim().toLowerCase();
  return Boolean(extension && ALLOWED_FILE_TYPES[extension]?.includes(mimeType));
};

export default function FileIngestion({ isOpen, workspaceId, onClose }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const selectFile = (selectedFile) => {
    setFile(selectedFile);
    setUploadComplete(false);
    setErrorMessage(null);
  };

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
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!workspaceId || !file) {
      setErrorMessage('Select a workspace and document before uploading.');
      return;
    }
    if (!validateSelectedFile(file)) {
      setErrorMessage('Choose a supported document up to 10 MB.');
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const prepared = await prepareDocumentUpload({
        workspaceId,
        file: {
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
      const document = prepared.document;
      const upload = prepared.upload;

      if (
        !document ||
        typeof document.id !== 'string' ||
        !document.id ||
        document.status !== 'PENDING_UPLOAD' ||
        !upload ||
        upload.bucketId !== DOCUMENT_BUCKET ||
        typeof upload.objectPath !== 'string' ||
        !upload.objectPath ||
        typeof upload.signedUploadToken !== 'string' ||
        !upload.signedUploadToken
      ) {
        throw new Error('Invalid document upload response');
      }

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .uploadToSignedUrl(upload.objectPath, upload.signedUploadToken, file, {
          contentType: file.type,
        });
      if (uploadError) {
        throw new Error('Signed document upload failed');
      }

      const finalized = await finalizeDocumentUpload({
        workspaceId,
        documentId: document.id,
      });
      if (
        finalized.success !== true ||
        !finalized.document ||
        finalized.document.id !== document.id ||
        finalized.document.status !== 'UPLOADED' ||
        typeof finalized.transitioned !== 'boolean'
      ) {
        throw new Error('Invalid document finalization response');
      }

      setUploadComplete(true);
      setTimeout(() => {
        setUploadComplete(false);
        setFile(null);
        onClose();
      }, 1600);
    } catch {
      setErrorMessage('Document upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#13151b] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-emerald-400" />
          Upload Financial Document
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Upload a document securely to your selected workspace.
        </p>

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
                onClick={() => selectFile(null)}
                disabled={uploading}
                className="text-[11px] text-rose-400 hover:underline mt-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                Drag and drop your document here, or <label className="text-emerald-400 hover:underline cursor-pointer">browse<input type="file" className="hidden" onChange={handleChange} accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg" /></label>
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">Supports PDF, CSV, Excel, PNG, and JPG files up to 10 MB</p>
            </>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
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
                <span>Uploading...</span>
              </>
            ) : uploadComplete ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Uploaded</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
