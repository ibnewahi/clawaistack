import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

const testimonials = [
  {
    quote: "ClawAI Stack automated our entire accounts payable and monthly bookkeeping review. It saves our team at least 20 hours of manual reconciliation every single month.",
    author: "Marcus Vance",
    role: "Managing Director",
    company: "Vance Financial Advisory",
    rating: 5,
  },
  {
    quote: "The cash runway forecasting and automated AR follow-ups have completely transformed our cash flow visibility. It feels like having a senior fractional CFO on staff 24/7.",
    author: "Sarah Lin",
    role: "Co-Founder & CEO",
    company: "Apex SaaS Solutions",
    rating: 5,
  },
  {
    quote: "Setup with our accounting stack took less than ten minutes. The double-entry audit logs gave us total peace of mind heading into our quarterly tax filings.",
    author: "David O'Connor",
    role: "Head of Operations",
    company: "Meridian Logistics",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="border-t border-zinc-800/80 px-6 py-24 bg-[#090a0f] z-10 relative">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Social Proof
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl tracking-tight">
            Trusted by modern finance teams
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            See how founders, controllers, and finance leaders use autonomous AI claws to streamline operations.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#13151b] p-8 shadow-xl relative group hover:border-emerald-500/40 transition duration-300"
            >
              <div className="absolute top-6 right-6 text-emerald-500/20 group-hover:text-emerald-500/40 transition">
                <Quote className="h-8 w-8" />
              </div>

              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-zinc-300 italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{item.author}</h3>
                  <p className="text-xs text-zinc-400">{item.role}, <span className="text-emerald-400">{item.company}</span></p>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}