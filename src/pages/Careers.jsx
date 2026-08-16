import React from 'react';
import { Link } from 'react-router-dom';

export default function Careers() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-emerald-400 hover:underline mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold mb-6">Join Our Team</h1>
        <p className="text-slate-300 leading-relaxed mb-6">
          We are building autonomous AI tools to transform financial management and bookkeeping operations.
        </p>
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-slate-400">There are no open positions at the moment, but feel free to check back soon!</p>
        </div>
      </div>
    </div>
  );
}