import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Wrench, Clock, RefreshCw, Shield } from 'lucide-react';

/**
 * MaintenancePage - Modern maintenance page with elegant animations
 * Displayed when Api-Track is in maintenance mode
 */
export default function MaintenancePage({ message }) {
  const navigate = useNavigate();
  const [dots, setDots] = useState('');
  const [time, setTime] = useState(new Date());
  const [showAdminHint, setShowAdminHint] = useState(false);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-lg w-full">
        {/* Logo/Icon container */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 w-32 h-32 -m-4">
              <div className="w-full h-full border-4 border-violet-500/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-violet-500 rounded-full" />
              </div>
            </div>
            
            {/* Inner pulsing circle */}
            <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <div className="relative">
                <Settings className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '4s' }} />
                <Wrench className="w-6 h-6 text-violet-200 absolute -bottom-1 -right-1 animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Maintenance en cours{dots}
          </h1>
          <div className="flex items-center justify-center gap-2 text-violet-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{time.toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>

        {/* Message card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                {message || "Api-Track est actuellement en maintenance. Notre équipe travaille pour améliorer votre expérience. Nous serons de retour très bientôt !"}
              </p>
            </div>
          </div>
        </div>

        {/* Info boxes */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-violet-400 mb-1">24/7</div>
            <div className="text-xs text-white/50 uppercase tracking-wide">Support actif</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mb-1">99.9%</div>
            <div className="text-xs text-white/50 uppercase tracking-wide">Disponibilité</div>
          </div>
        </div>

        {/* Refresh hint */}
        <div className="text-center">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <p className="text-white/40 text-sm mt-4">
            La page se rechargera automatiquement quand le service sera disponible
          </p>
        </div>

        {/* Footer with hidden admin access */}
        <div className="text-center mt-12">
          <div 
            className="inline-flex items-center gap-2 text-white/30 text-sm cursor-pointer select-none"
            onClick={() => setShowAdminHint(prev => !prev)}
            title=""
          >
            <span className="font-semibold text-violet-400">Api-Track</span>
            <span>•</span>
            <span>V2.9</span>
          </div>
          
          {/* Hidden admin login access - appears after clicking footer */}
          {showAdminHint && (
            <div className="mt-4 animate-fadeIn">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white/90 rounded-lg text-xs font-medium transition-all duration-300"
              >
                <Shield className="w-3.5 h-3.5" />
                Accès administrateur
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-violet-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
