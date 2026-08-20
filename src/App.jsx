import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage'; 
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/Auth';

// Security Guard Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('clawai_auth') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Protected Dashboard Route */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}