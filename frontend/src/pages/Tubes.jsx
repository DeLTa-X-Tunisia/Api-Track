import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { tubesApi, lotsApi, presetsApi } from '../services/api';
import {
  Cylinder, Plus, Search, RefreshCw, Clock, Package, Trash2,
  CheckCircle, X, AlertTriangle, Eye, Download, ChevronDown, ChevronUp,
  Zap, Flame, Scissors, Droplet, Scan, Radio, Ruler, Microscope,
  Play, Pause, RotateCcw, XCircle, Check, FileText, Camera, Upload,
  Shield, Award, AlertOctagon, ArrowRight, ArrowDown, SkipForward,
  Wrench, MessageSquare, Hash, Calendar, Filter, Activity, Ban,
  ChevronRight, Info, Settings, Edit3, ToggleRight, ToggleLeft,
  PauseCircle, PlayCircle, WifiOff, History, Trophy, ShieldCheck, Undo2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

/** Build a photo URL with auth token for <img> tags */
const getPhotoUrl = (photoPath) => {
  const token = localStorage.getItem('logitrack2_token');
  return `${API_URL}${photoPath}${token ? `?token=${token}` : ''}`;
};

// ============================================
// CONSTANTES
// ============================================
const ETAPES = [
  { numero: 1, code: 'FORMAGE', nom: 'Formage', icon: Cylinder, color: 'blue', offline: false },
  { numero: 2, code: 'POINTAGE', nom: 'Pointage (GMAW)', icon: Zap, color: 'amber', offline: false },
  { numero: 3, code: 'CV_POINTAGE', nom: 'CV Pointage', icon: Search, color: 'teal', offline: false },
  { numero: 4, code: 'SAW_ID_OD', nom: 'SAW ID/OD', icon: Flame, color: 'orange', offline: true },
  { numero: 5, code: 'CV_CORDON', nom: 'CV Cordon', icon: Search, color: 'teal', offline: false },
  { numero: 6, code: 'MACRO', nom: 'Macro', icon: Microscope, color: 'purple', offline: false },
  { numero: 7, code: 'CHANFREIN', nom: 'Chanfrein', icon: Scissors, color: 'gray', offline: false },
  { numero: 8, code: 'HYDROTEST', nom: 'Hydrotest', icon: Droplet, color: 'cyan', offline: false },
  { numero: 9, code: 'CV_FUITE', nom: 'CV Fuite', icon: Search, color: 'teal', offline: false },
  { numero: 10, code: 'UT', nom: 'UT', icon: Scan, color: 'indigo', offline: false },
  { numero: 11, code: 'RADIO_SCOPIE', nom: 'Radio Scopie', icon: Radio, color: 'rose', offline: false },
  { numero: 12, code: 'CONTROLE_DIM', nom: 'Contrôle dimensionnel', icon: Ruler, color: 'emerald', offline: false },
];

const STATUT_COLORS = {
  en_production: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  termine: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  rebut: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  en_attente: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  en_reparation: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  interrompu: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
};

const ETAPE_STATUT_COLORS = {
  en_attente: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-400' },
  en_cours: { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'text-blue-600' },
  valide: { bg: 'bg-green-50', border: 'border-green-300', icon: 'text-green-600' },
  non_conforme: { bg: 'bg-red-50', border: 'border-red-300', icon: 'text-red-600' },
  saute: { bg: 'bg-amber-50', border: 'border-amber-300', icon: 'text-amber-600' },
  en_reparation: { bg: 'bg-orange-50', border: 'border-orange-300', icon: 'text-orange-600' },
  interrompu: { bg: 'bg-gray-50', border: 'border-gray-300', icon: 'text-gray-500' },
};

const DECISION_INFO = {
  en_attente: { badge: '⏳', label: 'En attente', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  certifie_api: { badge: '🏆', label: 'Certifié API', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: Trophy, color: 'emerald' },
  certifie_hydraulique: { badge: '🔧', label: 'Certifié Hydraulique', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: Wrench, color: 'blue' },
  declasse: { badge: '⚠️', label: 'Déclassé', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle, color: 'orange' },
  rebut: { badge: '🚫', label: 'Rebut', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
};

const TOTAL_ETAPES = ETAPES.length;

const DIAMETRES = [
  { pouce: '8"', mm: 219.1 }, { pouce: '10"', mm: 273.1 }, { pouce: '12"', mm: 323.9 },
  { pouce: '14"', mm: 355.6 }, { pouce: '16"', mm: 406.4 }, { pouce: '18"', mm: 457.2 },
  { pouce: '20"', mm: 508 }, { pouce: '22"', mm: 558.8 }, { pouce: '24"', mm: 609.6 },
  { pouce: '26"', mm: 660.4 }, { pouce: '28"', mm: 711.2 }, { pouce: '30"', mm: 762 },
  { pouce: '32"', mm: 812.8 }, { pouce: '34"', mm: 863.6 }, { pouce: '36"', mm: 914.4 },
  { pouce: '38"', mm: 965.2 }, { pouce: '40"', mm: 1016 }, { pouce: '42"', mm: 1066.8 },
  { pouce: '44"', mm: 1117.6 }, { pouce: '46"', mm: 1168.4 }, { pouce: '48"', mm: 1219.2 },
  { pouce: '52"', mm: 1320.8 }, { pouce: '56"', mm: 1422.4 }, { pouce: '60"', mm: 1524 },
  { pouce: '64"', mm: 1625.6 }, { pouce: '72"', mm: 1828.8 }, { pouce: '80"', mm: 2032 },
  { pouce: '82"', mm: 2082.8 },
];

const GAZ_OPTIONS = [
  { value: 'CO2', label: 'CO₂' },
  { value: 'Argon_CO2', label: 'Argon / CO₂ Mix' },
  { value: 'Argon_O2', label: 'Argon / O₂ Mix' },
  { value: 'Argon_pur', label: 'Argon pur' },
  { value: 'Autre', label: 'Autre' }
];
const FIL_OPTIONS = ['1.0mm', '1.2mm', '1.6mm', '2.0mm', '2.4mm', '3.2mm', '4.0mm'];
const FLUX_OPTIONS = [
  { value: 'SAW', label: 'SAW (Submerged Arc)' },
  { value: 'FCAW', label: 'FCAW (Flux-Cored)' },
  { value: 'GMAW', label: 'GMAW (Gas Metal)' },
  { value: 'Autre', label: 'Autre' }
];
const DEFAULT_HEADS = [
  { type: 'ID', numero: 1, actif: true, amperage: 0, voltage: 0, type_fil: '3.2mm' },
  { type: 'ID', numero: 2, actif: true, amperage: 0, voltage: 0, type_fil: '3.2mm' },
  { type: 'ID', numero: 3, actif: false, amperage: 0, voltage: 0, type_fil: '3.2mm' },
  { type: 'OD', numero: 1, actif: true, amperage: 0, voltage: 0, type_fil: '3.2mm' },
  { type: 'OD', numero: 2, actif: true, amperage: 0, voltage: 0, type_fil: '3.2mm' },
];

const INTERRUPTION_MOTIFS = [
  'Panne machine',
  'Manque matière',
  'Changement outillage',
  'Pause / Fin de quart',
  'Problème qualité',
  'Autre'
];

// ============================================
// HELPERS
// ============================================
function formatDuration(ms) {
  if (!ms || ms <= 0) return '-';
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}j ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

function getEtapeDuration(etape) {
  if (!etape.started_at) return 0;
  const end = etape.completed_at ? new Date(etape.completed_at) : new Date();
  return end - new Date(etape.started_at);
}

function getInterDelay(etapes, idx) {
  if (idx === 0) return 0;
  const prev = etapes[idx - 1];
  const current = etapes[idx];
  if (!prev?.completed_at || !current?.started_at) return 0;
  return new Date(current.started_at) - new Date(prev.completed_at);
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function Tubes() {
  const { user, canAct, isSystemAdmin } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [tubes, setTubes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterEtape, setFilterEtape] = useState('');
  const [filterDecision, setFilterDecision] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSawDateFrom, setFilterSawDateFrom] = useState('');
  const [filterSawDateTo, setFilterSawDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTube, setSelectedTube] = useState(null);

  const fetchTubes = useCallback(async () => {
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterEtape) params.etape = filterEtape;
      if (filterDecision) params.decision = filterDecision;
      if (searchQuery) params.search = searchQuery;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (filterSawDateFrom) params.saw_date_from = filterSawDateFrom;
      if (filterSawDateTo) params.saw_date_to = filterSawDateTo;
      const res = await tubesApi.getAll(params);
      setTubes(res.data);
    } catch (error) {
      toast.error('Erreur chargement des tubes');
    }
  }, [filterStatut, filterEtape, filterDecision, searchQuery, filterDateFrom, filterDateTo, filterSawDateFrom, filterSawDateTo]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await tubesApi.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTubes(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchTubes, fetchStats]);

  const refresh = () => { fetchTubes(); fetchStats(); };

  const openDetail = async (tube) => {
    try {
      const res = await tubesApi.getById(tube.id);
      setSelectedTube(res.data);
      setShowDetailModal(true);
    } catch { toast.error('Erreur chargement détails'); }
  };

  const handleDelete = async (tube) => {
    const confirmed = await confirm({
      type: 'danger',
      title: 'Supprimer le tube',
      message: `Supprimer le tube N°${tube.numero} ?`,
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
    });
    if (confirmed) {
      try {
        await tubesApi.delete(tube.id);
        toast.success('Tube supprimé');
        refresh();
      } catch { toast.error('Erreur suppression'); }
    }
  };

  const filteredTubes = tubes;

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Cylinder className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            Tubes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Production et contrôle des tubes spirale</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Actualiser</span>
          </button>
          {canAct && (
            <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Nouveau tube
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Total" value={stats.total || 0} icon={Package} color="gray" />
        <StatCard label="En production" value={stats.en_production || 0} icon={Play} color="blue" />
        <StatCard label="En réparation" value={stats.en_reparation || 0} icon={Wrench} color="orange" />
        <StatCard label="Interrompus" value={stats.interrompu || 0} icon={Pause} color="gray" />
        <StatCard label="Terminés" value={stats.termines || 0} icon={CheckCircle} color="green" />
        <StatCard label="Non conformes" value={stats.non_conformes || 0} icon={AlertTriangle} color="amber" />
        <StatCard label="Rebuts" value={stats.rebuts || 0} icon={XCircle} color="red" />
      </div>

      {/* Decision stats — toujours affichées (V1 parity) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Décision en attente" value={stats.decision_en_attente || 0} icon={Clock} color="amber" />
        <StatCard label="Certifié API" value={stats.certifie_api || 0} icon={Trophy} color="green" />
        <StatCard label="Certifié Hydraulique" value={stats.certifie_hydraulique || 0} icon={Wrench} color="blue" />
        <StatCard label="Déclassé" value={stats.declasse || 0} icon={AlertTriangle} color="orange" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par N° tube ou lot..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto">
              <option value="">Tous statuts</option>
              <option value="en_production">En production</option>
              <option value="en_reparation">En réparation</option>
              <option value="interrompu">Interrompu</option>
              <option value="termine">Terminé</option>
              <option value="en_attente">Non conforme</option>
              <option value="rebut">Rebut</option>
            </select>
            <select value={filterEtape} onChange={(e) => setFilterEtape(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto">
              <option value="">Toutes étapes</option>
              {ETAPES.map(e => <option key={e.numero} value={e.numero}>{e.numero}. {e.nom}</option>)}
            </select>
            <select value={filterDecision} onChange={(e) => setFilterDecision(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto col-span-2 sm:col-span-1">
              <option value="">Toutes décisions</option>
              <option value="en_attente">En attente</option>
              <option value="certifie_api">Certifié API</option>
              <option value="certifie_hydraulique">Certifié Hydraulique</option>
              <option value="declasse">Déclassé</option>
            </select>
          </div>
        </div>

        {/* Filtre par date de création */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Date :</span>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-gray-500">Du</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-gray-500">Au</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {(filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Effacer le filtre date"
            >
              <X className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
        </div>

        {/* Filtre par date SAW (Soudage - Étape 4) */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Flame className="w-4 h-4" />
            <span>Date SAW :</span>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-gray-500">Du</label>
            <input
              type="date"
              value={filterSawDateFrom}
              onChange={e => setFilterSawDateFrom(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-amber-50/30"
            />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-gray-500">Au</label>
            <input
              type="date"
              value={filterSawDateTo}
              onChange={e => setFilterSawDateTo(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-amber-50/30"
            />
          </div>
          {(filterSawDateFrom || filterSawDateTo) && (
            <button
              onClick={() => { setFilterSawDateFrom(''); setFilterSawDateTo(''); }}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Effacer le filtre date SAW"
            >
              <X className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
          {(filterSawDateFrom || filterSawDateTo) && tubes.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              {tubes.length} tube{tubes.length > 1 ? 's' : ''} soudé{tubes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tubes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-500">Chargement...</span>
        </div>
      ) : filteredTubes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Cylinder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun tube trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTubes.map(tube => (
            <TubeCard
              key={tube.id}
              tube={tube}
              onOpen={() => openDetail(tube)}
              onDelete={() => handleDelete(tube)}
              canAct={canAct}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showNewModal && (
        <NewTubeModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); refresh(); }}
          canAct={canAct}
        />
      )}
      {showDetailModal && selectedTube && (
        <TubeDetailModal
          tube={selectedTube}
          onClose={() => { setShowDetailModal(false); setSelectedTube(null); }}
          onRefresh={async () => {
            try {
              const res = await tubesApi.getById(selectedTube.id);
              setSelectedTube(res.data);
            } catch {}
            refresh();
          }}
          canAct={canAct}
          isSystemAdmin={isSystemAdmin}
        />
      )}
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================
function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    gray: 'bg-gray-50 text-gray-600', blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600', orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ============================================
// TUBE CARD
// ============================================
function TubeCard({ tube, onOpen, onDelete, canAct }) {
  const statutInfo = STATUT_COLORS[tube.statut] || STATUT_COLORS.en_production;
  const etapes = tube.etapes || [];
  const etapesValidees = etapes.filter(e => e.statut === 'valide').length;
  const etapeCourante = ETAPES.find(e => e.numero === tube.etape_courante);
  const hasNC = etapes.some(e => e.statut === 'non_conforme');
  const hasSaute = etapes.some(e => e.statut === 'saute');

  const statutLabel = {
    en_production: 'En production', termine: 'Terminé', rebut: 'Rebut',
    en_attente: 'Non conforme', en_reparation: 'En réparation', interrompu: 'Interrompu'
  };

  const handlePdfDownload = async (e) => {
    e.stopPropagation();
    try {
      const res = await tubesApi.getPDF(tube.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `tube_${tube.numero}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur PDF:', err);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border hover:shadow-md transition-all cursor-pointer ${
        tube.statut === 'en_attente' ? 'border-red-300 bg-red-50/30' :
        tube.statut === 'en_reparation' ? 'border-orange-300 bg-orange-50/30' :
        tube.statut === 'interrompu' ? 'border-yellow-300 bg-yellow-50/30' :
        tube.statut === 'termine' ? 'border-green-200' :
        'border-gray-200'
      }`}
      onClick={onOpen}
    >
      <div className="p-3 sm:p-4">
        {/* Header: Tube icon + info */}
        <div className="flex items-start gap-2 sm:gap-3 mb-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${statutInfo.bg}`}>
            <Cylinder className={`w-4 h-4 sm:w-5 sm:h-5 ${statutInfo.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Tube N°{tube.numero}</h3>
              {tube.type_tube === 'cross_welding' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">CW</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutInfo.bg} ${statutInfo.text}`}>
                {statutLabel[tube.statut] || tube.statut}
              </span>
              {hasNC && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">NC</span>}
              {hasSaute && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />Offline
                </span>
              )}
            </div>
            {/* Decision badges */}
            {tube.statut === 'termine' && tube.decision && tube.decision !== 'en_attente' && DECISION_INFO[tube.decision] && (
              <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${DECISION_INFO[tube.decision].bg} ${DECISION_INFO[tube.decision].text}`}>
                {DECISION_INFO[tube.decision].badge} {DECISION_INFO[tube.decision].label}
              </span>
            )}
            {tube.statut === 'termine' && (!tube.decision || tube.decision === 'en_attente') && (
              <span className="inline-flex text-xs px-2 py-0.5 rounded-full font-medium mt-1 bg-amber-50 text-amber-600 border border-amber-200">
                ⏳ Décision
              </span>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Lot {tube.lot_numero || '-'}{tube.lot_numero_2 ? ` → ${tube.lot_numero_2}` : ''}
              {' · '}⌀{tube.diametre_mm}mm {tube.diametre_pouce ? `(${tube.diametre_pouce})` : ''}
              {tube.created_at && (
                <span className="ml-1"> · {new Date(tube.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              )}
              {tube.saw_date && (
                <span className="hidden sm:inline ml-1 text-amber-600"> · <Flame className="w-3 h-3 inline" /> SAW {new Date(tube.saw_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              )}
            </p>
          </div>
          {/* Étape + actions - compact */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {etapeCourante && tube.statut !== 'termine' && tube.statut !== 'rebut' && (
              <span className="hidden sm:inline text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
                {etapeCourante.nom} · {tube.etape_courante}/{TOTAL_ETAPES}
              </span>
            )}
            <button
              onClick={handlePdfDownload}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Télécharger PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
            {canAct && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile étape info */}
        {etapeCourante && tube.statut !== 'termine' && tube.statut !== 'rebut' && (
          <div className="sm:hidden mb-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg inline-flex">
            {etapeCourante.nom} · {tube.etape_courante}/{TOTAL_ETAPES}
          </div>
        )}

        {/* Timeline horizontal colorée */}
        <div className="flex items-center gap-0.5">
          {ETAPES.map((etapeDef, idx) => {
            const tubeEtape = etapes.find(e => e.etape_numero === etapeDef.numero);
            const s = tubeEtape?.statut || 'en_attente';
            const bgMap = {
              valide: 'bg-green-500', non_conforme: 'bg-red-500', en_cours: 'bg-blue-500',
              saute: 'bg-amber-400', en_reparation: 'bg-orange-500', interrompu: 'bg-yellow-400', en_attente: 'bg-gray-200'
            };
            const pulseClass = s === 'en_cours' ? 'animate-pulse ring-2 ring-blue-300' :
              s === 'non_conforme' ? 'animate-pulse ring-2 ring-red-300' :
              s === 'en_reparation' ? 'animate-pulse ring-2 ring-orange-300' :
              s === 'interrompu' ? 'animate-pulse ring-2 ring-yellow-300' : '';
            return (
              <div key={idx} className="flex-1 group relative" onClick={(e) => { e.stopPropagation(); }}>
                <div className={`h-2 rounded-full ${bgMap[s] || 'bg-gray-200'} transition-all ${pulseClass} cursor-pointer`} 
                  title={`${etapeDef.numero}. ${etapeDef.nom}${etapeDef.offline ? ' [OFFLINE]' : ''}${s !== 'en_attente' ? ` — ${s.replace(/_/g, ' ')}` : ''}`}
                />
                {/* Tooltip - visible on hover (desktop) */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {etapeDef.numero}. {etapeDef.nom}
                    {etapeDef.offline && ' [OFFLINE]'}
                    {s !== 'en_attente' && ` — ${s.replace(/_/g, ' ')}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">Formage</span>
          <span className="text-[10px] text-gray-400">{etapesValidees}/{TOTAL_ETAPES} validées</span>
          <span className="text-[10px] text-gray-400">Radio Scopie</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Mini accordion section pour paramètres
// ============================================
function TubeParamAccordion({ title, color, open, onToggle, children }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`border ${c.border} rounded-lg overflow-hidden`}>
      <button type="button" onClick={onToggle} className={`w-full flex items-center justify-between px-3 py-2 ${c.bg}`}>
        <span className={`text-sm font-medium ${c.text}`}>{title}</span>
        {open ? <ChevronUp className={`w-4 h-4 ${c.icon}`} /> : <ChevronDown className={`w-4 h-4 ${c.icon}`} />}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

// ============================================
// NEW TUBE MODAL - Identique V1
// ============================================
function NewTubeModal({ onClose, onCreated, canAct }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [prochainNumero, setProchainNumero] = useState('');
  const [lotActif, setLotActif] = useState(null);
  const [nextLot, setNextLot] = useState(null);
  const [preset, setPreset] = useState(null);
  const [editingParams, setEditingParams] = useState(false);
  const [openSections, setOpenSections] = useState({ formage: true, tack: false, soudure: false });
  const [editForm, setEditForm] = useState({});
  const [editHeads, setEditHeads] = useState(JSON.parse(JSON.stringify(DEFAULT_HEADS)));
  const [form, setForm] = useState({
    type_tube: 'normal',
    numero: '',
    diametre_pouce: '',
    diametre_mm: '',
    longueur: '',
    epaisseur: '',
    notes: ''
  });

  // Charger lot actif, prochain numéro et preset
  useEffect(() => {
    lotsApi.getAll()
      .then(r => {
        const enProduction = r.data
          .filter(c => c.statut === 'en_production')
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const active = enProduction[0] || r.data.find(c => c.statut === 'pret_production');
        const next = enProduction.length >= 2 ? enProduction[1] : null;
        if (active) {
          setLotActif(active);
          setNextLot(next);
          tubesApi.getProchainNumero()
            .then(r2 => {
              setProchainNumero(String(r2.data.numero));
              setForm(f => ({ ...f, numero: String(r2.data.numero) }));
            }).catch(() => {});
          if (active.parametre_id) {
            presetsApi.getById(active.parametre_id)
              .then(r3 => {
                const p = r3.data;
                setPreset(p);
                setEditForm({
                  strip_vitesse_m: p.strip_vitesse_m || 0,
                  strip_vitesse_cm: p.strip_vitesse_cm || 0,
                  milling_edge_gauche: p.milling_angle1 || 0,
                  milling_edge_droit: p.milling_angle2 || 0,
                  pression_rouleaux: p.pression_rouleaux || '',
                  pression_rouleaux_unite: p.pression_unite || 'tonnes',
                  tack_amperage: p.tack_amperage || 0,
                  tack_voltage: p.tack_voltage || 0,
                  tack_vitesse_m: p.tack_vitesse_m || 0,
                  tack_vitesse_cm: p.tack_vitesse_cm || 0,
                  tack_frequence: p.tack_frequence_hf || '',
                  tack_type_gaz: p.tack_type_gaz || 'CO2',
                  tack_debit_gaz: p.tack_debit_gaz || '',
                  soudure_vitesse_m: p.soudure_vitesse_m || 0,
                  soudure_vitesse_cm: p.soudure_vitesse_cm || 0,
                  soudure_type_fil: p.soudure_type_fil || '1.6mm',
                  soudure_type_flux: p.soudure_type_flux || 'SAW',
                  notes: '',
                });
                if (p.heads && p.heads.length > 0) {
                  setEditHeads(p.heads.map(h => ({ ...h })));
                } else if (p.tetes_config) {
                  try {
                    const tc = typeof p.tetes_config === 'string' ? JSON.parse(p.tetes_config) : p.tetes_config;
                    if (Array.isArray(tc) && tc.length > 0) setEditHeads(tc.map(h => ({ ...h })));
                  } catch {}
                }
              }).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  // Auto-remplir diamètre mm quand on choisit en pouces
  const handleDiametreChange = (value) => {
    const found = DIAMETRES.find(d => d.pouce === value);
    setForm(f => ({
      ...f,
      diametre_pouce: value,
      diametre_mm: found ? String(found.mm) : f.diametre_mm
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numero || !form.diametre_mm) {
      toast.error('Numéro et diamètre sont obligatoires');
      return;
    }
    if (!lotActif) {
      toast.error('Aucun lot actif trouvé');
      return;
    }
    if (form.type_tube === 'cross_welding' && !nextLot) {
      toast.error('Cross Welding impossible : un seul lot actif');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        lot_id: lotActif.id,
        type_tube: form.type_tube,
        numero: form.numero,
        diametre_mm: parseFloat(form.diametre_mm),
        diametre_pouce: form.diametre_pouce || null,
        longueur: form.longueur ? parseFloat(form.longueur) : null,
        epaisseur: form.epaisseur ? parseFloat(form.epaisseur) : null,
        notes: form.notes || null,
      };
      if (editingParams) {
        payload.parametres = { ...editForm, heads: editHeads };
      } else if (preset) {
        payload.parametre_id = preset.id;
      }
      await tubesApi.create(payload);
      toast.success(`Tube N°${form.numero} créé avec succès`);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold">Nouveau Tube</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Lot actif (info) */}
          {lotActif ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <span className="font-medium">Lot actif :</span>
              {lotActif.date_production && (
                <span className="text-blue-500">
                  {new Date(lotActif.date_production).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                  {new Date(lotActif.date_production).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                </span>
              )}
              N°{lotActif.numero} {lotActif.bobine_numero ? `(Bobine ${lotActif.bobine_numero})` : ''}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Aucun lot actif trouvé
            </div>
          )}

          {/* Type de Tube */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de Tube *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type_tube: 'normal' }))}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  form.type_tube === 'normal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-bold">Normal</span>
                <span className="text-xs opacity-70">Tube standard</span>
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type_tube: 'cross_welding' }))}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  form.type_tube === 'cross_welding'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-bold">Cross Welding</span>
                <span className="text-xs opacity-70">Soudure croisée</span>
              </button>
            </div>
          </div>

          {/* CW Info / Warning */}
          {form.type_tube === 'cross_welding' && (
            nextLot ? (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Cross Welding : Lot N°{lotActif?.numero} → N°{nextLot.numero}</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Ce tube sera rattaché aux deux lots. Le lot N°{lotActif?.numero} sera automatiquement clôturé.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Cross Welding impossible</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Il faut au moins 2 lots en production pour créer un tube Cross Welding.
                  </p>
                </div>
              </div>
            )
          )}

          {/* Paramètres de Production */}
          <div className="border border-violet-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-violet-50">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-800">Paramètres de Production</span>
                {preset && !editingParams && (
                  <span className="font-mono text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-300">
                    {preset.code}
                  </span>
                )}
              </div>
              {preset && (
                <button
                  type="button"
                  onClick={() => setEditingParams(!editingParams)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                    editingParams
                      ? 'bg-amber-100 text-amber-700 border-amber-300'
                      : 'bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200'
                  }`}
                >
                  <Edit3 className="w-3 h-3" /> {editingParams ? 'Annuler modif.' : 'Modifier'}
                </button>
              )}
            </div>
            <div className="p-3">
              {!preset ? (
                <div className="text-center py-3 text-gray-400">
                  <Settings className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">Aucun preset sur ce lot</p>
                </div>
              ) : !editingParams ? (
                /* Affichage résumé compact */
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Strip Speed</span>
                    <span className="font-medium">{preset.strip_vitesse_m}m{String(preset.strip_vitesse_cm || 0).padStart(2,'0')}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Milling</span>
                    <span className="font-medium">{preset.milling_angle1 || 0}° / {preset.milling_angle2 || 0}°</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Tack</span>
                    <span className="font-medium">{preset.tack_amperage}A / {preset.tack_voltage}V</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Soudure Speed</span>
                    <span className="font-medium">{preset.soudure_vitesse_m}m{String(preset.soudure_vitesse_cm || 0).padStart(2,'0')}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Fil / Flux</span>
                    <span className="font-medium">{preset.soudure_type_fil || '—'} / {preset.soudure_type_flux || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Têtes</span>
                    <span className="font-medium">
                      {(() => {
                        try {
                          const tc = preset.heads || (typeof preset.tetes_config === 'string' ? JSON.parse(preset.tetes_config) : preset.tetes_config) || [];
                          return `${tc.filter(h => h.actif).length} actives`;
                        } catch { return `${preset.nb_tetes || 0} actives`; }
                      })()}
                    </span>
                  </div>
                </div>
              ) : (
                /* Mode édition */
                <div className="space-y-3">
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Un nouveau preset sera créé avec vos modifications
                  </div>

                  {/* Formage */}
                  <TubeParamAccordion title="Formage" color="blue" open={openSections.formage} onToggle={() => setOpenSections(s => ({...s, formage: !s.formage}))}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Strip Speed</label>
                        <div className="flex gap-1">
                          <div className="flex-1">
                            <input type="number" value={editForm.strip_vitesse_m} onChange={e => setEditForm(f => ({...f, strip_vitesse_m: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" min="0" />
                            <span className="text-xs text-gray-400">m</span>
                          </div>
                          <div className="flex-1">
                            <input type="number" value={editForm.strip_vitesse_cm} onChange={e => setEditForm(f => ({...f, strip_vitesse_cm: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" min="0" max="99" />
                            <span className="text-xs text-gray-400">cm</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Pression rouleaux</label>
                        <div className="flex gap-1">
                          <input type="number" value={editForm.pression_rouleaux} onChange={e => setEditForm(f => ({...f, pression_rouleaux: e.target.value}))} className="flex-1 px-2 py-1.5 border rounded text-sm" />
                          <select value={editForm.pression_rouleaux_unite} onChange={e => setEditForm(f => ({...f, pression_rouleaux_unite: e.target.value}))} className="px-2 py-1.5 border rounded text-xs">
                            <option value="tonnes">t</option>
                            <option value="bars">bar</option>
                            <option value="psi">psi</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Milling gauche (°)</label>
                        <input type="number" value={editForm.milling_edge_gauche} onChange={e => setEditForm(f => ({...f, milling_edge_gauche: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Milling droit (°)</label>
                        <input type="number" value={editForm.milling_edge_droit} onChange={e => setEditForm(f => ({...f, milling_edge_droit: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                    </div>
                  </TubeParamAccordion>

                  {/* Tackwelding */}
                  <TubeParamAccordion title="Tackwelding" color="amber" open={openSections.tack} onToggle={() => setOpenSections(s => ({...s, tack: !s.tack}))}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ampérage (A)</label>
                        <input type="number" value={editForm.tack_amperage} onChange={e => setEditForm(f => ({...f, tack_amperage: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Voltage (V)</label>
                        <input type="number" value={editForm.tack_voltage} onChange={e => setEditForm(f => ({...f, tack_voltage: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Vitesse tack</label>
                        <div className="flex gap-1">
                          <input type="number" value={editForm.tack_vitesse_m} onChange={e => setEditForm(f => ({...f, tack_vitesse_m: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" min="0" />
                          <input type="number" value={editForm.tack_vitesse_cm} onChange={e => setEditForm(f => ({...f, tack_vitesse_cm: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" min="0" max="99" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fréquence</label>
                        <input type="number" value={editForm.tack_frequence} onChange={e => setEditForm(f => ({...f, tack_frequence: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type gaz</label>
                        <select value={editForm.tack_type_gaz} onChange={e => setEditForm(f => ({...f, tack_type_gaz: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm">
                          {GAZ_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Débit gaz (L/min)</label>
                        <input type="number" value={editForm.tack_debit_gaz} onChange={e => setEditForm(f => ({...f, tack_debit_gaz: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                    </div>
                  </TubeParamAccordion>

                  {/* Soudure Finale */}
                  <TubeParamAccordion title="Soudure Finale" color="orange" open={openSections.soudure} onToggle={() => setOpenSections(s => ({...s, soudure: !s.soudure}))}>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Vitesse soudure</label>
                        <div className="flex gap-1">
                          <input type="number" value={editForm.soudure_vitesse_m} onChange={e => setEditForm(f => ({...f, soudure_vitesse_m: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" min="0" />
                          <input type="number" value={editForm.soudure_vitesse_cm} onChange={e => setEditForm(f => ({...f, soudure_vitesse_cm: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded text-sm" min="0" max="99" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type flux</label>
                        <select value={editForm.soudure_type_flux} onChange={e => setEditForm(f => ({...f, soudure_type_flux: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm">
                          {FLUX_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Têtes de soudure */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600">Têtes de soudure</label>
                      {editHeads.map((head, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="w-12 text-xs font-mono text-gray-500">{head.type} #{head.numero}</span>
                          <button type="button" onClick={() => {
                            const updated = [...editHeads];
                            updated[idx] = {...updated[idx], actif: !updated[idx].actif};
                            setEditHeads(updated);
                          }}>
                            {head.actif ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                          </button>
                          {head.actif && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <select value={head.type_fil || '3.2mm'} onChange={e => { const u = [...editHeads]; u[idx] = {...u[idx], type_fil: e.target.value}; setEditHeads(u); }} className="w-20 px-1 py-1 border rounded text-sm">
                                {FIL_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                              <input type="number" value={head.amperage} onChange={e => { const u = [...editHeads]; u[idx] = {...u[idx], amperage: Number(e.target.value)}; setEditHeads(u); }} className="w-14 sm:w-16 px-1 sm:px-2 py-1 border rounded text-sm" placeholder="A" />
                              <span className="text-xs text-gray-400">A</span>
                              <input type="number" value={head.voltage} onChange={e => { const u = [...editHeads]; u[idx] = {...u[idx], voltage: Number(e.target.value)}; setEditHeads(u); }} className="w-14 sm:w-16 px-1 sm:px-2 py-1 border rounded text-sm" placeholder="V" />
                              <span className="text-xs text-gray-400">V</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TubeParamAccordion>
                </div>
              )}
            </div>
          </div>

          {/* Numéro de tube */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de tube *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.numero}
                onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              {prochainNumero && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, numero: String(prochainNumero) }))}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200"
                >Auto</button>
              )}
            </div>
            {prochainNumero && <p className="text-xs text-gray-400 mt-1">Suggestion : {prochainNumero}</p>}
          </div>

          {/* Diamètre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diamètre (pouces)</label>
              <select
                value={form.diametre_pouce}
                onChange={e => handleDiametreChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pouces --</option>
                {DIAMETRES.map(d => (
                  <option key={d.pouce} value={d.pouce}>{d.pouce} ({d.mm} mm)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diamètre (mm) *</label>
              <input
                type="number"
                step="0.1"
                value={form.diametre_mm}
                onChange={e => setForm(f => ({ ...f, diametre_mm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Longueur / Épaisseur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longueur (m)</label>
              <input
                type="number"
                step="0.01"
                value={form.longueur}
                onChange={e => setForm(f => ({ ...f, longueur: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Épaisseur (mm)</label>
              <input
                type="number"
                step="0.01"
                value={form.epaisseur}
                onChange={e => setForm(f => ({ ...f, epaisseur: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || (form.type_tube === 'cross_welding' && !nextLot)}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> {loading ? 'Création en cours...' : 'Créer le tube'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TubeDetailModal({ tube, onClose, onRefresh, canAct, isSystemAdmin }) {
  const toast = useToast();
  const { confirm } = useConfirm();
  const etapes = tube.etapes || [];

  // State
  const [loading, setLoading] = useState(false);
  const [responsabilites, setResponsabilites] = useState([]);
  const [photos, setPhotos] = useState({});
  const [historique, setHistorique] = useState([]);
  const [expandedHistorique, setExpandedHistorique] = useState([]);
  const [photoViewer, setPhotoViewer] = useState(null);

  // Sub-modal state
  const [showValiderModal, setShowValiderModal] = useState(null);
  const [showNCModal, setShowNCModal] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(null);
  const [showRepairModal, setShowRepairModal] = useState(null);
  const [showResolveRepairModal, setShowResolveRepairModal] = useState(null);
  const [showInterruptionModal, setShowInterruptionModal] = useState(null);
  const [showPasserModal, setShowPasserModal] = useState(null);
  const [showReviserRebutModal, setShowReviserRebutModal] = useState(false);

  const toggleHistorique = (etapeNum) => {
    setExpandedHistorique(prev =>
      prev.includes(etapeNum) ? prev.filter(n => n !== etapeNum) : [...prev, etapeNum]
    );
  };

  // Load responsabilites
  useEffect(() => {
    tubesApi.getResponsabilites().then(r => setResponsabilites(r.data)).catch(() => {});
  }, []);

  // Load photos for non-waiting étapes
  useEffect(() => {
    if (tube?.id) {
      etapes.forEach(e => {
        if (e.statut !== 'en_attente') {
          tubesApi.getPhotos(tube.id, e.etape_numero)
            .then(r => setPhotos(prev => ({ ...prev, [e.etape_numero]: r.data })))
            .catch(() => {});
        }
      });
    }
  }, [tube?.id]);

  // Load historique
  useEffect(() => {
    if (tube?.id) {
      tubesApi.getHistorique(tube.id).then(r => setHistorique(r.data)).catch(() => {});
    }
  }, [tube?.id]);

  // ============ ACTION HANDLERS ============

  const validerEtape = async (etapeNumero, commentaire, photoFiles) => {
    setLoading(true);
    try {
      await tubesApi.validerEtape(tube.id, { etape_numero: etapeNumero, commentaire });
      if (photoFiles?.length > 0) {
        const formData = new FormData();
        photoFiles.forEach(p => formData.append('photos', p));
        await tubesApi.uploadPhotos(tube.id, etapeNumero, formData);
      }
      toast.success('Étape validée');
      setShowValiderModal(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur validation');
    } finally {
      setLoading(false);
    }
  };

  const sauterEtape = async (etapeNumero, motif, photoFiles) => {
    setLoading(true);
    try {
      await tubesApi.sauterEtape(tube.id, { etape_numero: etapeNumero, motif });
      if (photoFiles?.length > 0) {
        const formData = new FormData();
        photoFiles.forEach(p => formData.append('photos', p));
        await tubesApi.uploadPhotos(tube.id, etapeNumero, formData);
      }
      toast.success('Étape passée');
      setShowPasserModal(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const validerOffline = async (etapeNumero) => {
    setLoading(true);
    try {
      await tubesApi.validerOffline(tube.id, { etape_numero: etapeNumero });
      toast.success('Étape offline validée');
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const marquerNC = async (etapeNumero, commentaire, photoFiles) => {
    setLoading(true);
    try {
      await tubesApi.nonConforme(tube.id, { etape_numero: etapeNumero, commentaire });
      if (photoFiles?.length > 0) {
        const formData = new FormData();
        photoFiles.forEach(p => formData.append('photos', p));
        await tubesApi.uploadPhotos(tube.id, etapeNumero, formData);
      }
      toast.success('Non-conformité enregistrée');
      setShowNCModal(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const resoudreNC = async (etapeNumero, action, commentaire) => {
    setLoading(true);
    try {
      await tubesApi.resoudreNC(tube.id, { etape_numero: etapeNumero, action, commentaire });
      toast.success('NC résolue');
      setShowResolveModal(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const reparerEtape = async (etapeNumero, repairData) => {
    setLoading(true);
    try {
      await tubesApi.reparerEtape(tube.id, {
        etape_numero: etapeNumero,
        commentaire: repairData.commentaire,
        defauts: repairData.defauts
      });
      if (repairData.photos?.length > 0) {
        const formData = new FormData();
        repairData.photos.forEach(p => formData.append('photos', p));
        await tubesApi.uploadPhotos(tube.id, etapeNumero, formData);
      }
      toast.success('Réparation initiée');
      setShowRepairModal(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const resoudreReparation = async (etapeNumero, action, commentaire) => {
    setLoading(true);
    try {
      await tubesApi.resoudreReparation(tube.id, { etape_numero: etapeNumero, action, commentaire });
      toast.success('Réparation résolue');
      setShowResolveRepairModal(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const interrompreEtape = async (etapeNumero, motif, commentaire) => {
    setLoading(true);
    try {
      await tubesApi.interrompreEtape(tube.id, { etape_numero: etapeNumero, motif, commentaire });
      toast.success('Étape interrompue');
      setShowInterruptionModal(null);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const reprendreEtape = async (etapeNumero) => {
    setLoading(true);
    try {
      await tubesApi.reprendreEtape(tube.id, { etape_numero: etapeNumero });
      toast.success('Étape reprise');
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const annulerEtape = async (etapeNumero) => {
    const prevEtape = etapes.find(e => e.etape_numero === etapeNumero - 1);
    const prevNom = prevEtape ? (ETAPES.find(e => e.numero === etapeNumero - 1)?.nom || `Étape ${etapeNumero - 1}`) : '';
    const ok = await confirm({
      type: 'warning',
      title: 'Annuler la validation',
      message: `Voulez-vous vraiment annuler ce stage et revenir au stage précédent ?\n\nStage concerné : « ${prevNom} »`,
      description: 'Cette opération est réservée à l\'Admin Système.',
      confirmLabel: 'Confirmer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setLoading(true);
    try {
      await tubesApi.annulerEtape(tube.id, { etape_numero: etapeNumero });
      toast.success(`Validation de « ${prevNom} » annulée`);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur annulation');
    } finally {
      setLoading(false);
    }
  };

  const reviserRebut = async (commentaire) => {
    setLoading(true);
    try {
      await tubesApi.reviserRebut(tube.id, { commentaire });
      toast.success('Rebut révisé');
      setShowReviserRebutModal(false);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const deletePhotoInline = async (photoId, etapeNumero) => {
    try {
      await tubesApi.deletePhoto(tube.id, photoId);
      toast.success('Photo supprimée');
      tubesApi.getPhotos(tube.id, etapeNumero)
        .then(r => setPhotos(prev => ({ ...prev, [etapeNumero]: r.data })))
        .catch(() => {});
    } catch { toast.error('Erreur suppression'); }
  };

  const downloadPDF = async () => {
    try {
      const res = await tubesApi.getPDF(tube.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tube_${tube.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Erreur téléchargement PDF'); }
  };

  // Computed
  const decisionInfo = DECISION_INFO[tube.decision] || DECISION_INFO.en_attente;
  const isDecided = tube.decision && tube.decision !== 'en_attente';
  const totalDuration = etapes.reduce((acc, e) => acc + getEtapeDuration(e), 0);
  const validatedCount = etapes.filter(e => e.statut === 'valide' || e.statut === 'saute').length;
  const progressPct = Math.round((validatedCount / TOTAL_ETAPES) * 100);

  const TYPE_BADGES = {
    validation: { label: 'Validation', cls: 'bg-green-100 text-green-700' },
    nc: { label: 'Non conformité', cls: 'bg-red-100 text-red-700' },
    reprise: { label: 'Reprise', cls: 'bg-blue-100 text-blue-700' },
    derogation: { label: 'Dérogation', cls: 'bg-purple-100 text-purple-700' },
    rebut: { label: 'Rebut', cls: 'bg-red-100 text-red-800' },
    reparation: { label: 'Réparation', cls: 'bg-orange-100 text-orange-700' },
    reparation_accepte: { label: 'Rép. acceptée', cls: 'bg-green-100 text-green-700' },
    reparation_derogation: { label: 'Rép. dérogation', cls: 'bg-purple-100 text-purple-700' },
    reparation_rebut: { label: 'Rép. rebut', cls: 'bg-red-100 text-red-700' },
    interruption: { label: 'Interruption', cls: 'bg-gray-100 text-gray-700' },
    reprise_interruption: { label: 'Reprise', cls: 'bg-blue-100 text-blue-700' },
    passer: { label: 'Passée', cls: 'bg-amber-100 text-amber-700' },
    validation_offline: { label: 'Valid. offline', cls: 'bg-indigo-100 text-indigo-700' },
    revision_rebut: { label: 'Révision rebut', cls: 'bg-violet-100 text-violet-700' },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl">

        {/* ====== HEADER ====== */}
        <div className="px-4 sm:px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Cylinder className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">Tube N°{tube.numero}</h2>
                <p className="text-xs text-gray-500 truncate">
                  Lot {tube.lot_numero || '—'}{tube.lot_numero_2 ? ` → ${tube.lot_numero_2}` : ''}
                  {tube.diametre_pouce ? ` • ${tube.diametre_pouce}` : tube.diametre_mm ? ` • ${tube.diametre_mm}mm` : ''}
                  {tube.type_tube === 'cross_welding' && ' • Cross Welding'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <button onClick={downloadPDF} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Rapport PDF">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 ml-13 sm:ml-[52px]">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              STATUT_COLORS[tube.statut]?.bg || 'bg-gray-100'
            } ${STATUT_COLORS[tube.statut]?.text || 'text-gray-800'}`}>
              {tube.statut === 'en_production' ? 'En production' :
               tube.statut === 'termine' ? 'Terminé' :
               tube.statut === 'rebut' ? 'Rebut' :
               tube.statut === 'en_attente' ? 'En attente' :
               tube.statut === 'en_reparation' ? 'En réparation' :
               tube.statut === 'interrompu' ? 'Interrompu' : tube.statut}
            </span>
            {isDecided && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${decisionInfo.bg} ${decisionInfo.text}`}>
                {decisionInfo.badge} {decisionInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* ====== SCROLLABLE BODY ====== */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto space-y-4 sm:space-y-6">

          {/* ---- Progress Bar ---- */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{validatedCount}/{TOTAL_ETAPES} étapes</span>
                <span className="font-semibold text-gray-700">{progressPct}%</span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDuration(totalDuration)}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex gap-1 mt-2">
              {ETAPES.map((etape, idx) => {
                const tubeEtape = etapes.find(e => e.etape_numero === etape.numero);
                const s = tubeEtape?.statut || 'en_attente';
                const bgMap = {
                  valide: 'bg-green-500', non_conforme: 'bg-red-500', en_cours: 'bg-blue-500',
                  saute: 'bg-amber-400', en_reparation: 'bg-orange-500', interrompu: 'bg-gray-400', en_attente: 'bg-gray-200'
                };
                return <div key={idx} className={`flex-1 h-1.5 rounded-full ${bgMap[s] || 'bg-gray-200'}`} title={`${etape.nom}: ${s}`} />;
              })}
            </div>
          </div>

          {/* ---- Info Badges ---- */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <InfoBadge label="Lot" value={tube.lot_numero || '—'} />
            {tube.bobine_numero && <InfoBadge label="Bobine" value={tube.bobine_numero} />}
            {tube.diametre_pouce && <InfoBadge label="Diamètre" value={`${tube.diametre_pouce} (${tube.diametre_mm}mm)`} />}
            {tube.epaisseur && <InfoBadge label="Épaisseur" value={`${tube.epaisseur} mm`} />}
            {tube.longueur && <InfoBadge label="Longueur" value={`${tube.longueur} m`} />}
            {tube.parametre_numero && <InfoBadge label="Preset" value={tube.parametre_numero} />}
            {tube.equipe_nom && <InfoBadge label="Équipe" value={tube.equipe_nom} />}
            <InfoBadge label="Créé le" value={tube.created_at ? new Date(tube.created_at).toLocaleDateString('fr-FR') : '—'} />
          </div>

          {/* ---- Paramètres Soudure ---- */}
          {tube.parametre_id && (
            <TubeParametresSection parametreId={tube.parametre_id} parametreCode={tube.parametre_numero} />
          )}

          {/* ====== VERTICAL TIMELINE ====== */}
          <div className="space-y-0">
            {ETAPES.map((etape, idx) => {
              const tubeEtape = etapes.find(e => e.etape_numero === etape.numero);
              const s = tubeEtape?.statut || 'en_attente';
              const statutColors = ETAPE_STATUT_COLORS[s] || ETAPE_STATUT_COLORS.en_attente;
              const Icon = etape.icon;
              const duration = getEtapeDuration(tubeEtape || {});
              const delay = getInterDelay(etapes, idx);
              const etapePhotos = photos[etape.numero] || [];
              const etapeHist = historique.filter(h => h.etape_numero === etape.numero);

              return (
                <div key={etape.numero} className="flex gap-3">
                  {/* Dot + connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                      s === 'valide' ? 'border-green-500 bg-green-100' :
                      s === 'en_cours' ? 'border-blue-500 bg-blue-100 animate-pulse' :
                      s === 'non_conforme' ? 'border-red-500 bg-red-100' :
                      s === 'en_reparation' ? 'border-orange-500 bg-orange-100' :
                      s === 'interrompu' ? 'border-gray-400 bg-gray-100' :
                      s === 'saute' ? 'border-amber-500 bg-amber-100' :
                      'border-gray-300 bg-gray-50'
                    }`}>
                      {s === 'valide' ? <Check className="w-4 h-4 text-green-600" /> :
                       s === 'en_cours' ? <Play className="w-3.5 h-3.5 text-blue-600" /> :
                       s === 'non_conforme' ? <XCircle className="w-4 h-4 text-red-600" /> :
                       s === 'en_reparation' ? <Wrench className="w-3.5 h-3.5 text-orange-600" /> :
                       s === 'interrompu' ? <PauseCircle className="w-3.5 h-3.5 text-gray-500" /> :
                       s === 'saute' ? <SkipForward className="w-3.5 h-3.5 text-amber-600" /> :
                       <span className="text-xs font-bold text-gray-400">{etape.numero}</span>}
                    </div>
                    {(idx < ETAPES.length - 1 || tube.statut === 'termine' || tube.statut === 'rebut') && (
                      <div className={`w-0.5 flex-1 min-h-[16px] ${
                        s === 'valide' || s === 'saute' ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>

                  {/* Étape content */}
                  <div className={`flex-1 mb-3 rounded-lg border ${statutColors.border} ${statutColors.bg} p-2.5 sm:p-3`}>
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 ${statutColors.icon} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {etape.numero}. {etape.nom}
                        </h4>
                        <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            s === 'valide' ? 'bg-green-100 text-green-700' :
                            s === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                            s === 'non_conforme' ? 'bg-red-100 text-red-700' :
                            s === 'en_reparation' ? 'bg-orange-100 text-orange-700' :
                            s === 'interrompu' ? 'bg-gray-200 text-gray-700' :
                            s === 'saute' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {s === 'valide' ? 'Validé' : s === 'en_cours' ? 'En cours' :
                             s === 'non_conforme' ? 'Non conforme' : s === 'en_reparation' ? 'En réparation' :
                             s === 'interrompu' ? 'Interrompu' : s === 'saute' ? 'Passée' : 'En attente'}
                          </span>
                          {duration > 0 && (
                            <span className="text-gray-500 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {formatDuration(duration)}
                            </span>
                          )}
                          {delay > 60000 && (
                            <span className="text-amber-600">+{formatDuration(delay)} attente</span>
                          )}
                          {etape.offline && s !== 'valide' && (
                            <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                              <WifiOff className="w-3 h-3" /> OFFLINE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons - wrapped for mobile */}
                    {canAct && (s === 'en_cours' || s === 'saute' || s === 'non_conforme' || s === 'en_reparation' || s === 'interrompu') && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-6">
                        {s === 'en_cours' && (
                          <>
                            <button
                              onClick={() => setShowValiderModal(etape.numero)}
                              className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Valider
                            </button>
                            {![1, 2, 4].includes(etape.numero) && (
                              <button
                                onClick={() => setShowRepairModal(etape.numero)}
                                className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 flex items-center gap-1"
                              >
                                <Wrench className="w-3 h-3" /> Réparer
                              </button>
                            )}
                            <button
                              onClick={() => setShowPasserModal(etape.numero)}
                              className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 flex items-center gap-1"
                            >
                              <SkipForward className="w-3 h-3" /> Passer
                            </button>
                            <button
                              onClick={() => setShowNCModal(etape.numero)}
                              className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> NC
                            </button>
                            <button
                              onClick={() => setShowInterruptionModal(etape.numero)}
                              className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600 flex items-center gap-1"
                            >
                              <PauseCircle className="w-3 h-3" /> Interrompre
                            </button>
                            {isSystemAdmin && etape.numero > 1 && (() => {
                              const prevTubeEtape = etapes.find(e => e.etape_numero === etape.numero - 1);
                              return prevTubeEtape?.statut === 'valide' ? (
                                <button
                                  onClick={() => annulerEtape(etape.numero)}
                                  className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-slate-500 text-white rounded-lg text-xs font-medium hover:bg-slate-600 flex items-center gap-1"
                                >
                                  <Undo2 className="w-3 h-3" /> Annuler
                                </button>
                              ) : null;
                            })()}
                          </>
                        )}

                        {s === 'saute' && (
                          <button
                            onClick={() => validerOffline(etape.numero)}
                            className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Valider maintenant
                          </button>
                        )}

                        {s === 'non_conforme' && (
                          <button
                            onClick={() => setShowResolveModal(etape.numero)}
                            className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Résoudre
                          </button>
                        )}

                        {s === 'en_reparation' && (
                          <button
                            onClick={() => setShowResolveRepairModal({ etape_numero: etape.numero })}
                            className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 flex items-center gap-1"
                          >
                            <Wrench className="w-3 h-3" /> Résoudre réparation
                          </button>
                        )}

                        {s === 'interrompu' && (
                          <button
                            onClick={() => reprendreEtape(etape.numero)}
                            className="px-2.5 py-1.5 sm:px-2 sm:py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Reprendre
                          </button>
                        )}
                      </div>
                    )}

                    {/* Validation info */}
                    {tubeEtape?.operateur_prenom && (
                      <p className="mt-1.5 text-[10px] text-gray-400">
                        Par {tubeEtape.operateur_prenom} {tubeEtape.operateur_nom?.[0]}.
                        {tubeEtape.completed_at && ` — ${new Date(tubeEtape.completed_at).toLocaleString('fr-FR')}`}
                      </p>
                    )}

                    {/* Commentaire */}
                    {tubeEtape?.commentaire && (
                      <p className="mt-1.5 text-xs text-gray-600 bg-white/60 rounded px-2 py-1 flex items-start gap-1">
                        <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {tubeEtape.commentaire}
                      </p>
                    )}

                    {/* Photos inline */}
                    {etapePhotos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {etapePhotos.map((p, pi) => (
                          <div
                            key={pi}
                            className="relative group cursor-pointer"
                            onClick={() => setPhotoViewer({ src: getPhotoUrl(p.path), alt: p.original_name })}
                          >
                            <img
                              src={getPhotoUrl(p.path)}
                              alt={p.original_name || `Photo ${pi + 1}`}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                            />
                            {canAct && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deletePhotoInline(p.id, etape.numero); }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Historique per étape */}
                    {etapeHist.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleHistorique(etape.numero)}
                          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700"
                        >
                          <History className="w-3 h-3" /> Historique ({etapeHist.length})
                          {expandedHistorique.includes(etape.numero) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {expandedHistorique.includes(etape.numero) && (
                          <div className="mt-1 space-y-1">
                            {etapeHist.map((h, hi) => {
                              const badge = TYPE_BADGES[h.type_action] || { label: h.type_action, cls: 'bg-gray-100 text-gray-600' };
                              return (
                                <div key={hi} className="flex items-start gap-2 text-[10px] bg-white/60 rounded px-2 py-1">
                                  <span className={`px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${badge.cls}`}>
                                    {badge.label}
                                  </span>
                                  <div className="flex-1">
                                    {h.commentaire && <span className="text-gray-600">{h.commentaire}</span>}
                                    <span className="text-gray-400 ml-1">
                                      — {h.operateur_prenom || ''} {h.operateur_nom?.[0] || ''}.
                                      {' '}{new Date(h.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {h.defauts?.length > 0 && (
                                      <div className="mt-0.5 space-y-0.5">
                                        {h.defauts.map((d, di) => (
                                          <div key={di} className="bg-orange-50 rounded px-1.5 py-0.5 border border-orange-100">
                                            <span className="font-medium">Défaut {di + 1}:</span> {d.defaut}
                                            {d.cause_defaut && <span> — Cause: {d.cause_defaut}</span>}
                                            {d.responsabilite_nom && <span> — Resp: {d.responsabilite_nom}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ---- Decision Stage (après étape 12) ---- */}
            {tube.statut === 'termine' && (
              <div className="flex gap-3">
                {/* Dot + connector */}
                <div className="flex flex-col items-center">
                  {/* Connector from step 12 */}
                  <div className={`w-0.5 h-4 ${
                    (tube.etapes || []).find(e => e.etape_numero === 12)?.statut === 'valide' ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                  {/* Decision dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                    tube.decision && tube.decision !== 'en_attente'
                      ? 'border-green-500 bg-green-100'
                      : 'border-amber-500 bg-amber-100 animate-pulse'
                  }`}>
                    {tube.decision && tube.decision !== 'en_attente'
                      ? <Check className="w-4 h-4 text-green-600" />
                      : <Award className="w-4 h-4 text-amber-600" />
                    }
                  </div>
                </div>
                {/* Decision content */}
                <div className="flex-1 mb-3">
                  <DecisionPanel tube={tube} canAct={canAct} onRefresh={onRefresh} />
                </div>
              </div>
            )}

            {/* ---- Rebut: Réviser ---- */}
            {canAct && tube.statut === 'rebut' && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-red-300" />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-red-500 bg-red-100">
                    <RotateCcw className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 mb-3">
                  <button
                    onClick={() => setShowReviserRebutModal(true)}
                    className="w-full py-2.5 bg-violet-50 text-violet-700 rounded-xl text-sm font-medium border border-violet-200 hover:bg-violet-100 flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Réviser la décision de rebut
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---- Notes ---- */}
          {tube.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-800">
                <MessageSquare className="w-4 h-4 inline mr-1" /> {tube.notes}
              </p>
            </div>
          )}
        </div>

        {/* ====== FOOTER ====== */}
        <div className="flex justify-end px-4 sm:px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 w-full sm:w-auto">
            Fermer
          </button>
        </div>
      </div>

      {/* ====== SUB-MODALS ====== */}
      {showValiderModal && (
        <ValiderModal
          etapeNumero={showValiderModal}
          onSubmit={(comment, photoFiles) => validerEtape(showValiderModal, comment, photoFiles)}
          onClose={() => setShowValiderModal(null)}
          loading={loading}
        />
      )}

      {showPasserModal && (
        <PasserModal
          etapeNumero={showPasserModal}
          onSubmit={(motif, photoFiles) => sauterEtape(showPasserModal, motif, photoFiles)}
          onClose={() => setShowPasserModal(null)}
          loading={loading}
        />
      )}

      {showNCModal && (
        <NCModal
          etapeNumero={showNCModal}
          onSubmit={(comment, photoFiles) => marquerNC(showNCModal, comment, photoFiles)}
          onClose={() => setShowNCModal(null)}
          loading={loading}
        />
      )}

      {showResolveModal && (
        <ResolveNCModal
          etapeNumero={showResolveModal}
          onSubmit={(action, comment) => resoudreNC(showResolveModal, action, comment)}
          onClose={() => setShowResolveModal(null)}
          loading={loading}
        />
      )}

      {showRepairModal && (
        <RepairModal
          etapeNumero={showRepairModal}
          onSubmit={(repairData) => reparerEtape(showRepairModal, repairData)}
          onClose={() => setShowRepairModal(null)}
          loading={loading}
          responsabilites={responsabilites}
        />
      )}

      {showResolveRepairModal && (
        <ResolveRepairModal
          etapeNumero={showResolveRepairModal.etape_numero}
          onSubmit={(action, comment) => resoudreReparation(showResolveRepairModal.etape_numero, action, comment)}
          onClose={() => setShowResolveRepairModal(null)}
          loading={loading}
        />
      )}

      {showInterruptionModal && (
        <InterruptionModal
          etapeNumero={showInterruptionModal}
          onSubmit={(motif, comment) => interrompreEtape(showInterruptionModal, motif, comment)}
          onClose={() => setShowInterruptionModal(null)}
          loading={loading}
        />
      )}

      {showReviserRebutModal && (
        <ReviserRebutModal
          tube={tube}
          onSubmit={(comment) => reviserRebut(comment)}
          onClose={() => setShowReviserRebutModal(false)}
          loading={loading}
        />
      )}

      {/* Photo Viewer Overlay */}
      {photoViewer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4" onClick={() => setPhotoViewer(null)}>
          <button
            onClick={() => setPhotoViewer(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={photoViewer.src}
            alt={photoViewer.alt}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// DecisionPanel - Décision finale après production
// ============================================
function DecisionPanel({ tube, canAct, onRefresh }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [panelOpened, setPanelOpened] = useState(false);

  const decisionInfo = DECISION_INFO[tube.decision] || DECISION_INFO.en_attente;
  const isDecided = tube.decision && tube.decision !== 'en_attente';

  const openDecisionPanel = async () => {
    setPanelOpened(true);
    try {
      await tubesApi.debutDecision(tube.id);
    } catch (err) {
      console.error('Erreur début décision:', err);
    }
  };

  const validerDecision = async () => {
    if (!selectedDecision) return;
    setLoading(true);
    try {
      await tubesApi.decision(tube.id, {
        decision: selectedDecision,
        commentaire: commentaire || null
      });
      const label = DECISION_INFO[selectedDecision]?.label || selectedDecision;
      toast.success(`Décision enregistrée : ${label}`);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur décision');
    } finally {
      setLoading(false);
    }
  };

  const decisions = [
    {
      value: 'certifie_api', label: 'Certifié API',
      desc: 'Conforme aux normes API 5L',
      icon: Trophy, color: 'emerald',
      btnClass: 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100',
      selectedClass: 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300',
      iconColor: 'text-emerald-600'
    },
    {
      value: 'certifie_hydraulique', label: 'Certifié Hydraulique',
      desc: 'Usage hydraulique uniquement',
      icon: Wrench, color: 'blue',
      btnClass: 'border-blue-500 bg-blue-50 hover:bg-blue-100',
      selectedClass: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300',
      iconColor: 'text-blue-600'
    },
    {
      value: 'declasse', label: 'Déclassé',
      desc: 'Ne répond pas aux critères de certification',
      icon: AlertTriangle, color: 'orange',
      btnClass: 'border-orange-500 bg-orange-50 hover:bg-orange-100',
      selectedClass: 'border-orange-500 bg-orange-100 ring-2 ring-orange-300',
      iconColor: 'text-orange-600'
    },
  ];

  // Décision déjà prise — affichage résumé
  if (isDecided) {
    return (
      <div className={`${decisionInfo.bg} border ${decisionInfo.border} rounded-lg p-4`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{decisionInfo.badge}</span>
          <div>
            <h3 className={`font-bold ${decisionInfo.text}`}>Décision : {decisionInfo.label}</h3>
            <p className="text-sm text-gray-600">
              Par {tube.decision_par || '—'} le {tube.decision_date ? new Date(tube.decision_date).toLocaleString('fr-FR') : '—'}
            </p>
          </div>
        </div>
        {tube.decision_commentaire && (
          <p className="text-sm text-gray-600 italic mt-1 flex items-start gap-1">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {tube.decision_commentaire}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500">
          <div>
            <span className="block font-medium text-gray-600">Fin production</span>
            {tube.date_fin_production ? new Date(tube.date_fin_production).toLocaleString('fr-FR') : '—'}
          </div>
          <div>
            <span className="block font-medium text-gray-600">Début décision</span>
            {tube.date_debut_decision ? new Date(tube.date_debut_decision).toLocaleString('fr-FR') : '—'}
          </div>
          <div>
            <span className="block font-medium text-gray-600">Fin décision</span>
            {tube.date_fin_decision ? new Date(tube.date_fin_decision).toLocaleString('fr-FR') : '—'}
          </div>
        </div>
      </div>
    );
  }

  // Pas encore décidé — panneau interactif
  return (
    <div className="border border-green-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <h3 className="font-bold text-green-700">Production terminée</h3>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          ⏳ Décision en attente
        </span>
      </div>

      {/* Timestamps */}
      {tube.date_fin_production && (
        <div className="px-4 py-2 bg-green-50/50 border-b border-green-100 text-xs text-gray-500">
          Production terminée le {new Date(tube.date_fin_production).toLocaleString('fr-FR')}
        </div>
      )}

      {!panelOpened ? (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 mb-3">Toutes les {TOTAL_ETAPES} étapes ont été validées. Prendre la décision finale ?</p>
          {canAct && (
            <button
              onClick={openDecisionPanel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Award className="w-4 h-4" /> Ouvrir le panneau de décision
            </button>
          )}
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3 font-medium">Choisir la décision :</p>

          {/* 3 choix */}
          <div className="space-y-2 mb-4">
            {decisions.map(d => {
              const DIcon = d.icon;
              const isSelected = selectedDecision === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setSelectedDecision(d.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? d.selectedClass : d.btnClass
                  }`}
                >
                  <DIcon className={`w-5 h-5 ${d.iconColor}`} />
                  <div>
                    <p className={`font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{d.label}</p>
                    <p className="text-xs text-gray-500">{d.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Commentaire */}
          <textarea
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Commentaire de décision (optionnel)"
          />

          {/* Valider */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setPanelOpened(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={validerDecision}
              disabled={loading || !selectedDecision}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
            >
              <Award className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Valider la décision'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TubeParametresSection - Résumé paramètres soudure
// ============================================
function TubeParametresSection({ parametreId, parametreCode }) {
  const [preset, setPreset] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (parametreId) {
      presetsApi.getById(parametreId)
        .then(r => setPreset(r.data))
        .catch(() => {});
    }
  }, [parametreId]);

  if (!preset) return null;
  const activeHeads = (preset.heads || []).filter(h => h.actif);

  return (
    <div className="border border-violet-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-800">Paramètres de soudure</span>
          <span className="font-mono text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-300">
            {parametreCode || preset.code}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-violet-500" /> : <ChevronDown className="w-4 h-4 text-violet-500" />}
      </button>
      {open && (
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 block">Strip Speed</span>
              <span className="font-medium">{preset.strip_vitesse_m}m{String(preset.strip_vitesse_cm || 0).padStart(2,'0')}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Milling</span>
              <span className="font-medium">{preset.milling_angle1}° / {preset.milling_angle2}°</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Tack</span>
              <span className="font-medium">{preset.tack_amperage}A / {preset.tack_voltage}V</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Soudure Speed</span>
              <span className="font-medium">{preset.soudure_vitesse_m}m{String(preset.soudure_vitesse_cm || 0).padStart(2,'0')}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Flux</span>
              <span className="font-medium">{preset.soudure_type_flux}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Têtes</span>
              <span className="font-medium">{activeHeads.length} actives</span>
            </div>
          </div>
          {activeHeads.length > 0 && (
            <div className="mt-3 pt-3 border-t border-violet-100">
              <div className="flex flex-wrap gap-2">
                {activeHeads.map((h, i) => (
                  <span key={i} className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded border border-violet-200">
                    {h.type} #{h.numero}: {h.type_fil || '3.2mm'} — {h.amperage}A / {h.voltage}V
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// InfoBadge
// ============================================
function InfoBadge({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 text-sm">{value}</p>
    </div>
  );
}

// ============================================
// PhotoUploadSection - Upload photos réutilisable
// ============================================
function PhotoUploadSection({ files, setFiles }) {
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-4">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
        <Camera className="w-4 h-4" /> Photos (optionnel)
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {files.map((file, idx) => (
          <div key={idx} className="relative group">
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => removeFile(idx)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {files.length < 5 && (
          <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Camera className="w-5 h-5 text-gray-400" />
            <span className="text-[11px] text-gray-400 mt-0.5">Ajouter</span>
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-[11px] text-gray-400">{files.length}/5 photos · Max 5MB</p>
    </div>
  );
}

// ============================================
// ValiderModal - Valider une étape avec photos
// ============================================
function ValiderModal({ etapeNumero, onSubmit, onClose, loading }) {
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const etape = ETAPES.find(e => e.numero === etapeNumero);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4 text-green-600">
          <Check className="w-6 h-6" />
          <h3 className="font-bold text-lg">Valider l'étape</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Étape {etapeNumero}: <strong>{etape?.nom}</strong>
        </p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500"
          rows={2}
          placeholder="Commentaire (optionnel)"
          autoFocus
        />
        <PhotoUploadSection files={photos} setFiles={setPhotos} />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => onSubmit(comment, photos)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {photos.length > 0 && <Camera className="w-4 h-4" />}
            {loading ? 'Validation...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PasserModal - Motif du passage d'étape avec photos
// ============================================
function PasserModal({ etapeNumero, onSubmit, onClose, loading }) {
  const [motif, setMotif] = useState('');
  const [photos, setPhotos] = useState([]);
  const etape = ETAPES.find(e => e.numero === etapeNumero);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4 text-amber-600">
          <SkipForward className="w-6 h-6" />
          <h3 className="font-bold text-lg">Passer l'étape</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Étape {etapeNumero}: <strong>{etape?.nom}</strong>
          <br />Cette étape sera marquée comme passée et pourra être validée plus tard.
        </p>
        <textarea
          value={motif}
          onChange={e => setMotif(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          rows={3}
          placeholder="Motif du passage"
          autoFocus
        />
        <PhotoUploadSection files={photos} setFiles={setPhotos} />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => onSubmit(motif, photos)}
            disabled={loading}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? 'En cours...' : 'Confirmer le passage'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// NCModal - Détailler la non-conformité avec photos
// ============================================
function NCModal({ etapeNumero, onSubmit, onClose, loading }) {
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const etape = ETAPES.find(e => e.numero === etapeNumero);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4 text-red-600">
          <AlertOctagon className="w-6 h-6" />
          <h3 className="font-bold text-lg">Non-conformité</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Étape {etapeNumero}: <strong>{etape?.nom}</strong>
          <br />Décrivez la non-conformité constatée.
        </p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500"
          rows={3}
          placeholder="Décrire la non-conformité..."
          required
        />
        <PhotoUploadSection files={photos} setFiles={setPhotos} />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => onSubmit(comment, photos)}
            disabled={loading || !comment.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {photos.length > 0 && <Camera className="w-4 h-4" />}
            {loading ? 'En cours...' : 'Confirmer NC'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ResolveNCModal - Résoudre une non-conformité
// ============================================
function ResolveNCModal({ etapeNumero, onSubmit, onClose, loading }) {
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const etape = ETAPES.find(e => e.numero === etapeNumero);

  const actions = [
    {
      value: 'reprise', label: 'Reprise',
      desc: 'Reprendre l\'étape depuis le début',
      icon: RotateCcw, color: 'blue'
    },
    {
      value: 'derogation', label: 'Dérogation',
      desc: 'Accepter malgré la non-conformité',
      icon: ShieldCheck, color: 'amber'
    },
    {
      value: 'rebut', label: 'Rebut',
      desc: 'Mettre le tube au rebut définitif',
      icon: Ban, color: 'red'
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4 text-orange-600">
          <RotateCcw className="w-6 h-6" />
          <h3 className="font-bold text-lg">Résoudre la NC</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Étape {etapeNumero}: <strong>{etape?.nom}</strong>
        </p>

        {/* Choix d'action */}
        <div className="space-y-2 mb-4">
          {actions.map(a => {
            const AIcon = a.icon;
            const colorMap = {
              blue: { border: 'border-blue-500 bg-blue-50', icon: 'text-blue-600' },
              amber: { border: 'border-amber-500 bg-amber-50', icon: 'text-amber-600' },
              red: { border: 'border-red-500 bg-red-50', icon: 'text-red-600' },
            };
            const colors = colorMap[a.color];
            const isSelected = action === a.value;

            return (
              <button
                key={a.value}
                onClick={() => setAction(a.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected ? colors.border : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AIcon className={`w-5 h-5 ${isSelected ? colors.icon : 'text-gray-400'}`} />
                <div>
                  <p className={`font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{a.label}</p>
                  <p className="text-xs text-gray-400">{a.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-500"
          rows={2}
          placeholder="Justification..."
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => onSubmit(action, comment)}
            disabled={loading || !action}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'En cours...' : 'Appliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// RepairModal - Initier une réparation (multi-défauts)
// ============================================
function RepairModal({ etapeNumero, onSubmit, onClose, loading, responsabilites = [] }) {
  const [defauts, setDefauts] = useState([
    { id: 1, defaut: '', cause_defaut: '', responsabilite_id: '', action_prise: '' }
  ]);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [showAddResp, setShowAddResp] = useState(false);
  const [newRespName, setNewRespName] = useState('');
  const [activeDefautIndex, setActiveDefautIndex] = useState(0);
  const etape = ETAPES.find(e => e.numero === etapeNumero);

  const addDefaut = () => {
    const newId = Math.max(...defauts.map(d => d.id)) + 1;
    setDefauts([...defauts, { id: newId, defaut: '', cause_defaut: '', responsabilite_id: '', action_prise: '' }]);
  };

  const removeDefaut = (id) => {
    if (defauts.length > 1) {
      setDefauts(defauts.filter(d => d.id !== id));
    }
  };

  const updateDefaut = (id, field, value) => {
    setDefauts(defauts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleSubmit = () => {
    const defautsValides = defauts.filter(d => d.defaut.trim());
    onSubmit({
      defauts: defautsValides,
      commentaire: comment,
      photos
    });
  };

  const canSubmit = defauts.some(d => d.defaut.trim());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-4">
        <div className="flex items-center gap-2 mb-4 text-orange-600">
          <Wrench className="w-6 h-6" />
          <h3 className="font-bold text-lg">Initier une réparation</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Étape {etapeNumero}: <strong>{etape?.nom}</strong>
          <br />Décrivez le(s) défaut(s) constaté(s) et l'action corrective.
        </p>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Liste des défauts */}
          {defauts.map((d, index) => (
            <div key={d.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-orange-600 flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  Défaut {defauts.length > 1 ? `#${index + 1}` : ''}
                </span>
                {defauts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDefaut(d.id)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                    title="Supprimer ce défaut"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Défaut constaté {index === 0 && '*'}
                  </label>
                  <textarea
                    value={d.defaut}
                    onChange={e => updateDefaut(d.id, 'defaut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    rows={2}
                    placeholder="Décrire le défaut..."
                    autoFocus={index === 0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cause du défaut</label>
                  <textarea
                    value={d.cause_defaut}
                    onChange={e => updateDefaut(d.id, 'cause_defaut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    rows={2}
                    placeholder="Cause probable..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsabilité</label>
                  <div className="flex gap-2">
                    <select
                      value={d.responsabilite_id}
                      onChange={e => updateDefaut(d.id, 'responsabilite_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    >
                      <option value="">-- Sélectionner --</option>
                      {responsabilites.map(r => (
                        <option key={r.id} value={r.id}>{r.nom}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setActiveDefautIndex(index); setShowAddResp(true); }}
                      className="px-2 py-2 text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-300"
                      title="Ajouter une responsabilité"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action à prendre</label>
                  <textarea
                    value={d.action_prise}
                    onChange={e => updateDefaut(d.id, 'action_prise', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    rows={2}
                    placeholder="Action corrective..."
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Bouton ajouter un défaut */}
          <button
            type="button"
            onClick={addDefaut}
            className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un défaut
          </button>

          {/* Photos */}
          <PhotoUploadSection files={photos} setFiles={setPhotos} />

          {/* Commentaire général */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows={2}
              placeholder="Remarques supplémentaires..."
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-sm text-gray-500">
            {defauts.filter(d => d.defaut.trim()).length} défaut(s) renseigné(s)
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              {photos.length > 0 && <Camera className="w-4 h-4" />}
              <Wrench className="w-4 h-4" />
              {loading ? 'En cours...' : 'Lancer la réparation'}
            </button>
          </div>
        </div>

        {/* Modal ajout responsabilité */}
        {showAddResp && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl p-4 w-80">
              <h4 className="font-semibold mb-3">Nouvelle responsabilité</h4>
              <input
                type="text"
                value={newRespName}
                onChange={e => setNewRespName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-3"
                placeholder="Nom de la responsabilité"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddResp(false); setNewRespName(''); }} className="px-3 py-1 text-gray-600">Annuler</button>
                <button
                  onClick={async () => {
                    if (newRespName.trim()) {
                      try {
                        const { responsabilitesApi } = await import('../services/api');
                        const res = await responsabilitesApi.create({ nom: newRespName.trim() });
                        responsabilites.push(res.data);
                        const defautActif = defauts[activeDefautIndex];
                        if (defautActif) {
                          updateDefaut(defautActif.id, 'responsabilite_id', res.data.id);
                        }
                        setShowAddResp(false);
                        setNewRespName('');
                      } catch (e) { console.error(e); }
                    }
                  }}
                  className="px-3 py-1 bg-orange-500 text-white rounded-lg"
                >Ajouter</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ResolveRepairModal - Résoudre une réparation
// ============================================
function ResolveRepairModal({ etapeNumero, onSubmit, onClose, loading }) {
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const etape = ETAPES.find(e => e.numero === etapeNumero);

  const actions = [
    {
      value: 'accepter', label: 'Accepter',
      desc: 'Réparation réussie, continuer la production',
      icon: Check, color: 'green'
    },
    {
      value: 'encore_reparation', label: 'Encore en réparation',
      desc: 'Nécessite une réparation supplémentaire',
      icon: Wrench, color: 'orange'
    },
    {
      value: 'derogation', label: 'Dérogation',
      desc: 'Accepter avec dérogation',
      icon: ShieldCheck, color: 'amber'
    },
    {
      value: 'rebut', label: 'Rebut',
      desc: 'Mettre le tube au rebut',
      icon: Ban, color: 'red'
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4 text-orange-600">
          <Wrench className="w-6 h-6" />
          <h3 className="font-bold text-lg">Résoudre la réparation</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Étape {etapeNumero}: <strong>{etape?.nom}</strong>
        </p>

        {/* Choix d'action */}
        <div className="space-y-2 mb-4">
          {actions.map(a => {
            const AIcon = a.icon;
            const colorMap = {
              green: { border: 'border-green-500 bg-green-50', icon: 'text-green-600' },
              orange: { border: 'border-orange-500 bg-orange-50', icon: 'text-orange-600' },
              amber: { border: 'border-amber-500 bg-amber-50', icon: 'text-amber-600' },
              red: { border: 'border-red-500 bg-red-50', icon: 'text-red-600' },
            };
            const colors = colorMap[a.color];
            const isSelected = action === a.value;

            return (
              <button
                key={a.value}
                onClick={() => setAction(a.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected ? colors.border : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AIcon className={`w-5 h-5 ${isSelected ? colors.icon : 'text-gray-400'}`} />
                <div>
                  <p className={`font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{a.label}</p>
                  <p className="text-xs text-gray-400">{a.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-500"
          rows={2}
          placeholder="Commentaire sur la réparation..."
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => onSubmit(action, comment)}
            disabled={loading || !action}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'En cours...' : 'Appliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// InterruptionModal - Interrompre une étape
// ============================================
function InterruptionModal({ etapeNumero, onSubmit, onClose, loading }) {
  const [motif, setMotif] = useState('');
  const [comment, setComment] = useState('');
  const etape = ETAPES.find(e => e.numero === etapeNumero);

  const motifs = [
    { value: 'Panne machine', icon: '🔧', label: 'Panne machine', desc: 'Arrêt dû à une panne' },
    { value: 'Manque de fictif', icon: '📦', label: 'Manque de fictif', desc: 'Matériel fictif manquant' },
    { value: 'Manque matériel', icon: '🏗️', label: 'Manque matériel', desc: 'Outillage / consommables' },
    { value: 'Maintenance planifiée', icon: '🛠️', label: 'Maintenance planifiée', desc: 'Intervention programmée' },
    { value: 'Attente personnel', icon: '👷', label: 'Attente personnel', desc: 'Équipe incomplète' },
    { value: 'Coupure électrique', icon: '⚡', label: 'Coupure électrique', desc: 'Problème alimentation' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4 text-yellow-600">
          <PauseCircle className="w-6 h-6" />
          <h3 className="font-bold text-lg">Interrompre l'étape</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Étape {etapeNumero}: <strong>{etape?.nom}</strong>
        </p>

        {/* Choix du motif */}
        <p className="text-xs font-medium text-gray-500 mb-2">Motif d'interruption</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {motifs.map(m => (
            <button
              key={m.value}
              onClick={() => setMotif(m.value)}
              className={`flex items-center gap-2 p-2.5 sm:p-2.5 rounded-lg border-2 text-left transition-all text-xs ${
                motif === m.value
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title={m.desc}
            >
              <span className="text-base">{m.icon}</span>
              <span className={`font-medium ${motif === m.value ? 'text-gray-900' : 'text-gray-600'}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          rows={2}
          placeholder="Détails supplémentaires..."
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Annuler
          </button>
          <button
            onClick={() => onSubmit(motif, comment)}
            disabled={loading || !motif}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            <PauseCircle className="w-4 h-4" />
            {loading ? 'En cours...' : 'Interrompre'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ReviserRebutModal - Réviser une décision de rebut
// ============================================
function ReviserRebutModal({ tube, onSubmit, onClose, loading }) {
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4 text-violet-600">
          <RotateCcw className="w-6 h-6" />
          <h3 className="font-bold text-lg">Réviser le rebut</h3>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-violet-800">
            <strong>Tube N°{tube.numero}</strong> est actuellement <span className="font-semibold text-red-600">au rebut</span>.
          </p>
          <p className="text-xs text-violet-600 mt-1">
            La révision remettra le tube en statut non-conforme pour réévaluation.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Cette action sera tracée dans l'historique du tube avec votre identifiant.
          </p>
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          rows={3}
          placeholder="Justification de la révision..."
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Annuler
          </button>
          <button
            onClick={() => onSubmit(comment)}
            disabled={loading || !comment.trim()}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            {loading ? 'En cours...' : 'Réviser le rebut'}
          </button>
        </div>
      </div>
    </div>
  );
}
