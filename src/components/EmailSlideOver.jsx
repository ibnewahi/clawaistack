import { X, Check, Pencil, Mail, Sparkles } from 'lucide-react'
import { useEffect } from 'react'

export default function EmailSlideOver({ open, onClose, email, onApprove, sent }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-surface-border bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Collection Email Preview
              </h2>
              <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Sparkles className="h-3 w-3 text-accent" />
                Drafted by AR Collector Claw
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-surface-elevated hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Email meta */}
        <div className="space-y-3 border-b border-surface-border px-6 py-4">
          <div className="flex gap-2 text-xs">
            <span className="w-12 shrink-0 font-medium text-zinc-500">To</span>
            <span className="text-zinc-300">{email.to}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="w-12 shrink-0 font-medium text-zinc-500">
              Subject
            </span>
            <span className="font-medium text-white">{email.subject}</span>
          </div>
        </div>

        {/* Email body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          <div className="rounded-xl border border-surface-border bg-background p-5">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">
              {email.body}
            </pre>
          </div>

          {/* AI confidence badge */}
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs text-zinc-400">
              AI confidence:{' '}
              <span className="font-semibold text-accent">94%</span> — tone
              matched to customer history
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-surface-border px-6 py-4">
          {sent ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-accent/15 py-3 text-sm font-semibold text-accent">
              <Check className="h-4 w-4" />
              Email sent successfully!
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onApprove}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition hover:bg-accent-hover"
              >
                <Check className="h-4 w-4" />
                Approve &amp; Send
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-elevated py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-accent/40 hover:text-white">
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
