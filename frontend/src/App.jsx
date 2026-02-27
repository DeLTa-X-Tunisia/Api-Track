import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load des pages (code splitting)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const GestionUtilisateurs = lazy(() => import('./pages/GestionUtilisateurs'));
const BobinesEnStock = lazy(() => import('./pages/BobinesEnStock'));
const ParametresSoudure = lazy(() => import('./pages/ParametresSoudure'));
const EquipesProduction = lazy(() => import('./pages/EquipesProduction'));
const BobineProduction = lazy(() => import('./pages/BobineProduction'));
const Tubes = lazy(() => import('./pages/Tubes'));
const Rapports = lazy(() => import('./pages/Rapports'));

// Spinner de chargement pour Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="text-sm text-gray-400">Chargement...</span>
    </div>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Route publique */}
              <Route path="/login" element={
                <Suspense fallback={<PageLoader />}>
                  <Login />
                </Suspense>
              } />
              
              {/* Routes protégées */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/utilisateurs" element={<GestionUtilisateurs />} />
                          <Route path="/bobines" element={<BobinesEnStock />} />
                          <Route path="/presets-soudure" element={<ParametresSoudure />} />
                          <Route path="/equipes-production" element={<EquipesProduction />} />
                          <Route path="/bobines-production" element={<BobineProduction />} />
                          <Route path="/tubes" element={<Tubes />} />
                          <Route path="/rapports" element={<Rapports />} />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                      </Suspense>
                    </ErrorBoundary>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
