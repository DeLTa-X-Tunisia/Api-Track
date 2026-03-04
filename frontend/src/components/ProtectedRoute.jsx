import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Route protégée pour les pages système admin uniquement
 */
export function SystemAdminRoute({ children }) {
  const { isSystemAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!isSystemAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <ShieldX className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-gray-500 max-w-md">
          Cette page est réservée aux administrateurs système.
        </p>
      </div>
    );
  }

  return children;
}
