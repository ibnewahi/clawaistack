import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 px-6 py-16">
  <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-emerald-400 hover:underline mb-8 inline-block">&larr; Back to Home</Link>
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <p className="text-slate-400 mb-4">Last updated: August 2026</p>

      <div className="space-y-6 text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using Claw AI Stack, you agree to be bound by these Terms of Service and all applicable laws.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">2. User Conduct</h2>
          <p>You agree not to misuse the platform, attempt unauthorized database access, or interfere with service operations.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">3. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate system security protocols or terms of usage.</p>
        </section>
        </div>
      </div>
    </div>
  );
}