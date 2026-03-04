import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';
import ProtectedRoute, { SystemAdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { maintenanceApi } from './services/api';

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
const AdminSupervision = lazy(() => import('./pages/AdminSupervision'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));

// Spinner de chargement pour Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="text-sm text-gray-400">Chargement...</span>
    </div>
  </div>
);

// Maintenance checker wrapper - checks if app is in maintenance mode
// Now accepts allowLogin prop to bypass maintenance for login page
function MaintenanceChecker({ children, allowLogin = false }) {
  const [maintenance, setMaintenance] = useState({ active: false, message: '', checked: false });
  const { user, isSystemAdmin } = useAuth();

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const status = await maintenanceApi.getStatus();
        setMaintenance({ 
          active: status.maintenance, 
          message: status.message || '', 
          checked: true 
        });
      } catch {
        setMaintenance(prev => ({ ...prev, checked: true }));
      }
    };

    checkMaintenance();
    // Re-check periodically
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show loading until first check is done
  if (!maintenance.checked) {
    return <PageLoader />;
  }

  // Allow login page to bypass maintenance
  if (allowLogin) {
    return children;
  }

  // If maintenance is active and user is not system_admin, show maintenance page
  if (maintenance.active && !isSystemAdmin) {
    return (
      <Suspense fallback={<PageLoader />}>
        <MaintenancePage message={maintenance.message} />
      </Suspense>
    );
  }

  return children;
}

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Route publique - Login accessible même en maintenance */}
              <Route path="/login" element={
                <MaintenanceChecker allowLogin={true}>
                  <Suspense fallback={<PageLoader />}>
                    <Login />
                  </Suspense>
                </MaintenanceChecker>
              } />
                
              {/* Routes protégées - Vérification maintenance */}
              <Route path="/*" element={
                <MaintenanceChecker>
                  <ProtectedRoute>
                    <Layout>
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/utilisateurs" element={<SystemAdminRoute><GestionUtilisateurs /></SystemAdminRoute>} />
                            <Route path="/bobines" element={<BobinesEnStock />} />
                            <Route path="/presets-soudure" element={<ParametresSoudure />} />
                            <Route path="/equipes-production" element={<EquipesProduction />} />
                            <Route path="/bobines-production" element={<BobineProduction />} />
                            <Route path="/tubes" element={<Tubes />} />
                            <Route path="/rapports" element={<Rapports />} />
                            <Route path="/supervision" element={<SystemAdminRoute><AdminSupervision /></SystemAdminRoute>} />
                            <Route path="/settings" element={<Settings />} />
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                </MaintenanceChecker>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
