import React from 'react';
import { Link } from 'react-router-dom';

export default function Security() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-emerald-400 hover:underline mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold mb-6">Security & Compliance</h1>
        <p className="text-slate-300 leading-relaxed mb-4">
          We maintain strict end-to-end data safety protocols, row-level access controls, and database isolation across all automated workflows.
        </p>
      </div>
    </div>
  );
}