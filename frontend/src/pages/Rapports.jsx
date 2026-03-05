import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { reportsApi } from '../services/api';
import {
  FileSpreadsheet, Download, Loader2, FileText,
  Package, Layers, Cylinder, Wrench, LayoutGrid,
  CheckCircle, ArrowRight, ArrowLeft, Globe
} from 'lucide-react';

// ============================================
// Types de rapports disponibles
// ============================================
const REPORT_TYPES = [
  {
    id: 'situation-generale',
    label: 'Situation Générale',
    description: 'Tubes + Réparations (Excel)',
    icon: LayoutGrid,
    color: 'emerald',
    badge: 'EXCEL',
    badgeColor: 'bg-emerald-500',
    available: true,
  },
  {
    id: 'bobines',
    label: 'Bobines',
    description: "Rapport des bobines d'acier",
    icon: Package,
    color: 'blue',
    badge: null,
    available: false,
  },
  {
    id: 'lots',
    label: 'Lots',
    description: 'Rapport des lots de production',
    icon: Layers,
    color: 'amber',
    badge: null,
    available: false,
  },
  {
    id: 'tubes',
    label: 'Tubes',
    description: 'Rapport des tubes fabriqués',
    icon: Cylinder,
    color: 'blue',
    badge: null,
    available: false,
  },
  {
    id: 'reparations',
    label: 'Réparations',
    description: 'Historique des réparations',
    icon: Wrench,
    color: 'orange',
    badge: null,
    available: false,
  },
];

// ============================================
// COULEURS PAR TYPE
// ============================================
const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50', border: 'border-blue-200', hoverBorder: 'hover:border-blue-400',
    activeBorder: 'border-blue-500', activeBg: 'bg-blue-50', activeRing: 'ring-blue-200',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-50', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400',
    activeBorder: 'border-emerald-500', activeBg: 'bg-emerald-50', activeRing: 'ring-emerald-200',
    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50', border: 'border-amber-200', hoverBorder: 'hover:border-amber-400',
    activeBorder: 'border-amber-500', activeBg: 'bg-amber-50', activeRing: 'ring-amber-200',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
  },
  orange: {
    bg: 'bg-orange-50', border: 'border-orange-200', hoverBorder: 'hover:border-orange-400',
    activeBorder: 'border-orange-500', activeBg: 'bg-orange-50', activeRing: 'ring-orange-200',
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
  },
};

