import React from 'react';

export function Logo({ className = "h-8 w-auto" }) {
  return (
    <div className="flex items-center gap-3">
      <img 
        src="/logo.png" 
        alt="ClawAI Stack Logo" 
        className={className} 
      />
      <span className="text-white font-extrabold text-lg tracking-tight font-sans">
        ClawAI <span className="text-emerald-400 font-medium">Stack</span>
      </span>
    </div>
  );
}