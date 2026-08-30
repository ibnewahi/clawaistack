import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Building, Newspaper, Briefcase, ShieldCheck, FileText, Lock } from 'lucide-react';

import SEO from './components/SEO';
import LandingPage from './pages/LandingPage'; 
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/Auth';
import PricingPage from './pages/PricingPage';

// Full Detailed Legal Page Views
const PrivacyPolicyView = () => (
  <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans px-6 py-16">
    <SEO 
      title="Privacy Policy"
      description="Learn how ClawAI Stack collects, encrypts, and protects your financial ledger data and integration keys."
      path="/privacy"
    />
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition mb-8 font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
      </div>

      <div className="p-8 rounded-2xl border border-zinc-800 bg-[#13151b] space-y-6 text-sm leading-relaxed text-zinc-400">
        <p><strong className="text-zinc-200">Effective Date:</strong> January 1, 2026</p>
        <p>At ClawAI Stack, we take your financial data privacy seriously. This Privacy Policy outlines how we collect, process, and protect client ledger data, payment credentials, and system metrics.</p>

        <h2 className="text-base font-semibold text-white pt-2">1. Information Collection & Usage</h2>
        <p>We collect financial metadata, bank transaction read-outs, and enterprise integration keys strictly to execute authorized AI operations such as AR collection, bill matching, and runway modeling.</p>

        <h2 className="text-base font-semibold text-white pt-2">2. Data Isolation & Security</h2>
        <p>Client data is never pooled or used to train public machine learning models. All ledger inputs are processed in isolated operational containers protected by 256-bit AES encryption at rest and TLS 1.3 in transit.</p>

        <h2 className="text-base font-semibold text-white pt-2">3. Third-Party Integrations</h2>
        <p>OAuth access tokens granted to ClawAI Stack for accounting software are encrypted at the hardware security layer (HSM) and can be revoked by the user at any time.</p>

        <h2 className="text-base font-semibold text-white pt-2">4. Your Data Rights</h2>
        <p>You retain 100% ownership of your financial records. You may request a complete export or immediate purge of all stored audit logs by submitting a request to legal@clawaistack.com.</p>
      </div>
    </div>
  </div>
);

const TermsOfServiceView = () => (
  <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans px-6 py-16">
    <SEO 
      title="Terms of Service"
      description="Read the terms and operating guidelines for subscribing to and deploying ClawAI Stack autonomous finance agents."
      path="/terms"
    />
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition mb-8 font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
      </div>

      <div className="p-8 rounded-2xl border border-zinc-800 bg-[#13151b] space-y-6 text-sm leading-relaxed text-zinc-400">
        <p><strong className="text-zinc-200">Last Updated:</strong> March 2026</p>
        <p>By accessing or subscribing to ClawAI Stack, you agree to comply with the following terms governing our autonomous finance operations framework.</p>

        <h2 className="text-base font-semibold text-white pt-2">1. Scope of AI Automation</h2>
        <p>ClawAI Stack provides autonomous finance specialized agents ("Claws") designed for bookkeeping QA, cashflow forecasting, AP matching, and AR recovery. While AI Claws execute tasks automatically, final financial approvals remain under human supervision.</p>

        <h2 className="text-base font-semibold text-white pt-2">2. Subscription & Billing</h2>
        <p>Plans (Starter, Business, CFO Tier) are billed monthly or annually in advance. Subscriptions auto-renew unless cancelled at least 24 hours prior to the billing cycle reset.</p>

        <h2 className="text-base font-semibold text-white pt-2">3. Acceptable Use</h2>
        <p>You agree not to upload fraudulent accounting data, bypass audit safeguards, or attempt reverse engineering of underlying multi-agent routines.</p>

        <h2 className="text-base font-semibold text-white pt-2">4. Limitation of Liability</h2>
        <p>ClawAI Stack is an operational software platform and does not replace certified public accountants (CPAs) or tax counsel. Liability is limited to the subscription amount paid in the preceding 12-month period.</p>
      </div>
    </div>
  </div>
);

const SecurityPolicyView = () => (
  <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans px-6 py-16">
    <SEO 
      title="Security & Audit Logs"
      description="Review ClawAI Stack security architecture, SOC2 compliance, continuous audit trails, and AES-256 encryption specs."
      path="/security"
    />
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition mb-8 font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Security & Audit Logs</h1>
      </div>

      <div className="p-8 rounded-2xl border border-zinc-800 bg-[#13151b] space-y-6 text-sm leading-relaxed text-zinc-400">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          SOC2 Type II Compliant Architecture • Immutable Ledger Logging Active
        </div>

        <h2 className="text-base font-semibold text-white pt-2">1. Continuous Immutable Audit Trails</h2>
        <p>Every execution, automated email send, and reconciliation action performed by an AI Claw generates an append-only audit record tagged with cryptographic hashes.</p>

        <h2 className="text-base font-semibold text-white pt-2">2. Zero-Trust Access Controls</h2>
        <p>We implement strict Role-Based Access Control (RBAC) and optional Single Sign-On (SSO) with Multi-Factor Authentication (MFA) to prevent unauthorized entry into system workflows.</p>

        <h2 className="text-base font-semibold text-white pt-2">3. Encryption Standards</h2>
        <p>All financial API payloads are protected via TLS 1.3 encryption in transit and AES-256 encryption at rest. Database secrets are rotated automatically every 30 days.</p>
      </div>
    </div>
  </div>
);

// React Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', backgroundColor: '#090a0f', color: '#ef4444', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Runtime Render Crash Detected</h1>
          <pre style={{ backgroundColor: '#18181b', padding: '20px', borderRadius: '8px', color: '#f43f5e', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: '20px', color: '#a1a1aa' }}>
            Check the console or fix the module mentioned in the error trace above.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Security Guard Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('clawai_auth') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Generic Static Page Wrapper for Company Info
const InformationPage = ({ title, icon: Icon, description, path }) => (
  <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-emerald-500/30 px-6 py-16">
    <SEO 
      title={title}
      description={description}
      path={path}
    />
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
    <ErrorBoundary>
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

        {/* Dedicated Legal Routes */}
        <Route path="/privacy" element={<PrivacyPolicyView />} />
        <Route path="/terms" element={<TermsOfServiceView />} />
        <Route path="/security" element={<SecurityPolicyView />} />

        {/* Company Routes */}
        <Route 
          path="/about" 
          element={
            <InformationPage 
              title="About ClawAI Stack" 
              icon={Building} 
              description="ClawAI Stack builds specialized, autonomous AI finance agents designed to streamline bookkeeping, cash-flow forecasting, AR collections, AP processing, and controller oversight."
              path="/about"
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
              path="/blog"
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
              path="/careers"
            />
          } 
        />

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}