import React, { useLayoutEffect, useRef, useState } from 'react';
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
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const successTimerRef = useRef(null);
  const sessionRef = useRef(0);
  const activeRef = useRef(false);
  const mountedRef = useRef(false);
  const authRef = useRef({ userId: null, generation: 0 });
  const operationRef = useRef(null);
  const recoveryRef = useRef([]);
  const completionRef = useRef(null);
  const [authIdentity, setAuthIdentity] = useState({ initialized: false, userId: null });
  const [pendingOperation, setPendingOperation] = useState(null);
  const [recoveries, setRecoveries] = useState([]);

  useLayoutEffect(() => {
    mountedRef.current = true;
    let live = true;
    let authEventRevision = 0;
    const acceptIdentity = (userId) => {
      if (!live) return;
      if (authRef.current.userId !== userId) {
        authRef.current = { userId, generation: authRef.current.generation + 1 };
        sessionRef.current += 1;
        setUploadComplete(false);
        setFile(null);
        setErrorMessage(null);
        setDragActive(false);
        completionRef.current = null;
        if (successTimerRef.current !== null) {
          clearTimeout(successTimerRef.current);
          successTimerRef.current = null;
          if (!pendingRef.current) inFlightRef.current = false;
        }
      }
      setAuthIdentity({ initialized: true, userId });
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventRevision += 1;
      acceptIdentity(session?.user?.id || null);
    });
    const revision = authEventRevision;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (live && revision === authEventRevision) acceptIdentity(error ? null : data?.user?.id || null);
    }).catch(() => {
      if (live && revision === authEventRevision) acceptIdentity(null);
    });
    return () => {
      live = false;
      mountedRef.current = false;
      authRef.current = { userId: null, generation: authRef.current.generation + 1 };
      completionRef.current = null;
      subscription.unsubscribe();
      if (successTimerRef.current !== null) clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const session = ++sessionRef.current;
    activeRef.current = isOpen;
    setUploading(pendingRef.current);
    setUploadComplete(false);
    if (!pendingRef.current) inFlightRef.current = false;
    return () => {
      activeRef.current = false;
      if (sessionRef.current === session) sessionRef.current += 1;
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
      completionRef.current = null;
      if (!pendingRef.current) inFlightRef.current = false;
    };
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  const selectFile = (selectedFile) => {
    if (inFlightRef.current || !authIdentity.initialized || !authIdentity.userId
      || authIdentity.userId !== authRef.current.userId) return;
    setFile(selectedFile);
    setUploadComplete(false);
    setErrorMessage(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inFlightRef.current) return;
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
    if (inFlightRef.current || !activeRef.current) return;
    const ownerId = authRef.current.userId;
    if (!authIdentity.initialized || !ownerId || authIdentity.userId !== ownerId) return;
    if (recoveryRef.current.some((entry) => entry.ownerId === ownerId && entry.workspaceId === workspaceId)) return;
    if (!workspaceId || !file) {
      setErrorMessage('Select a workspace and document before uploading.');
      return;
    }
    if (!validateSelectedFile(file)) {
      setErrorMessage('Choose a supported document up to 10 MB.');
      return;
    }

    inFlightRef.current = true;
    pendingRef.current = true;
    const session = sessionRef.current;
    const authGeneration = authRef.current.generation;
    const operation = Object.freeze({ operationId: Symbol('upload'), ownerId, workspaceId, filename: file.name });
    operationRef.current = operation;
    setPendingOperation(operation);
    const ownsOperation = () => mountedRef.current && operationRef.current === operation
      && authRef.current.generation === authGeneration && authRef.current.userId === ownerId;
    const isCurrent = () => ownsOperation() && activeRef.current && sessionRef.current === session;
    const requireOwnership = () => {
      if (!ownsOperation()) throw new Error('Upload ownership changed');
    };
    let stage = 'authentication';
    let documentId = null;
    let succeeded = false;
    setUploading(true);
    setErrorMessage(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || authData?.user?.id !== ownerId) throw new Error('Authentication required');
      requireOwnership();
      stage = 'preparation';
      const prepared = await prepareDocumentUpload({
        workspaceId: operation.workspaceId,
        file: {
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
      if (typeof prepared?.document?.id === 'string' && prepared.document.id.trim().length > 0) {
        documentId = prepared.document.id;
      }
      requireOwnership();
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

      requireOwnership();
      stage = 'upload';
      const { error: uploadError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .uploadToSignedUrl(upload.objectPath, upload.signedUploadToken, file, {
          contentType: file.type,
        });
      if (uploadError) {
        throw new Error('Signed document upload failed');
      }

      requireOwnership();
      stage = 'finalization';
      const finalized = await finalizeDocumentUpload({
        workspaceId: operation.workspaceId,
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

      requireOwnership();
      stage = 'confirmed';
      if (!isCurrent()) return;
      succeeded = true;
      setUploadComplete(true);
      setFile(null);
      const completion = Object.freeze({ operationId: operation.operationId, ownerId, authGeneration, session });
      completionRef.current = completion;
      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        if (!mountedRef.current || !activeRef.current || completionRef.current !== completion
          || authRef.current.userId !== completion.ownerId
          || authRef.current.generation !== completion.authGeneration
          || sessionRef.current !== completion.session) return;
        completionRef.current = null;
        setUploadComplete(false);
        setFile(null);
        inFlightRef.current = false;
        activeRef.current = false;
        sessionRef.current += 1;
        onClose();
      }, 1600);
    } catch {
      if (stage !== 'authentication' && stage !== 'confirmed') {
        const recovery = Object.freeze({ ...operation, stage, documentId });
        if (operationRef.current?.operationId === operation.operationId
          && !recoveryRef.current.some((entry) => entry.operationId === operation.operationId)) {
          recoveryRef.current = [...recoveryRef.current, recovery];
          if (mountedRef.current) setRecoveries(recoveryRef.current);
        }
      } else if (isCurrent()) {
        setErrorMessage('Authentication could not be confirmed. Sign in before uploading.');
      }
    } finally {
      if (operationRef.current?.operationId === operation.operationId) {
        pendingRef.current = false;
        if (mountedRef.current) {
          setUploading(false);
          setPendingOperation(null);
          if (authRef.current.userId === ownerId && authRef.current.generation === authGeneration) setFile(null);
        }
        if (!succeeded || !isCurrent()) inFlightRef.current = false;
        operationRef.current = null;
      }
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
                disabled={uploading || uploadComplete}
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
                Drag and drop your document here, or <label className="text-emerald-400 hover:underline cursor-pointer">browse<input type="file" className="hidden" disabled={uploading || uploadComplete || !authIdentity.initialized || !authIdentity.userId} onChange={handleChange} accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg" /></label>
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">Supports PDF, CSV, Excel, PNG, and JPG files up to 10 MB</p>
            </>
          )}
        </div>

        {pendingOperation && (
          <p className="mt-3 text-xs text-zinc-400">
            {authIdentity.userId === pendingOperation.ownerId
              ? `An upload is still being processed: ${pendingOperation.filename} (original workspace: ${pendingOperation.workspaceId}).`
              : 'An earlier request is still settling.'}
            {' '}No new upload can start. A request already sent cannot be canceled here.
          </p>
        )}
        {recoveries.filter((entry) => entry.ownerId === authIdentity.userId && entry.workspaceId === workspaceId).map((entry, index) => (
          <p key={index} className="mt-3 text-xs text-amber-400">
            Upload outcome could not be confirmed. Check Documents before starting another upload.
            {' '}Original workspace: {entry.workspaceId}; file: {entry.filename}.
            {entry.documentId ? ` Document: ${entry.documentId}.` : ''}
            {' '}Uploads in this workspace are paused pending Documents/support review. Opening Documents or reloading does not establish that another upload is safe.
          </p>
        ))}
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
            disabled={!authIdentity.initialized || !authIdentity.userId || !file || uploading || uploadComplete || recoveries.some((entry) => entry.ownerId === authIdentity.userId && entry.workspaceId === workspaceId)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              uploadComplete
                ? 'bg-emerald-500 text-black'
                : !file
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
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
