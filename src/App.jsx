import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Lock, Building, Newspaper, Briefcase } from 'lucide-react';

import LandingPage from './pages/LandingPage'; 
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/Auth';
import PricingPage from './pages/PricingPage'; // <--- Imported Pricing Page

// Security Guard Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('clawai_auth') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Generic Static Page Wrapper for Legal & Company Info
const InformationPage = ({ title, icon: Icon, description }) => (
  <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-emerald-500/30 px-6 py-16">
    <div className="max-w-3xl mx-auto">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition mb-8 font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Icon className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
      </div>

      <div className="p-8 rounded-2xl border border-zinc-800 bg-[#13151b] space-y-4">
        <p className="text-zinc-300 leading-relaxed text-base">
          {description}
        </p>
        <p className="text-sm text-zinc-500">
          For any specific inquiries regarding our {title.toLowerCase()} policies or operations, please contact support@clawaistack.com.
        </p>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <Routes>
      {/* Core Application & Pricing Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      
      <Route 
        path="/pricing" 
        element={
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Dashboard Routes with Wildcard for Sub-views */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Legal Routes */}
      <Route 
        path="/privacy" 
        element={
          <InformationPage 
            title="Privacy Policy" 
            icon={Lock} 
            description="At ClawAI Stack, we prioritize the confidentiality and protection of your organization's financial records. All data ingested by our autonomous AI Claws is encrypted in transit and at rest using bank-grade encryption protocols."
          />
        } 
      />
      <Route 
        path="/terms" 
        element={
          <InformationPage 
            title="Terms of Service" 
            icon={FileText} 
            description="By accessing and deploying ClawAI Stack autonomous agents, you agree to our service level terms, usage parameters, and platform operational guidelines."
          />
        } 
      />
      <Route 
        path="/security" 
        element={
          <InformationPage 
            title="Security Overview" 
            icon={Shield} 
            description="Our multi-tenant architecture enforces strict Row-Level Security (RLS), isolated API token scopes, and complete audit logging for every financial transaction or action executed."
          />
        } 
      />

      {/* Company Routes */}
      <Route 
        path="/about" 
        element={
          <InformationPage 
            title="About ClawAI Stack" 
            icon={Building} 
            description="ClawAI Stack builds specialized, autonomous AI finance agents designed to streamline bookkeeping, cash-flow forecasting, AR collections, AP processing, and controller oversight."
          />
        } 
      />
      <Route 
        path="/blog" 
        element={
          <InformationPage 
            title="Blog & Insights" 
            icon={Newspaper} 
            description="Explore our latest engineering notes, autonomous AI architecture deep dives, and modern CFO playbooks."
          />
        } 
      />
      <Route 
        path="/careers" 
        element={
          <InformationPage 
            title="Careers" 
            icon={Briefcase} 
            description="We are building the future of autonomous finance operations. Check back soon for open roles in AI engineering and financial software development."
          />
        } 
      />

      {/* Fallback Catch-All Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}