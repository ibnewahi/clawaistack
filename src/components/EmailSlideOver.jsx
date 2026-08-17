import React from 'react';
import { X, Send, Check } from 'lucide-react';

export default function EmailSlideOver({
  isOpen,
  onClose,
  emailData,
  onApproveSend,
  isSent,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border-l border-surface-border p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <h3 className="text-base font-semibold text-white">Review AR Collection Email</h3>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block text-zinc-500 mb-1">Recipient</label>
              <input
                type="text"
                readOnly
                value={emailData?.recipient || ''}
                className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Subject</label>
              <input
                type="text"
                readOnly
                value={emailData?.subject || ''}
                className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Message Body</label>
              <textarea
                rows={12}
                readOnly
                value={emailData?.body || ''}
                className="w-full rounded-lg border border-surface-border bg-background p-3 text-zinc-300 resize-none font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border pt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-surface-border py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={onApproveSend}
            disabled={isSent}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent py-2 text-xs font-semibold text-background hover:bg-accent/90 disabled:opacity-50"
          >
            {isSent ? (
              <>
                <Check className="h-4 w-4" />
                Sent Successfully
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Approve & Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}