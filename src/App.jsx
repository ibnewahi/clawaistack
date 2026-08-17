import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import Blog from './pages/Blog';
import Security from './pages/Security';
import Careers from './pages/Careers';
import Auth from './pages/Auth';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/security" element={<Security />} />
      <Route path="/careers" element={<Careers />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}