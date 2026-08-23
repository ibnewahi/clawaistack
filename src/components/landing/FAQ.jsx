import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "How secure is my financial and bank data with ClawAI Stack?",
    answer: "We use bank-grade 256-bit encryption for all data in transit and at rest. Read-only bank integrations are securely handled via top-tier providers like Plaid, ensuring our AI claws can reconcile ledgers without ever storing or having access to your credentials or fund transfer permissions."
  },
  {
    question: "Which accounting systems and ERPs do the AI claws integrate with?",
    answer: "ClawAI Stack features native, bi-directional synchronization with popular financial platforms including Odoo ERP, Zoho Books, QuickBooks Online, Xero, and Stripe. Updates made by the AI claws are instantly synced to your ledger with complete audit trails."
  },
  {
    question: "Can I review transactions before the AI executes automated actions?",
    answer: "Yes! You have full control over your automation settings. You can set thresholds so that routine workflows (like categorization and gentle AR follow-ups) run completely autonomously, while major payments or anomaly flags require human-in-the-loop sign-off from your controller or CFO."
  },
  {
    question: "How long does it take to set up and connect my first AI claw?",
    answer: "Setup typically takes under 10 minutes. Once you link your preferred accounting software or bank feed, your initial AI claws begin analyzing historical ledger data and flagging immediate cost-saving opportunities almost instantly."
  },
  {
    question: "Are the audit logs compliant with standard tax and accounting regulations?",
    answer: "Absolutely. Every action taken by the AI generates a verifiable, immutable double-entry audit log complete with timestamping, line-item references, and confidence scores designed to make tax season and audits seamless."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="border-t border-zinc-800/80 px-6 py-24 bg-[#090a0f] z-10 relative">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-3">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-5xl tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Everything you need to know about deploying autonomous AI financial agents.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-[#13151b] overflow-hidden transition duration-300 hover:border-emerald-500/30"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                >
                  <span className="text-base font-semibold text-white pr-4">
                    {faq.question}
                  </span>
                  <div className={`h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-emerald-500/10 border-emerald-500/30' : ''}`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}