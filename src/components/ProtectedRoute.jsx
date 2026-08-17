import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ session, loading, children }) {
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}