import React from 'react';

export function Logo({ className = "h-8 w-auto" }) {
  return (
    <svg viewBox="0 0 200 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Icon Mark */}
      <rect width="44" height="44" rx="12" fill="#13151b" stroke="#1f2937" strokeWidth="1.5" />
      <path 
        d="M14 14L22 22L14 30M24 14L32 22L24 30" 
        stroke="#10b981" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle cx="22" cy="22" r="3" fill="#34d399" />
      
      {/* Brand Text */}
      <text x="56" y="27" fill="white" fontFamily="sans-serif" fontWeight="800" fontSize="18" letterSpacing="-0.5">
        ClawAI <tspan fill="#10b981" fontWeight="500">Stack</tspan>
      </text>
    </svg>
  );
}