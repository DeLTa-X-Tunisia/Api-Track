import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { 
  Cylinder, 
  Eye, 
  Flame, 
  Scan, 
  Droplet,
  CheckCircle,
  Award,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Activity,
  Package,
  Beaker,
  BarChart3,
  Zap,
  Ruler,
  SearchCheck,
  Gauge,
  Microscope,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ArrowDownCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Wrench,
  Pause,
  Ban
} from 'lucide-react';

// Mapping icônes par code d'étape (12 étapes API 5L)
const ETAPE_ICONS = {
  FORMAGE:      Cylinder,
  POINTAGE:     Zap,
  CV_POINTAGE:  Eye,
  SAW_ID_OD:    Flame,
  CV_CORDON:    SearchCheck,
  MACRO:        Microscope,
  CHANFREIN:    Ruler,
  HYDROTEST:    Gauge,
  CV_FUITE:     Droplet,
  UT:           Scan,
  RADIO_SCOPIE: Scan,
  CONTROLE_DIM: Ruler,
};

const ETAPE_COLORS = {
  FORMAGE:      { bg: 'bg-blue-600',    bgLight: 'bg-blue-50',    text: 'text-blue-600' },
  POINTAGE:     { bg: 'bg-orange-500',  bgLight: 'bg-orange-50',  text: 'text-orange-600' },
  CV_POINTAGE:  { bg: 'bg-purple-500',  bgLight: 'bg-purple-50',  text: 'text-purple-600' },
  SAW_ID_OD:    { bg: 'bg-amber-500',   bgLight: 'bg-amber-50',   text: 'text-amber-600' },
  CV_CORDON:    { bg: 'bg-violet-500',  bgLight: 'bg-violet-50',  text: 'text-violet-600' },
  MACRO:        { bg: 'bg-green-600',   bgLight: 'bg-green-50',   text: 'text-green-600' },
  CHANFREIN:    { bg: 'bg-lime-600',    bgLight: 'bg-lime-50',    text: 'text-lime-600' },
  HYDROTEST:    { bg: 'bg-cyan-600',    bgLight: 'bg-cyan-50',    text: 'text-cyan-600' },
  CV_FUITE:     { bg: 'bg-teal-500',    bgLight: 'bg-teal-50',    text: 'text-teal-600' },
  UT:           { bg: 'bg-red-600',     bgLight: 'bg-red-50',     text: 'text-red-700' },
  RADIO_SCOPIE: { bg: 'bg-pink-500',    bgLight: 'bg-pink-50',    text: 'text-pink-600' },
  CONTROLE_DIM: { bg: 'bg-indigo-600',  bgLight: 'bg-indigo-50',  text: 'text-indigo-600' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardApi.getStats();
      setData(response.data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <span className="text-sm text-gray-400">Chargement du tableau de bord...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-12 h-12 text-danger-500" />
        <p className="text-gray-600">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
          Réessayer
        </button>
      </div>
    );
  }

  const tubes = data?.tubes || {};
  const etapes = data?.etapes || [];
  const lots = data?.lots || {};
  const bobines = data?.bobines || {};
  const activite = data?.activite_recente || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Vue d'ensemble de la production API 5L</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-success-50 text-success-600 rounded-xl hover:bg-success-100 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Charte Graphique des Tubes — Vue complète */}
      <TubesChart tubes={tubes} />

      {/* Pipeline de Production API 5L */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline de Production API 5L</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3">
          {etapes.map((etape, index) => {
            const Icon = ETAPE_ICONS[etape.code] || Cylinder;
            const colors = ETAPE_COLORS[etape.code] || ETAPE_COLORS.FORMAGE;
            return (
              <div key={etape.numero || index} className="group relative">
                <div className={`flex flex-col items-center p-4 rounded-xl ${colors.bgLight} transition-all duration-200 hover:shadow-md`}>
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {etape.nom}
                  </span>
                  <span className={`text-lg font-bold mt-1 ${etape.tubes_count > 0 ? colors.text : 'text-gray-400'}`}>
                    {etape.tubes_count}
                  </span>
                </div>
                {index < etapes.length - 1 && (
                  <ArrowRight className="hidden xl:block absolute top-1/2 transform -translate-y-1/2 -right-3 w-4 h-4 text-gray-300 z-10" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bobines en stock & Bobines en production + Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Résumé Bobines en stock */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bobines en stock</h2>
            <button onClick={() => navigate('/bobines')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Voir tout
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-gray-600">En stock</span>
              </div>
              <span className="font-bold text-gray-900">{bobines.en_stock}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Cylinder className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">En cours d'utilisation</span>
              </div>
              <span className="font-bold text-gray-900">{bobines.en_cours}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Poids total</span>
              </div>
              <span className="font-bold text-gray-900">{(bobines.poids_total / 1000).toFixed(1)}t</span>
            </div>
          </div>
        </div>

        {/* Résumé Bobines en production */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bobines en production</h2>
            <button onClick={() => navigate('/bobines-production')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Voir tout
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Beaker className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600">En production</span>
              </div>
              <span className="font-bold text-orange-600">{lots.en_production}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">En préparation</span>
              </div>
              <span className="font-bold text-gray-900">{lots.en_cours}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Prêtes</span>
              </div>
              <span className="font-bold text-green-600">{lots.pret}</span>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité Récente</h2>
          {activite.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activite.slice(0, 5).map((item) => {
                const Icon = ETAPE_ICONS[item.etape_code] || Activity;
                const colors = ETAPE_COLORS[item.etape_code] || { text: 'text-gray-500' };
                return (
                  <ActivityItem
                    key={item.id}
                    icon={Icon}
                    color={colors.text}
                    title={`${item.tube_numero} — ${item.etape_nom}`}
                    subtitle={item.operateur_nom}
                    time={formatTimeAgo(item.date_debut)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Composants internes ─── */

function ActivityItem({ icon: Icon, color, title, subtitle, time }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </div>
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR');
}

/* ─── Charte Graphique des Tubes (Dynamique) ─── */

// Configuration des statuts avec couleurs accessibles (WCAG AA)
const TUBES_STATUTS = [
  { 
    key: 'en_cours', 
    label: 'En cours', 
    shortLabel: 'Cours',
    color: 'bg-gray-500', 
    barColor: '#6b7280',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: Clock,
  },
  { 
    key: 'termines', 
    label: 'Terminés', 
    shortLabel: 'Finis',
    color: 'bg-emerald-500', 
    barColor: '#10b981',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    icon: CheckCircle,
  },
  { 
    key: 'reparation', 
    label: 'En réparation', 
    shortLabel: 'Répar.',
    color: 'bg-amber-700', 
    barColor: '#b45309',
    textColor: 'text-amber-800',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-400',
    icon: Wrench,
  },
  { 
    key: 'interrompu', 
    label: 'Interrompu', 
    shortLabel: 'Inter.',
    color: 'bg-violet-500', 
    barColor: '#8b5cf6',
    textColor: 'text-violet-700',
    bgLight: 'bg-violet-50',
    borderColor: 'border-violet-300',
    icon: Pause,
  },
  { 
    key: 'certifie_api', 
    label: 'Certifié API', 
    shortLabel: 'API',
    color: 'bg-green-500', 
    barColor: '#22c55e',
    textColor: 'text-green-700',
    bgLight: 'bg-green-50',
    borderColor: 'border-green-300',
    icon: ShieldCheck,
  },
  { 
    key: 'certifie_hydraulique', 
    label: 'Certifié Hydraulique', 
    shortLabel: 'Hydro.',
    color: 'bg-blue-500', 
    barColor: '#3b82f6',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: Award,
  },
  { 
    key: 'declasse', 
    label: 'Déclassé', 
    shortLabel: 'Décl.',
    color: 'bg-orange-500', 
    barColor: '#f97316',
    textColor: 'text-orange-700',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: ArrowDownCircle,
  },
  { 
    key: 'rebuts', 
    label: 'Rebut', 
    shortLabel: 'Rebut',
    color: 'bg-red-500', 
    barColor: '#ef4444',
    textColor: 'text-red-700',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: Ban,
  },
];

function TubesChart({ tubes }) {
  const total = tubes.total || 0;
  const productionJour = tubes.production_jour || 0;
  const terminesJour = tubes.termines_jour || 0;
  
  // Calculer les données pour chaque statut
  const chartData = TUBES_STATUTS.map(statut => {
    const value = tubes[statut.key] || 0;
    const percent = total > 0 ? ((value / total) * 100) : 0;
    return { ...statut, value, percent };
  });

  // Données pour la barre de progression (seulement ceux > 0)
  const barData = chartData.filter(d => d.value > 0);

  return (
    <div className="card">
      {/* Header avec total et infos du jour */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Répartition des Tubes</h2>
            <p className="text-sm text-gray-500">Vue d'ensemble de la production</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <span className="font-bold text-gray-900">{total}</span>
            <span className="text-gray-500">tubes</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-emerald-700">+{productionJour}</span>
            <span className="text-emerald-600">aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Cartes détaillées par statut */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Détail par statut</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {chartData.map((item) => {
            const Icon = item.icon;
            const isActive = item.value > 0;
            
            return (
              <div 
                key={item.key} 
                className={`relative p-3 rounded-xl border-2 transition-all ${
                  isActive 
                    ? `${item.bgLight} ${item.borderColor} hover:shadow-lg` 
                    : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                {/* Badge icône */}
                <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-2 mx-auto shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                
                {/* Label */}
                <p className={`text-xs font-medium text-center mb-1 ${item.textColor} leading-tight`}>
                  {item.label}
                </p>
                
                {/* Valeur principale */}
                <p className="text-2xl font-bold text-center text-gray-900">
                  {item.value}
                </p>
                
                {/* Pourcentage */}
                <p className={`text-xs text-center ${isActive ? item.textColor : 'text-gray-400'}`}>
                  {item.percent.toFixed(1)}%
                </p>

                {/* Mini indicateur de progression */}
                <div className="mt-2 h-1 rounded-full bg-gray-200 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(item.percent, 100)}%`,
                      backgroundColor: item.barColor
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-100 my-5" />

      {/* SECTION 2: Barre de progression visuelle */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Distribution visuelle</span>
        </div>
        
        {/* Barre de progression segmentée */}
        <div className="h-8 rounded-xl overflow-hidden flex bg-gray-100 shadow-inner">
          {barData.map((item) => (
            <div
              key={item.key}
              className="h-full transition-all duration-700 relative group cursor-pointer"
              style={{ 
                width: `${item.percent}%`, 
                backgroundColor: item.barColor,
                minWidth: item.value > 0 ? '12px' : '0'
              }}
            >
              {/* Pourcentage affiché si assez large */}
              {item.percent >= 8 && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                  {item.percent.toFixed(0)}%
                </span>
              )}
              {/* Tooltip au survol */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                <span className="font-semibold">{item.label}</span>: {item.value} ({item.percent.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>

        {/* Légende horizontale sous la barre */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3">
          {chartData.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span 
                className="w-3 h-3 rounded-sm shadow-sm" 
                style={{ backgroundColor: item.barColor }}
              />
              <span className="text-xs text-gray-600">{item.shortLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer avec statistiques du jour */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Créés aujourd'hui: <span className="font-semibold text-gray-700">{productionJour}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Terminés aujourd'hui: <span className="font-semibold text-emerald-600">{terminesJour}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Wrench className="w-3.5 h-3.5" />
            <span>En réparation: <span className="font-semibold text-amber-600">{tubes.reparation || 0}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
