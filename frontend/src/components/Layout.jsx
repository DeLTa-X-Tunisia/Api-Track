import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import { settingsApi } from '../services/api';
import { 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  Settings,
  Shield,
  Search,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Factory,
  Package,
  Lock,
  Users,
  SlidersHorizontal,
  Play,
  Cylinder,
  FileSpreadsheet
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Dashboard (toujours visible, hors section)
const dashboardItem = { label: 'Tableau de bord', href: '/', icon: LayoutDashboard, color: 'text-primary-500' };

// Paramètre de production (visible admin seulement)
const productionParamsItems = [
  { label: 'Paramètres Soudure', href: '/presets-soudure', icon: SlidersHorizontal, color: 'text-violet-500' },
  { label: 'Équipe de Production', href: '/equipes-production', icon: Users, color: 'text-indigo-500' },
];

// Étapes de Production - sera enrichi module par module
const productionItems = [
  { label: 'Bobines en Stock', href: '/bobines', icon: Package, color: 'text-teal-500' },
  { label: 'Bobine de Production', href: '/bobines-production', icon: Play, color: 'text-amber-500' },
  { label: 'Tubes', href: '/tubes', icon: Cylinder, color: 'text-blue-500' },
  { label: 'Rapports', href: '/rapports', icon: FileSpreadsheet, color: 'text-emerald-500' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin, canManageUsers } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectSettings, setProjectSettings] = useState({});
  const userMenuRef = useRef(null);

  // Charger les paramètres du projet pour le header
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await settingsApi.getAll();
        const map = {};
        data.forEach(s => { map[s.setting_key] = s.setting_value; });
        setProjectSettings(map);
      } catch (err) {
        // Silently fail - header will just not show project info
      }
    };
    fetchSettings();
  }, []);

  // Écouter les mises à jour des settings (refresh quand on revient sur la page)
  useEffect(() => {
    const refreshSettings = async () => {
      try {
        const { data } = await settingsApi.getAll();
        const map = {};
        data.forEach(s => { map[s.setting_key] = s.setting_value; });
        setProjectSettings(map);
      } catch (err) { /* ignore */ }
    };
    // Refresh settings when navigating (e.g. after editing settings page)
    refreshSettings();
  }, [location.pathname]);

  // Connecter Socket.io
  useEffect(() => {
    socketService.connect();
    return () => socketService.disconnect();
  }, []);

  // Fermer le menu utilisateur au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer le sidebar mobile au changement de page
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Bloquer le scroll du body quand le sidebar mobile est ouvert
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ============ SIDEBAR ============ */}
      
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:w-[72px] w-64' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none lg:static
        flex flex-col
        safe-area-left
      `}>
        {/* Logo */}
        <div className={`relative flex items-center justify-center ${sidebarCollapsed ? 'px-2' : 'px-5'} h-24 border-b border-gray-200 flex-shrink-0`}>
          {(!sidebarCollapsed || !window.matchMedia('(min-width: 1024px)').matches) && (
            <Link to="/" className="flex items-center justify-center group">
              <img 
                src="/logo.png" 
                alt="Logi-Track V2" 
                className="h-20 w-auto drop-shadow-lg group-hover:scale-105 transition-transform"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/" className="hidden lg:flex items-center justify-center group">
              <img 
                src="/logo.png" 
                alt="LT" 
                className="h-10 w-auto drop-shadow-lg group-hover:scale-110 transition-transform"
                onError={(e) => { 
                  e.target.style.display = 'none'; 
                }}
              />
            </Link>
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors touch-target"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
          {/* Dashboard */}
          <div className={`space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {(() => {
              const Icon = dashboardItem.icon;
              const active = isActive(dashboardItem.href);
              return (
                <Link
                  to={dashboardItem.href}
                  title={sidebarCollapsed ? dashboardItem.label : ''}
                  className={`
                    flex items-center gap-3 rounded-xl transition-all duration-200 group
                    ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                    ${active 
                      ? 'bg-primary-50 text-primary-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : dashboardItem.color || 'text-gray-400'} group-hover:scale-110 transition-transform`} />
                  {!sidebarCollapsed && (
                    <span className={`truncate ${active ? 'font-medium' : ''}`}>{dashboardItem.label}</span>
                  )}
                  {active && !sidebarCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                  )}
                </Link>
              );
            })()}
          </div>

          {/* Section: Paramètre de production (admin seulement) */}
          {isAdmin && (
            <div className={`mt-4 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
              {!sidebarCollapsed && (
                <p className="px-3 pt-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Paramètre de production
                </p>
              )}
              {sidebarCollapsed && (
                <div className="my-2 mx-1 border-t border-gray-200" />
              )}
              <div className="space-y-1">
                {productionParamsItems.length > 0 ? productionParamsItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={sidebarCollapsed ? item.label : ''}
                      className={`
                        flex items-center gap-3 rounded-xl transition-all duration-200 group
                        ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                        ${active 
                          ? 'bg-primary-50 text-primary-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : item.color || 'text-gray-400'} group-hover:scale-110 transition-transform`} />
                      {!sidebarCollapsed && (
                        <span className={`truncate ${active ? 'font-medium' : ''}`}>{item.label}</span>
                      )}
                    </Link>
                  );
                }) : (
                  !sidebarCollapsed && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400">
                      <SlidersHorizontal className="w-4 h-4 text-gray-300" />
                      <span className="text-sm italic">Modules à venir</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Section: Étapes de Production */}
          <div className={`mt-4 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {!sidebarCollapsed && (
              <p className="px-3 pt-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Étapes de Production
              </p>
            )}
            {sidebarCollapsed && (
              <div className="my-2 mx-1 border-t border-gray-200" />
            )}
            <div className="space-y-1">
              {productionItems.length > 0 ? productionItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={sidebarCollapsed ? item.label : ''}
                    className={`
                      flex items-center gap-3 rounded-xl transition-all duration-200 group
                      ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                      ${active 
                        ? 'bg-primary-50 text-primary-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : item.color || 'text-gray-400'} group-hover:scale-110 transition-transform`} />
                    {!sidebarCollapsed && (
                      <span className={`truncate ${active ? 'font-medium' : ''}`}>{item.label}</span>
                    )}
                  </Link>
                );
              }) : (
                !sidebarCollapsed && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400">
                    <Lock className="w-4 h-4 text-gray-300" />
                    <span className="text-sm italic">Modules à venir</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className={`my-4 mx-4 border-t border-gray-200`} />
              <div className={`${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
                {!sidebarCollapsed && (
                  <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Administration
                  </p>
                )}
                <div className="space-y-1">
                  {canManageUsers && (
                    <Link
                      to="/utilisateurs"
                      title={sidebarCollapsed ? 'Utilisateurs' : ''}
                      className={`
                        flex items-center gap-3 rounded-xl transition-all duration-200
                        ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                        ${isActive('/utilisateurs') 
                          ? 'bg-primary-50 text-primary-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Users className={`w-5 h-5 flex-shrink-0 ${isActive('/utilisateurs') ? 'text-primary-600' : 'text-indigo-500'}`} />
                      {!sidebarCollapsed && <span className={isActive('/utilisateurs') ? 'font-medium' : ''}>Utilisateurs</span>}
                      {isActive('/utilisateurs') && !sidebarCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                      )}
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    title={sidebarCollapsed ? 'Paramètres' : ''}
                    className={`
                      flex items-center gap-3 rounded-xl transition-all duration-200
                      ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                      ${isActive('/settings') 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className={isActive('/settings') ? 'font-medium' : ''}>Paramètres</span>}
                  </Link>
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex items-center justify-center py-3 border-t border-gray-200">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            title={sidebarCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* User card at bottom */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            {/* Left: Mobile menu + Project info (logos + client + project) */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Project identity bar */}
              {(() => {
                const token = localStorage.getItem('logitrack2_token');
                const eLogo = projectSettings.enterprise_logo;
                const cLogo = projectSettings.client_logo;
                const cName = projectSettings.client_name;
                const pName = projectSettings.project_name;
                const pCode = projectSettings.project_code;
                const hasLogos = eLogo || cLogo;
                const hasText = cName || pName || pCode;
                const hasContent = hasLogos || hasText;

                if (!hasContent) {
                  // Fallback: show page title if no settings
                  return (
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-none">
                      {(() => {
                        const allItems = [
                          dashboardItem, 
                          ...productionParamsItems,
                          ...productionItems,
                          { label: 'Utilisateurs', href: '/utilisateurs' },
                          { label: 'Paramètres', href: '/settings' }
                        ];
                        return allItems.find(i => isActive(i.href))?.label || 'Logi-Track V2';
                      })()}
                    </h2>
                  );
                }

                return (
                  <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-xl px-2.5 sm:px-4 py-1.5 border border-gray-100 min-w-0 overflow-hidden">
                    {/* Enterprise Logo */}
                    {eLogo && (
                      <img
                        src={`${API_URL}${eLogo}${eLogo.includes('?') ? '&' : '?'}token=${token}`}
                        alt="Logo entreprise"
                        className="h-6 sm:h-8 w-auto object-contain flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {/* Client Logo */}
                    {cLogo && (
                      <img
                        src={`${API_URL}${cLogo}${cLogo.includes('?') ? '&' : '?'}token=${token}`}
                        alt="Logo client"
                        className="h-6 sm:h-8 w-auto object-contain flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {/* Separator */}
                    {hasLogos && hasText && (
                      <div className="w-px h-6 sm:h-7 bg-gray-200 flex-shrink-0" />
                    )}
                    {/* Text info */}
                    {hasText && (
                      <div className="min-w-0">
                        {cName && (
                          <p className="text-xs sm:text-sm font-bold text-gray-800 truncate leading-tight">{cName}</p>
                        )}
                        {(pName || pCode) && (
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate leading-tight">
                            {pName}
                            {pName && pCode && '  '}
                            {pCode && <span className="text-blue-600 font-semibold">({pCode})</span>}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Right: User menu */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user?.prenom?.[0]}{user?.nom?.[0]}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">{user?.prenom} {user?.nom}</p>
                    <p className="text-[11px] text-gray-400 capitalize">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-fadeIn z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Paramètres
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-4 sm:px-6 py-3 safe-area-bottom">
          <div className="flex items-center justify-center">
            <p className="text-xs text-gray-400 flex items-center gap-1 flex-wrap justify-center">
              <img src="https://flagcdn.com/w40/tn.png" alt="🇹🇳" className="inline h-5 w-auto rounded-sm" /> ❤️ <span className="font-bold text-primary-600">Azizi Mounir</span> ❤️ <img src="https://flagcdn.com/w40/tn.png" alt="🇹🇳" className="inline h-5 w-auto rounded-sm" />
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
