import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, ArrowRight, Lock } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate secure authentication check
    setTimeout(() => {
      // 1. Set authentication token in browser storage
      localStorage.setItem('clawai_auth', 'true');
      
      // 2. Clear loading and push to dashboard
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            C
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">ClawAI Stack</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Or <Link to="/" className="font-medium text-emerald-400 hover:text-emerald-300">return to home page</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#13151b] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-800/80">
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-800 bg-[#090a0f] rounded-xl shadow-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="cfo@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-800 bg-[#090a0f] rounded-xl shadow-sm placeholder-zinc-500 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-[#090a0f] bg-emerald-500 hover:bg-emerald-400 focus:outline-none transition cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4 animate-pulse" /> Authorizing...
                  </span>
                ) : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}