import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, AlertCircle, Shield, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const from = location.state?.from?.pathname || '/';

  const handleDigitChange = (index, value) => {
    // Accepter seulement les chiffres
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus sur le prochain digit
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si tous les chiffres sont remplis, soumettre automatiquement
    if (value && index === 5 && newCode.every(d => d !== '')) {
      submitCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const fullCode = code.join('');
      if (fullCode.length === 6) {
        submitCode(fullCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    setError('');

    // Focus sur le dernier champ rempli ou le prochain vide
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit si code complet
    if (pasted.length === 6) {
      submitCode(pasted);
    }
  };

  const submitCode = async (fullCode) => {
    setError('');
    setLoading(true);

    const result = await login(fullCode);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
      // Vider le code et refocus
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      submitCode(fullCode);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-gradient-v2">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:p-4 relative z-10 safe-area-all">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
              <img 
                src="/logo.png" 
                alt="Logi-Track V2" 
                className="h-16 sm:h-20 w-auto drop-shadow-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur items-center justify-center">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Logi-Track</h1>
            <div className="inline-block px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-sm mb-3">
              <span className="text-sm font-semibold text-primary-200 tracking-wide">V2</span>
            </div>
            <p className="text-primary-200 text-base sm:text-lg">
              Système de gestion et suivi
            </p>
          </div>

          {/* Form card */}
          <div className="card p-5 sm:p-6 animate-slideUp">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 mb-4">
                <KeyRound className="w-7 h-7 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
              <p className="text-gray-500 mt-1">Entrez votre code à 6 chiffres</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Code input (6 digits) */}
              <div>
                <label className="label text-center block mb-3">Code de connexion</label>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => inputRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={`
                        w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 
                        transition-all duration-200 outline-none
                        ${error 
                          ? 'border-danger-300 bg-danger-50 text-danger-600' 
                          : digit 
                            ? 'border-primary-400 bg-primary-50 text-primary-700' 
                            : 'border-gray-200 bg-gray-50 text-gray-900'
                        }
                        focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:bg-white
                      `}
                      disabled={loading}
                      autoFocus={i === 0}
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || code.some(d => d === '')}
                className="w-full btn-primary py-3 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            {/* Hint */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Contactez l'administrateur si vous avez oublié votre code
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 sm:py-4 text-center relative z-10 safe-area-bottom">
        <p className="text-xs sm:text-sm tracking-wide">
          <span className="font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">Azizi Mounir</span>
        </p>
      </footer>
    </div>
  );
}
