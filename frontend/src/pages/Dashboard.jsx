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
  RefreshCw
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

  const tauxRebut = tubes.total > 0
    ? ((tubes.rebuts / tubes.total) * 100).toFixed(1)
    : '0.0';

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

      {/* Stats Cards principaux — 6 cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Tubes en cours"
          value={tubes.en_cours}
          icon={Clock}
          color="primary"
          trend={`${tubes.production_jour} créé(s) aujourd'hui`}
        />
        <StatCard
          title="Tubes terminés"
          value={tubes.termines}
          icon={CheckCircle}
          color="success"
          trend={`${tubes.termines_jour} aujourd'hui`}
        />
        <StatCard
          title="Certifié API"
          value={tubes.certifie_api || 0}
          icon={ShieldCheck}
          color="warning"
          trend={`${tubes.total > 0 ? ((tubes.certifie_api / tubes.total) * 100).toFixed(0) : 0}% du total`}
        />
        <StatCard
          title="Certifié Hydraulique"
          value={tubes.certifie_hydraulique || 0}
          icon={Award}
          color="info"
          trend={`${tubes.total > 0 ? ((tubes.certifie_hydraulique / tubes.total) * 100).toFixed(0) : 0}% du total`}
        />
        <StatCard
          title="Rebuts"
          value={tubes.rebuts}
          icon={AlertTriangle}
          color="danger"
          trend={`${tauxRebut}% taux de rebut`}
        />
        <StatCard
          title="Total tubes"
          value={tubes.total}
          icon={TrendingUp}
          color="accent"
          trend={`${tubes.reparation} en réparation`}
        />
      </div>

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

function StatCard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', icon: 'bg-primary-100' },
    success: { bg: 'bg-success-50', text: 'text-success-600', icon: 'bg-success-100' },
    danger:  { bg: 'bg-danger-50',  text: 'text-danger-600',  icon: 'bg-danger-100' },
    accent:  { bg: 'bg-accent-50',  text: 'text-accent-600',  icon: 'bg-accent-100' },
    warning: { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'bg-amber-100' },
    info:    { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'bg-blue-100' },
  };

  const colorConfig = colors[color] || colors.primary;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className={`text-xs mt-2 ${colorConfig.text}`}>{trend}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorConfig.icon}`}>
          <Icon className={`w-6 h-6 ${colorConfig.text}`} />
        </div>
      </div>
    </div>
  );
}

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
