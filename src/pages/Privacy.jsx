import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 px-6 py-16">
  <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-emerald-400 hover:underline mb-8 inline-block">&larr; Back to Home</Link>
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-slate-400 mb-4">Last updated: August 2026</p>
      
      <div className="space-y-6 text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">1. Information We Collect</h2>
          <p>We collect account details (such as email addresses) provided during signup, usage data, and essential cookies required for authentication.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">2. How We Use Information</h2>
          <p>Your information is strictly used to provide, maintain, and secure your access to Claw AI Stack services and authentication workflows.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">3. Data Security</h2>
          <p>We utilize industry-standard encryption and row-level security policies through Supabase to protect your data from unauthorized access.</p>
        </section>
        </div>
      </div>
    </div>
  );
}