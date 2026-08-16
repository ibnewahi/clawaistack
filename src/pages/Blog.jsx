import React from 'react';
import { Link } from 'react-router-dom';

export default function Blog() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-emerald-400 hover:underline mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold mb-6">Blog & Insights</h1>
        <p className="text-slate-400">Updates, technical breakdowns, and articles coming soon.</p>
      </div>
    </div>
  );
}