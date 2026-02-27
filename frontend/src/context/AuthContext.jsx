import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('logitrack2_token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('logitrack2_token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.user) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Erreur de vérification du token:', error);
          localStorage.removeItem('logitrack2_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (code) => {
    try {
      const response = await api.post('/auth/login', { code });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('logitrack2_token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur de connexion' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('logitrack2_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isSystemAdmin: user?.role === 'system_admin',
    isAdmin: user?.role === 'system_admin' || user?.role === 'admin',
    isSupervisor: user?.role === 'superviseur',
    isConsultant: user?.role === 'consultant',
    canManageUsers: user?.role === 'system_admin',
    canAct: user?.role === 'system_admin' || user?.role === 'admin' || user?.role === 'superviseur'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
