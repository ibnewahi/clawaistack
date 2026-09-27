import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { authorizeDocumentDownload, listDocuments } from '../../lib/documentApi';

const formatBytes = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '—';
  if (value === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / (1024 ** unitIndex);
  return `${amount >= 10 || unitIndex === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const safeDownloadFilename = (value) => {
  if (typeof value !== 'string') return 'document';
  const filename = value
    .split(/[\\/]+/)
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  return filename || 'document';
};

const statusClass = (status) => {
  if (status === 'UPLOADED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'FAILED') return 'bg-red-500/10 text-red-400 border-red-500/20';
  return 'bg-zinc-800 text-zinc-400 border-zinc-700';
};

export default function DocumentsView({ selectedWorkspaceId }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState(null);
  const [downloadFeedback, setDownloadFeedback] = useState(null);
  const requestGenerationRef = useRef(0);

  useLayoutEffect(() => {
    requestGenerationRef.current += 1;
    setDocuments([]);
    setLoadError(false);
    setDownloadFeedback(null);
    setDownloadingDocumentId(null);
  }, [selectedWorkspaceId]);

  useEffect(() => {
    const requestGeneration = ++requestGenerationRef.current;
    let cancelled = false;

    setDocuments([]);
    setLoadError(false);
    setDownloadFeedback(null);
    setDownloadingDocumentId(null);

    if (!selectedWorkspaceId) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    const loadDocuments = async () => {
      try {
        const response = await listDocuments({ workspaceId: selectedWorkspaceId });
        if (cancelled || requestGeneration !== requestGenerationRef.current) return;
        setDocuments(Array.isArray(response.documents) ? response.documents : []);
      } catch {
        if (cancelled || requestGeneration !== requestGenerationRef.current) return;
        setDocuments([]);
        setLoadError(true);
      } finally {
        if (!cancelled && requestGeneration === requestGenerationRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadDocuments();
    return () => {
      cancelled = true;
    };
  }, [selectedWorkspaceId, retryVersion]);

  const handleDownload = async (documentRecord) => {
    if (
      !selectedWorkspaceId ||
      documentRecord.status !== 'UPLOADED' ||
      downloadingDocumentId === documentRecord.id
    ) {
      return;
    }

    const workspaceId = selectedWorkspaceId;
    const requestGeneration = requestGenerationRef.current;
    setDownloadingDocumentId(documentRecord.id);
    setDownloadFeedback(null);

    try {
      const response = await authorizeDocumentDownload({
        workspaceId,
        documentId: documentRecord.id,
      });
      if (
        requestGeneration !== requestGenerationRef.current ||
        response.success !== true ||
        !response.document ||
        response.document.id !== documentRecord.id ||
        typeof response.downloadUrl !== 'string' ||
        !response.downloadUrl
      ) {
        if (requestGeneration === requestGenerationRef.current) {
          setDownloadFeedback('Unable to prepare download. Please try again.');
        }
        return;
      }

      const downloadUrl = response.downloadUrl;
      const anchor = window.document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = safeDownloadFilename(response.document.originalFileName);
      anchor.style.display = 'none';
      window.document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
      }

      if (requestGeneration === requestGenerationRef.current) {
        setDownloadFeedback('Download requested.');
      }
    } catch {
      if (requestGeneration === requestGenerationRef.current) {
        setDownloadFeedback('Unable to prepare download. Please try again.');
      }
    } finally {
      if (requestGeneration === requestGenerationRef.current) {
        setDownloadingDocumentId(null);
      }
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="border-b border-zinc-800/60 pb-5">
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-400" />
            Documents
          </h1>
        </div>
        <div className="text-xs text-zinc-500 py-12 text-center">Select a workspace to view documents.</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-zinc-800/60 pb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-400" />
            Documents
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Documents available in the selected workspace.</p>
        </div>
        <button
          type="button"
          onClick={() => setRetryVersion((version) => version + 1)}
          disabled={isLoading}
          className="px-3.5 py-1.5 bg-[#13151b] border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
          Refresh
        </button>
      </div>

      {downloadFeedback && <p className="text-xs text-zinc-400">{downloadFeedback}</p>}

      {isLoading ? (
        <div className="text-center py-16 text-zinc-500 text-xs font-mono animate-pulse">Loading documents…</div>
      ) : loadError ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-zinc-500 text-xs">Unable to load documents. Please try again.</p>
          <button
            type="button"
            onClick={() => setRetryVersion((version) => version + 1)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs">No documents are available for this workspace.</div>
      ) : (
        <div className="bg-[#13151b] border border-zinc-800 rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Original file name</th>
                <th className="px-5 py-3 font-medium">MIME type</th>
                <th className="px-5 py-3 font-medium">File size</th>
                <th className="px-5 py-3 font-medium">Document type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {documents.map((documentRecord) => {
                const canDownload = documentRecord.status === 'UPLOADED';
                const isPreparing = downloadingDocumentId === documentRecord.id;
                return (
                  <tr key={documentRecord.id} className="hover:bg-zinc-900/40 transition">
                    <td className="px-5 py-4 font-medium text-white">{documentRecord.originalFileName || '—'}</td>
                    <td className="px-5 py-4 text-zinc-400">{documentRecord.mimeType || '—'}</td>
                    <td className="px-5 py-4 text-zinc-400">{formatBytes(documentRecord.fileSizeBytes)}</td>
                    <td className="px-5 py-4 text-zinc-400">{documentRecord.documentType || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex border px-2 py-0.5 rounded-full font-mono text-[10px] ${statusClass(documentRecord.status)}`}>
                        {documentRecord.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400">{formatDate(documentRecord.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={!canDownload || isPreparing}
                        onClick={() => handleDownload(documentRecord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                        {isPreparing ? 'Preparing…' : 'Download'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