// ============================================
// WIZARD STEPS
// ============================================
const STEPS = [
  { number: 1, label: 'Type de données' },
  { number: 2, label: 'Aperçu' },
  { number: 3, label: 'Action' },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function Rapports() {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [language, setLanguage] = useState('fr'); // 'fr' ou 'en'

  // Load stats on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await reportsApi.getStats();
        setStats(res.data);
      } catch {
        // silent fail
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  const handleSelectReport = (report) => {
    if (!report.available) {
      toast.info('Ce rapport sera disponible dans une prochaine version');
      return;
    }
    setSelectedReport(report);
    setCurrentStep(2);
    setDownloadComplete(false);
  };

  const handleDownload = async () => {
    if (!selectedReport) return;
    setDownloading(true);
    setDownloadComplete(false);
    try {
      let response;
      if (selectedReport.id === 'situation-generale') {
        response = await reportsApi.downloadSituationGenerale(language);
      }
      if (response) {
        // Create download link
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const filePrefix = language === 'en' ? 'General_Status' : 'Situation_Generale';
        link.href = url;
        link.download = `${filePrefix}_LogiTrack_${dateStr}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setDownloadComplete(true);
        setCurrentStep(3);
        toast.success(language === 'en' ? 'Excel file downloaded successfully' : 'Fichier Excel téléchargé avec succès');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setSelectedReport(null);
    setCurrentStep(1);
    setDownloadComplete(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <span className="text-xl sm:text-2xl">Rapports & Export</span>
          </h1>
          <p className="page-subtitle text-sm sm:text-base">Exportez ou envoyez vos données en PDF / Excel</p>
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="card px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          {STEPS.map((step, i) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            return (
              <div key={step.number} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {i > 0 && (
                  <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isCompleted ? 'text-emerald-400' : 'text-gray-300'}`} />
                )}
                <button
                  onClick={() => {
                    if (step.number === 1) handleReset();
                    else if (step.number === 2 && selectedReport) setCurrentStep(2);
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : isCompleted 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isActive ? 'bg-white/20 text-white' : isCompleted ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : step.number}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="card p-4 sm:p-6">
        {/* Step 1: Select type */}
        {currentStep === 1 && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TYPES.map((report) => {
                const Icon = report.icon;
                const colors = COLOR_MAP[report.color] || COLOR_MAP.blue;
                const isSelected = selectedReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    disabled={!report.available}
                    className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 group
                      ${report.available 
                        ? `${colors.border} ${colors.hoverBorder} hover:shadow-md cursor-pointer`
                        : 'border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-60'
                      }
                      ${isSelected ? `${colors.activeBorder} ${colors.activeBg} ring-2 ${colors.activeRing} shadow-md` : 'bg-white'}
                    `}
                  >
                    {/* Badge */}
                    {report.badge && (
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold text-white ${report.badgeColor}`}>
                        {report.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${report.available ? colors.iconBg : 'bg-gray-100'} flex items-center justify-center mb-3
                      ${report.available ? 'group-hover:scale-110 transition-transform' : ''}`}>
                      <Icon className={`w-6 h-6 ${report.available ? colors.iconColor : 'text-gray-400'}`} />
                    </div>

                    {/* Text */}
                    <p className={`text-sm font-bold ${report.available ? 'text-gray-800' : 'text-gray-400'}`}>
                      {report.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${report.available ? 'text-gray-500' : 'text-gray-300'}`}>
                      {report.description}
                    </p>

                    {/* Coming soon */}
                    {!report.available && (
                      <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-gray-100">
                        Bientôt
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Preview & download */}
        {currentStep === 2 && selectedReport && (
          <div className="animate-fadeIn">
            <div className="max-w-2xl mx-auto">
              {/* Report card */}
              <div className={`p-6 rounded-xl border-2 ${COLOR_MAP[selectedReport.color]?.activeBorder} ${COLOR_MAP[selectedReport.color]?.activeBg} mb-6`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl ${COLOR_MAP[selectedReport.color]?.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <selectedReport.icon className={`w-7 h-7 ${COLOR_MAP[selectedReport.color]?.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800">{selectedReport.label}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedReport.description}</p>

                    {/* Stats preview */}
                    {selectedReport.id === 'situation-generale' && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatChip label="Tubes" value={stats?.tubes} loading={loadingStats} color="blue" />
                        <StatChip label="Lots" value={stats?.lots} loading={loadingStats} color="amber" />
                        <StatChip label="Bobines" value={stats?.bobines} loading={loadingStats} color="teal" />
                        <StatChip label="Réparations" value={stats?.repairs} loading={loadingStats} color="red" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* File info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Contenu du fichier</h4>
                {selectedReport.id === 'situation-generale' && (
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <strong>{language === 'en' ? 'Sheet 1 — General Status:' : 'Feuille 1 — Situation Générale :'}</strong> {language === 'en' ? 'All tubes with steps, statuses, decisions' : 'Tous les tubes avec étapes, statuts, décisions'}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <strong>{language === 'en' ? 'Sheet 2 — Repairs:' : 'Feuille 2 — Réparations :'}</strong> {language === 'en' ? 'Detail of all defects, causes, responsibilities' : 'Détail de tous les défauts, causes, responsabilités'}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      <strong>{language === 'en' ? 'Sheet 3 — Summary:' : 'Feuille 3 — Résumé :'}</strong> {language === 'en' ? 'Global production statistics' : 'Statistiques globales de production'}
                    </li>
                  </ul>
                )}
              </div>

              {/* Language selector */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Langue du rapport</h4>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLanguage('fr')}
                    className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${language === 'fr'
                        ? 'bg-white text-blue-700 border-2 border-blue-500 shadow-md'
                        : 'bg-white/60 text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-white'
                      }`}
                  >
                    {/* Drapeau Français - SVG inline */}
                    <svg className="w-8 h-6 rounded-sm shadow-sm flex-shrink-0" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                      <rect width="300" height="600" fill="#002654"/>
                      <rect x="300" width="300" height="600" fill="#FFFFFF"/>
                      <rect x="600" width="300" height="600" fill="#CE1126"/>
                    </svg>
                    Français
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${language === 'en'
                        ? 'bg-white text-blue-700 border-2 border-blue-500 shadow-md'
                        : 'bg-white/60 text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-white'
                      }`}
                  >
                    {/* Drapeau Britannique (Union Jack) - SVG inline */}
                    <svg className="w-8 h-6 rounded-sm shadow-sm flex-shrink-0" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                      <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
                      <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
                      <g clipPath="url(#s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
                        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
                        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
                      </g>
                    </svg>
                    English
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Télécharger Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && downloadComplete && (
          <div className="animate-fadeIn">
            <div className="max-w-md mx-auto text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Téléchargement terminé !</h3>
              <p className="text-sm text-gray-500 mb-6">
                Le fichier <strong>Situation Générale</strong> a été téléchargé avec succès.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Retélécharger
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Nouveau rapport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pb-4">
        Crafted by hand with <span className="text-red-400">❤</span> by <span className="text-blue-500 font-medium">Azizi Mounir</span> — Api-Track
      </div>
    </div>
  );
}

// ============================================
// STAT CHIP COMPONENT
// ============================================
function StatChip({ label, value, loading, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    teal: 'bg-teal-50 text-teal-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`px-3 py-2 rounded-lg ${colorMap[color] || colorMap.blue} text-center`}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
      ) : (
        <p className="text-lg font-bold">{value ?? '-'}</p>
      )}
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}
