import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export function AgentResultModal({ isOpen, onClose, clawKey, data }) {
  if (!isOpen) return null;

  // Helper to parse double-escaped stringified JSON payloads cleanly
  const parseExecutionOutput = (output) => {
    if (!output) return {};
    let parsed = output;

    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        return { text: output };
      }
    }

    // Handle nested escaped audit_details string
    if (parsed && typeof parsed.audit_details === 'string') {
      try {
        parsed.audit_details = JSON.parse(parsed.audit_details);
      } catch (e) {
        // Keep original string if not valid JSON
      }
    }

    return parsed;
  };

  const formattedOutput = parseExecutionOutput(data?.audit_details || data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">
              Agent Execution Result — <span className="text-emerald-400 font-mono">{clawKey}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="bg-[#161922] border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Execution Status</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Success
            </span>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Structured Execution Output
            </p>
            <div className="bg-[#0a0b0e] border border-zinc-800 rounded-xl p-3.5 text-xs font-mono max-h-60 overflow-y-auto">
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(formattedOutput, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#0c0d12] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}