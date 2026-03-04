import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { lotsApi, presetsApi, equipesApi } from '../services/api';
import { 
  Play, Plus, Search, RefreshCw, Clock, Package, Truck, Wrench, 
  ClipboardCheck, Check, CheckCircle, X, AlertTriangle, Eye,
  Download, Trash2, ChevronDown, ChevronUp, Edit3, Save,
  Settings, Square, ToggleRight, ToggleLeft, Users
} from 'lucide-react';

// Constantes statuts
const STATUTS = {
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Clock, dotColor: 'bg-blue-500' },
  pret_production: { label: 'Prêt production', color: 'bg-green-100 text-green-800', icon: CheckCircle, dotColor: 'bg-green-500' },
  en_production: { label: 'En production', color: 'bg-orange-100 text-orange-800', icon: Play, dotColor: 'bg-orange-500' },
  termine: { label: 'Terminé', color: 'bg-gray-100 text-gray-800', icon: Check, dotColor: 'bg-gray-500' },
  annule: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: X, dotColor: 'bg-red-500' },
};

// Options pour paramètres inline edit
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
  { type: 'ID', numero: 1, actif: true, amperage: 0, voltage: 0 },
  { type: 'ID', numero: 2, actif: true, amperage: 0, voltage: 0 },
  { type: 'ID', numero: 3, actif: false, amperage: 0, voltage: 0 },
  { type: 'OD', numero: 1, actif: true, amperage: 0, voltage: 0 },
  { type: 'OD', numero: 2, actif: true, amperage: 0, voltage: 0 },
];

export default function BobineProduction() {
  const { user, canAct, isSystemAdmin } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Data for modals
  const [bobinesDisponibles, setBobinesDisponibles] = useState([]);
  const [prochainNumero, setProchainNumero] = useState('');
  const [motifsRetard, setMotifsRetard] = useState({ reception: [], installation: [] });
  const [presetsDisponibles, setPresetsDisponibles] = useState([]);
  const [equipesDisponibles, setEquipesDisponibles] = useState([]);
  const [preselectedBobineId, setPreselectedBobineId] = useState(null);

  const fetchLots = useCallback(async () => {
    try {
      const res = await lotsApi.getAll();
      setLots(res.data);
    } catch (error) {
      toast.error('Erreur chargement des lots');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await lotsApi.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLots(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchLots, fetchStats]);

  const openNewModal = async () => {
    try {
      const [bobinesRes, numeroRes, motifsRes, presetsRes, equipesRes] = await Promise.all([
        lotsApi.getBobinesDisponibles(),
        lotsApi.getProchainNumero(),
        lotsApi.getMotifsRetard(),
        presetsApi.getAll(),
        equipesApi.getAll()
      ]);
      setBobinesDisponibles(bobinesRes.data);
      setProchainNumero(numeroRes.data.numero);
      setMotifsRetard(motifsRes.data.grouped || { reception: [], installation: [] });
      setPresetsDisponibles(presetsRes.data || []);
      setEquipesDisponibles((equipesRes.data || []).filter(e => e.actif));
      setShowNewModal(true);
    } catch (error) {
      toast.error('Erreur chargement données');
    }
  };

  const handleCreateLot = async (bobineId, numero, presetId, equipeId) => {
    try {
      const res = await lotsApi.create({ numero, bobine_id: bobineId, parametre_id: presetId, equipe_id: equipeId });
      toast.success('Lot créé avec succès');
      setShowNewModal(false);
      setPreselectedBobineId(null);
      await Promise.all([fetchLots(), fetchStats()]);
      // Ouvrir le détail immédiatement  
      const detailRes = await lotsApi.getById(res.data.id);
      setSelectedLot(detailRes.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur création lot');
    }
  };

  const openDetailModal = async (lotId) => {
    try {
      const [lotRes, motifsRes, presetsRes] = await Promise.all([
        lotsApi.getById(lotId),
        lotsApi.getMotifsRetard(),
        presetsApi.getAll()
      ]);
      setSelectedLot(lotRes.data);
      setMotifsRetard(motifsRes.data.grouped || { reception: [], installation: [] });
      setPresetsDisponibles(presetsRes.data || []);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Erreur chargement lot');
    }
  };

  const refreshDetailModal = async () => {
    if (selectedLot) {
      try {
        const res = await lotsApi.getById(selectedLot.id);
        setSelectedLot(res.data);
        await Promise.all([fetchLots(), fetchStats()]);
      } catch (error) {
        console.error('Erreur refresh:', error);
      }
    }
  };

  const downloadLotPdf = async (lotId, lotNumero) => {
    try {
      const token = localStorage.getItem('logitrack2_token');
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_URL}/lots/${lotId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lot_${lotNumero}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erreur téléchargement PDF');
    }
  };

  const handleDeleteConfirm = async (lotId, action) => {
    // action: 'disponible' ou 'prochaine'
    const lot = lots.find(l => l.id === lotId) || showDeleteModal;
    if (!lot) return;
    try {
      await lotsApi.delete(lotId);
      toast.success('Lot supprimé');
      setShowDeleteModal(null);

      if (action === 'prochaine' && lot.bobine_id) {
        setPreselectedBobineId(lot.bobine_id);
        setTimeout(() => openNewModal(), 300);
      }

      await Promise.all([fetchLots(), fetchStats()]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  // Filtrage
  const filteredLots = lots.filter(lot => {
    const matchSearch = !searchQuery || 
      lot.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.bobine_numero?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatut = !filterStatut || lot.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Play className="w-7 h-7 text-amber-500" />
            Lots - Début de Poste
          </h1>
          <p className="text-gray-500 mt-1">Préparation production tube spirale</p>
        </div>
        {canAct && (
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouveau Lot
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="En cours" value={stats.en_cours || 0} color="blue" icon={Clock} />
        <StatCard label="Prêt production" value={stats.pret_production || 0} color="green" icon={CheckCircle} />
        <StatCard label="En production" value={stats.en_production || 0} color="orange" icon={Play} />
        <StatCard label="Terminé" value={stats.termine || 0} color="gray" icon={Check} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un lot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
        <button onClick={() => { fetchLots(); fetchStats(); }} className="p-2 hover:bg-gray-100 rounded-lg">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Lots List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Aucun lot trouvé</p>
            {canAct && (
              <button onClick={openNewModal} className="mt-2 text-amber-600 hover:underline text-sm">
                Créer un nouveau lot
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLots.map((lot) => (
              <LotRow
                key={lot.id}
                lot={lot}
                canAct={canAct}
                onView={() => openDetailModal(lot.id)}
                onDownloadPdf={() => downloadLotPdf(lot.id, lot.numero)}
                onDelete={() => setShowDeleteModal(lot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewLotModal
          bobines={bobinesDisponibles}
          prochainNumero={prochainNumero}
          presets={presetsDisponibles}
          equipes={equipesDisponibles}
          preselectedBobineId={preselectedBobineId}
          onCreate={handleCreateLot}
          onClose={() => { setShowNewModal(false); setPreselectedBobineId(null); }}
        />
      )}

      {showDetailModal && selectedLot && (
        <LotDetailModal
          lot={selectedLot}
          lots={lots}
          motifsRetard={motifsRetard}
          presets={presetsDisponibles}
          equipes={equipesDisponibles}
          canAct={canAct}
          isSystemAdmin={isSystemAdmin}
          onClose={() => { setShowDetailModal(false); setSelectedLot(null); }}
          onRefresh={refreshDetailModal}
          onPresetsChange={async () => {
            const res = await presetsApi.getAll();
            setPresetsDisponibles(res.data || []);
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteLotModal
          lot={showDeleteModal}
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteModal(null)}
        />
      )}
    </div>
  );
}

// ==========================================
// StatCard
// ==========================================
function StatCard({ label, value, color, icon: Icon }) {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full ${colorMap[color]} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

// ==========================================
// LotRow
// ==========================================
function LotRow({ lot, canAct, onView, onDownloadPdf, onDelete }) {
  const statut = STATUTS[lot.statut] || STATUTS.en_cours;
  const steps = [
    { key: 'bobine', done: !!lot.bobine_id },
    { key: 'recue', done: !!lot.bobine_recue },
    { key: 'installee', done: !!lot.bobine_installee },
    { key: 'equipe', done: !!lot.equipe_confirmee },
    { key: 'production', done: lot.statut === 'en_production' || lot.statut === 'termine' },
  ];
  const doneCount = steps.filter(s => s.done).length;

  const formatDelay = (mins) => {
    if (!mins) return '';
    if (mins < 60) return `${mins}mn`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${m}mn` : `${h}h`;
  };

  const getDelayColor = (mins) => {
    if (mins < 5) return 'text-blue-600';
    if (mins < 10) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
        {/* Numéro */}
        <div className="w-28">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Numéro de Lot</div>
          <div className="text-lg font-bold text-amber-600 font-mono">{lot.numero}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Statut :</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${statut.color}`}>
              {statut.label}
            </span>
          </div>
        </div>

        {/* Bobine info */}
        <div className="flex-1 min-w-0">
          {lot.bobine_numero ? (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-500 flex-shrink-0" />
              <span className="text-xs text-gray-400">N° Bobine :</span>
              <span className="font-semibold text-gray-900">{lot.bobine_numero}</span>
              <span className="text-sm text-gray-500">
                ({lot.bobine_epaisseur}mm × {lot.bobine_largeur}mm)
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">Aucune bobine</span>
          )}
          {lot.created_at && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <span>Temps :</span>
              <Clock className="w-3 h-3" />
              <span>Démarré le {new Date(lot.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* Preset badge */}
        {lot.parametre_numero && (
          <div className="flex items-center gap-1">
            <Settings className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-mono bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
              {lot.parametre_numero}
            </span>
          </div>
        )}

        {/* Steps progression */}
        <div className="flex items-center gap-1.5">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                step.done 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {step.done ? <Check className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-current" />}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-3 h-0.5 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-1">{doneCount}/5</span>
        </div>

        {/* Retard */}
        {((lot.retard_reception_minutes || 0) > 0 || (lot.retard_installation_minutes || 0) > 0) && (
          <div className="text-xs space-y-0.5">
            {lot.retard_reception_minutes > 0 && (
              <div className={`flex items-center gap-1 ${getDelayColor(lot.retard_reception_minutes)}`}>
                <Truck className="w-3 h-3" />
                <span>{formatDelay(lot.retard_reception_minutes)}</span>
              </div>
            )}
            {lot.retard_installation_minutes > 0 && (
              <div className={`flex items-center gap-1 ${getDelayColor(lot.retard_installation_minutes)}`}>
                <Wrench className="w-3 h-3" />
                <span>{formatDelay(lot.retard_installation_minutes)}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={onDownloadPdf} className="p-2 hover:bg-amber-50 rounded-lg text-amber-600" title="Télécharger PDF">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onView} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Voir détail">
            <Eye className="w-4 h-4" />
          </button>
          {canAct && (
            <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden p-4 hover:bg-gray-50 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-amber-600 font-mono">Lot N°{lot.numero}</div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statut.color}`}>
              {statut.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onDownloadPdf} className="p-1.5 hover:bg-amber-50 rounded text-amber-600">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onView} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
              <Eye className="w-4 h-4" />
            </button>
            {canAct && (
              <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {lot.bobine_numero && (
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-teal-500" />
            <span className="font-medium">{lot.bobine_numero}</span>
            <span className="text-gray-500">({lot.bobine_epaisseur}mm × {lot.bobine_largeur}mm)</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Steps */}
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  step.done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300'
                }`}>
                  {step.done && <Check className="w-2.5 h-2.5" />}
                </div>
                {i < steps.length - 1 && <div className={`w-2 h-0.5 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-1">{doneCount}/5</span>
          </div>

          {lot.parametre_numero && (
            <span className="text-xs font-mono bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
              {lot.parametre_numero}
            </span>
          )}
        </div>

        {lot.created_at && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Démarré le {new Date(lot.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </>
  );
}

// ==========================================
// DeleteLotModal
// ==========================================
function DeleteLotModal({ lot, onConfirm, onClose }) {
  const hasBobine = !!lot.bobine_id;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-red-50">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Supprimer le lot
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-gray-700">
            Vous allez supprimer le lot <strong className="font-mono text-amber-600">{lot.numero}</strong>.
          </p>

          {hasBobine ? (
            <>
              <p className="text-sm text-gray-600">
                La bobine <strong>{lot.bobine_numero}</strong> ({lot.bobine_epaisseur}mm × {lot.bobine_largeur}mm) est associée à ce lot.
                Que souhaitez-vous faire ?
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => onConfirm(lot.id, 'disponible')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all group text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Rendre la bobine disponible</div>
                    <div className="text-sm text-gray-500">La bobine retourne dans le stock et pourra être sélectionnée librement</div>
                  </div>
                </button>

                <button
                  onClick={() => onConfirm(lot.id, 'prochaine')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-amber-200 rounded-xl hover:bg-amber-50 hover:border-amber-400 transition-all group text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200">
                    <Play className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Ajouter au prochain lot</div>
                    <div className="text-sm text-gray-500">La bobine sera pré-sélectionnée automatiquement lors de la création</div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 italic">Aucune bobine n'est associée à ce lot.</p>
              <button
                onClick={() => onConfirm(lot.id, 'disponible')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
              >
                <Trash2 className="w-4 h-4" /> Confirmer la suppression
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end px-4 sm:px-6 py-3 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// NewLotModal
// ==========================================
function NewLotModal({ bobines, prochainNumero, presets, equipes, preselectedBobineId, onCreate, onClose }) {
  const [numeroLot, setNumeroLot] = useState(prochainNumero || '');
  const [selectedBobine, setSelectedBobine] = useState(preselectedBobineId ? String(preselectedBobineId) : '');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [selectedEquipe, setSelectedEquipe] = useState('');

  const isPreselected = preselectedBobineId && selectedBobine === String(preselectedBobineId);
  const selectedBobineData = bobines.find(b => b.id === Number(selectedBobine));
  const selectedPresetData = presets?.find(p => p.id === Number(selectedPreset));
  const selectedEquipeData = equipes?.find(e => e.id === Number(selectedEquipe));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-amber-50">
          <h2 className="text-xl font-bold text-gray-900">
            Nouveau Lot - Début de Poste
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Numéro de lot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de lot
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={numeroLot}
                onChange={(e) => setNumeroLot(e.target.value)}
                placeholder="Saisir le numéro ou laisser vide pour auto"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-lg"
              />
              <button
                type="button"
                onClick={() => setNumeroLot(prochainNumero)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                title="Réinitialiser au numéro suggéré"
              >
                Auto
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Suggestion: <span className="font-mono font-medium">{prochainNumero}</span>
            </p>
          </div>

          {/* Sélection bobine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner une bobine <span className="text-red-500">*</span>
            </label>
            {bobines.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Aucune bobine disponible</p>
                  <p className="text-xs text-red-600 mt-0.5">Ajoutez une bobine en stock depuis la page Bobines pour pouvoir créer un lot.</p>
                </div>
              </div>
            ) : (
              <>
                <select
                  value={selectedBobine}
                  onChange={(e) => setSelectedBobine(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900"
                >
                  <option value="">-- Choisir une bobine --</option>
                  {bobines.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.numero} - {b.epaisseur}mm × {b.largeur}mm - {b.poids}kg {b.fournisseur ? `(${b.fournisseur})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {bobines.length} bobine{bobines.length > 1 ? 's' : ''} disponible{bobines.length > 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>

          {/* Notification pré-sélection */}
          {isPreselected && selectedBobineData && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span>Bobine <strong>{selectedBobineData.numero}</strong> pré-sélectionnée depuis le lot précédent</span>
            </div>
          )}

          {/* Aperçu bobine sélectionnée */}
          {selectedBobineData && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-amber-600" />
                <div>
                  <div className="font-bold text-amber-800 text-lg">{selectedBobineData.numero}</div>
                  <div className="text-sm text-amber-600">
                    {selectedBobineData.epaisseur}mm × {selectedBobineData.largeur}mm - {selectedBobineData.poids}kg
                  </div>
                  {selectedBobineData.fournisseur && (
                    <div className="text-xs text-gray-500">Fournisseur: {selectedBobineData.fournisseur}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sélection preset soudure */}
          {presets && presets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paramètres de Soudure <span className="text-gray-400">(optionnel)</span>
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900"
              >
                <option value="">-- Aucun preset --</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — Strip {p.strip_vitesse_m}m{String(p.strip_vitesse_cm).padStart(2,'0')} | Tack {p.tack_amperage}A/{p.tack_voltage}V
                  </option>
                ))}
              </select>
              {selectedPresetData && (
                <div className="mt-2 p-3 bg-violet-50 border border-violet-200 rounded-lg text-sm space-y-1">
                  <div className="font-medium text-violet-800">{selectedPresetData.code}</div>
                  <div className="text-violet-600">
                    Milling: {selectedPresetData.milling_edge_gauche}°/{selectedPresetData.milling_edge_droit}° •
                    Têtes: {(selectedPresetData.heads || []).filter(h => h.actif).length}/{(selectedPresetData.heads || []).length} actives
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sélection équipe de production */}
          {equipes && equipes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Équipe de Production <span className="text-gray-400">(optionnel)</span>
              </label>
              <select
                value={selectedEquipe}
                onChange={(e) => setSelectedEquipe(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900"
              >
                <option value="">-- Aucune équipe --</option>
                {equipes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} — {e.nom}{e.zone_nom ? ` • ${e.zone_nom}` : ''}{e.chef_prenom ? ` • Chef: ${e.chef_prenom} ${e.chef_nom}` : ''}
                  </option>
                ))}
              </select>
              {selectedEquipeData && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800">{selectedEquipeData.code} — {selectedEquipeData.nom}</span>
                  </div>
                  <div className="text-emerald-600">
                    {selectedEquipeData.zone_nom && <span>{selectedEquipeData.zone_nom}</span>}
                    {selectedEquipeData.chef_prenom && (
                      <span>{selectedEquipeData.zone_nom ? ' • ' : ''}Chef: {selectedEquipeData.chef_prenom} {selectedEquipeData.chef_nom}</span>
                    )}
                    {selectedEquipeData.membres && (
                      <span>{(selectedEquipeData.zone_nom || selectedEquipeData.chef_prenom) ? ' • ' : ''}{selectedEquipeData.membres.length} membre{selectedEquipeData.membres.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => onCreate(selectedBobine ? Number(selectedBobine) : null, numeroLot, selectedPreset ? Number(selectedPreset) : null, selectedEquipe ? Number(selectedEquipe) : null)}
            disabled={!selectedBobine}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
              selectedBobine ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            Démarrer le lot
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// LotDetailModal (Workflow)
// ==========================================
function LotDetailModal({ lot, lots, motifsRetard, presets, equipes = [], canAct, isSystemAdmin, onClose, onRefresh, onPresetsChange }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showRetardForm, setShowRetardForm] = useState(null); 
  const [retardData, setRetardData] = useState({ minutes: 0, motif_id: '', commentaire: '' });

  // État pour l'édition des dates (admin système uniquement)
  const [editingDate, setEditingDate] = useState(null);
  const [editDateValue, setEditDateValue] = useState('');

  // Fonction pour sauvegarder une date modifiée
  const handleSaveDate = async (field) => {
    if (!editDateValue) {
      toast.error('Veuillez saisir une date valide');
      return;
    }
    try {
      await lotsApi.adminUpdateDate(lot.id, field, editDateValue);
      toast.success('Date mise à jour');
      setEditingDate(null);
      setEditDateValue('');
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la modification de la date');
    }
  };

  // Paramètres
  const [parametreMode, setParametreMode] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [editForm, setEditForm] = useState({});
  const [editHeads, setEditHeads] = useState([]);
  const [openSections, setOpenSections] = useState({ formage: true, tack: false, soudure: false });
  const [savingParam, setSavingParam] = useState(false);

  // Équipe de production
  const [selectedEquipeId, setSelectedEquipeId] = useState(lot.equipe_id || '');

  const loadPresetForEdit = async () => {
    if (lot.parametre_id) {
      try {
        const res = await presetsApi.getById(lot.parametre_id);
        const p = res.data;
        setEditForm({
          strip_vitesse_m: p.strip_vitesse_m || 0, strip_vitesse_cm: p.strip_vitesse_cm || 0,
          milling_edge_gauche: p.milling_edge_gauche || 40, milling_edge_droit: p.milling_edge_droit || 40,
          pression_rouleaux: p.pression_rouleaux || '', pression_rouleaux_unite: p.pression_rouleaux_unite || 'tonnes',
          tack_amperage: p.tack_amperage || 0, tack_voltage: p.tack_voltage || 0,
          tack_vitesse_m: p.tack_vitesse_m || 0, tack_vitesse_cm: p.tack_vitesse_cm || 0,
          tack_frequence: p.tack_frequence || '', tack_type_gaz: p.tack_type_gaz || 'CO2', tack_debit_gaz: p.tack_debit_gaz || '',
          soudure_vitesse_m: p.soudure_vitesse_m || 0, soudure_vitesse_cm: p.soudure_vitesse_cm || 0,
          soudure_type_fil: p.soudure_type_fil || '1.6mm', soudure_type_flux: p.soudure_type_flux || 'SAW',
          notes: p.notes || ''
        });
        setEditHeads(p.heads && p.heads.length > 0 ? p.heads : JSON.parse(JSON.stringify(DEFAULT_HEADS)));
      } catch (e) { console.error(e); }
    } else {
      setEditForm({
        strip_vitesse_m: 0, strip_vitesse_cm: 0,
        milling_edge_gauche: 40, milling_edge_droit: 40,
        pression_rouleaux: '', pression_rouleaux_unite: 'tonnes',
        tack_amperage: 0, tack_voltage: 0,
        tack_vitesse_m: 0, tack_vitesse_cm: 0,
        tack_frequence: '', tack_type_gaz: 'CO2', tack_debit_gaz: '',
        soudure_vitesse_m: 0, soudure_vitesse_cm: 0,
        soudure_type_fil: '1.6mm', soudure_type_flux: 'SAW',
        notes: ''
      });
      setEditHeads(JSON.parse(JSON.stringify(DEFAULT_HEADS)));
    }
    setParametreMode('edit');
  };

  const handleSelectPreset = async () => {
    if (!selectedPresetId) return;
    setSavingParam(true);
    try {
      await lotsApi.updateParametres(lot.id, { action: 'select', parametre_id: Number(selectedPresetId) });
      toast.success('Preset appliqué');
      setParametreMode(null);
      setSelectedPresetId('');
      onRefresh();
    } catch (e) { toast.error('Erreur'); }
    finally { setSavingParam(false); }
  };

  const handleSaveModifiedPreset = async () => {
    setSavingParam(true);
    try {
      await lotsApi.updateParametres(lot.id, {
        action: 'create',
        parametres: { ...editForm, heads: editHeads }
      });
      toast.success('Nouveau preset créé et appliqué');
      setParametreMode(null);
      onRefresh();
      if (onPresetsChange) onPresetsChange();
    } catch (e) { toast.error('Erreur création preset'); }
    finally { setSavingParam(false); }
  };

  const updateStep = async (endpoint, body = {}) => {
    setLoading(true);
    try {
      await lotsApi.updateStep(lot.id, endpoint, body);
      toast.success('Mise à jour effectuée');
      onRefresh();
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };

  // Helpers retard
  const formatDelay = (mins) => {
    if (mins < 60) return `${mins}mn`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${m}mn` : `${h}h`;
  };

  const getDelayStyle = (mins) => {
    if (mins < 5) return { color: 'text-blue-600', bg: 'bg-blue-50', iconColor: 'text-green-500', Icon: CheckCircle };
    if (mins < 10) return { color: 'text-orange-600', bg: 'bg-orange-50', iconColor: 'text-orange-500', Icon: AlertTriangle };
    return { color: 'text-red-600', bg: 'bg-red-50', iconColor: 'text-red-500', Icon: AlertTriangle };
  };

  const handleReception = () => {
    const startTime = new Date(lot.created_at).getTime();
    const delayMs = Date.now() - startTime;
    const delayMinutes = Math.round(delayMs / 60000);
    if (delayMinutes >= 10) {
      setRetardData({ minutes: delayMinutes, motif_id: '', commentaire: '' });
      setShowRetardForm('reception');
    } else {
      updateStep('reception', { recue: true, retard_minutes: delayMinutes });
    }
  };

  const handleInstallation = () => {
    const startTime = new Date(lot.date_reception).getTime();
    const delayMs = Date.now() - startTime;
    const delayMinutes = Math.round(delayMs / 60000);
    if (delayMinutes >= 10) {
      setRetardData({ minutes: delayMinutes, motif_id: '', commentaire: '' });
      setShowRetardForm('installation');
    } else {
      updateStep('installation', { installee: true, retard_minutes: delayMinutes });
    }
  };

  const confirmRetard = () => {
    const endpoint = showRetardForm;
    const body = {
      [endpoint === 'reception' ? 'recue' : 'installee']: true,
      retard_minutes: parseInt(retardData.minutes) || 0,
      motif_retard_id: retardData.motif_id || null,
      commentaire: retardData.commentaire || null
    };
    updateStep(endpoint, body);
    setShowRetardForm(null);
    setRetardData({ minutes: 0, motif_id: '', commentaire: '' });
  };

  const statut = STATUTS[lot.statut] || STATUTS.en_cours;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-3xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-amber-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lot N°<span className="font-mono">{lot.numero}</span></h2>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statut.color}`}>
              {statut.label}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Résumé Temps & Retards */}
        {lot.created_at && (
          <div className="px-4 sm:px-6 py-2 sm:py-3 border-b bg-gray-50 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-x-5 sm:gap-y-1.5 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>Démarré le {new Date(lot.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {(lot.retard_reception_minutes > 0) && (
              <div className={`flex items-center gap-1.5 font-medium ${getDelayStyle(lot.retard_reception_minutes).color}`}>
                <Truck className="w-4 h-4" />
                <span>Réception : {formatDelay(lot.retard_reception_minutes)}</span>
              </div>
            )}
            {(lot.retard_installation_minutes > 0) && (
              <div className={`flex items-center gap-1.5 font-medium ${getDelayStyle(lot.retard_installation_minutes).color}`}>
                <Wrench className="w-4 h-4" />
                <span>Installation : {formatDelay(lot.retard_installation_minutes)}</span>
              </div>
            )}
            {((lot.retard_reception_minutes || 0) + (lot.retard_installation_minutes || 0)) > 0 && (lot.retard_reception_minutes > 0 && lot.retard_installation_minutes > 0) && (
              <div className={`flex items-center gap-1.5 font-bold ${getDelayStyle((lot.retard_reception_minutes || 0) + (lot.retard_installation_minutes || 0)).color}`}>
                <AlertTriangle className="w-4 h-4" />
                <span>Total : {formatDelay((lot.retard_reception_minutes || 0) + (lot.retard_installation_minutes || 0))}</span>
              </div>
            )}
          </div>
        )}

        {/* Workflow Steps */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          
          {/* Étape 1: Bobine sélectionnée */}
          <WorkflowStep number={1} title="Bobine sélectionnée" icon={Package} done={!!lot.bobine_id} active={!lot.bobine_id}>
            {lot.bobine_id ? (
              <div className="space-y-2">
                {lot.created_at && (
                  <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                    {editingDate === 'created_at' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="datetime-local"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <button onClick={() => handleSaveDate('created_at')} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingDate(null); setEditDateValue(''); }} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">Lot démarré le {new Date(lot.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {isSystemAdmin && (
                          <button
                            onClick={() => {
                              setEditingDate('created_at');
                              setEditDateValue(new Date(lot.created_at).toISOString().slice(0, 16));
                            }}
                            className="ml-2 p-1 text-violet-600 hover:bg-violet-100 rounded transition-colors"
                            title="Modifier la date (Admin)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 sm:gap-4 bg-green-50 p-3 rounded-lg">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{lot.bobine_numero}</div>
                    <div className="text-sm text-gray-600">
                      {lot.bobine_epaisseur}mm × {lot.bobine_largeur}mm - {lot.bobine_poids}kg
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center py-4">Aucune bobine sélectionnée</p>
            )}
          </WorkflowStep>

          {/* Étape 2: Bobine reçue */}
          <WorkflowStep number={2} title="Bobine reçue" icon={Truck} done={lot.bobine_recue} active={!!lot.bobine_id && !lot.bobine_recue} retard={lot.retard_reception_minutes} motif={lot.motif_reception_libelle}>
            {lot.bobine_recue ? (
              (() => {
                const delay = lot.retard_reception_minutes || 0;
                const style = getDelayStyle(delay);
                const DelayIcon = style.Icon;
                return (
                  <div className="space-y-1">
                    <div className={`flex flex-wrap items-start sm:items-center gap-1 sm:gap-2 text-sm ${style.color}`}>
                      <DelayIcon className={`w-5 h-5 ${style.iconColor} flex-shrink-0`} />
                      {editingDate === 'date_reception' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="datetime-local"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          <button onClick={() => handleSaveDate('date_reception')} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingDate(null); setEditDateValue(''); }} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>Bobine reçue le {new Date(lot.date_reception).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {isSystemAdmin && (
                            <button
                              onClick={() => {
                                setEditingDate('date_reception');
                                setEditDateValue(new Date(lot.date_reception).toISOString().slice(0, 16));
                              }}
                              className="p-1 text-violet-600 hover:bg-violet-100 rounded transition-colors"
                              title="Modifier la date (Admin)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {delay > 0 && <span className="font-semibold">— {formatDelay(delay)} de retard</span>}
                        </>
                      )}
                    </div>
                    {delay >= 10 && lot.motif_reception_libelle && (
                      <div className="text-xs sm:text-sm text-red-500 ml-7 italic">Motif : {lot.motif_reception_libelle}</div>
                    )}
                    {delay >= 10 && lot.commentaire_reception && (
                      <div className="text-xs text-gray-500 ml-7">{lot.commentaire_reception}</div>
                    )}
                  </div>
                );
              })()
            ) : lot.bobine_id ? (
              canAct ? (
                <button onClick={handleReception} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium">
                  <Check className="w-4 h-4" /> Bobine reçue
                </button>
              ) : (
                <p className="text-gray-400 italic">En attente de réception de la bobine</p>
              )
            ) : (
              <p className="text-gray-400 italic">Sélectionnez d'abord une bobine</p>
            )}
          </WorkflowStep>

          {/* Étape 3: Bobine installée */}
          <WorkflowStep number={3} title="Bobine installée sur dérouleuse" icon={Wrench} done={lot.bobine_installee} active={lot.bobine_recue && !lot.bobine_installee} retard={lot.retard_installation_minutes} motif={lot.motif_installation_libelle}>
            {lot.bobine_installee ? (
              (() => {
                const delay = lot.retard_installation_minutes || 0;
                const style = getDelayStyle(delay);
                const DelayIcon = style.Icon;
                return (
                  <div className="space-y-1">
                    <div className={`flex flex-wrap items-start sm:items-center gap-1 sm:gap-2 text-sm ${style.color}`}>
                      <DelayIcon className={`w-5 h-5 ${style.iconColor} flex-shrink-0`} />
                      {editingDate === 'date_installation' ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="datetime-local"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          <button onClick={() => handleSaveDate('date_installation')} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingDate(null); setEditDateValue(''); }} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>Bobine installée le {new Date(lot.date_installation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {isSystemAdmin && (
                            <button
                              onClick={() => {
                                setEditingDate('date_installation');
                                setEditDateValue(new Date(lot.date_installation).toISOString().slice(0, 16));
                              }}
                              className="p-1 text-violet-600 hover:bg-violet-100 rounded transition-colors"
                              title="Modifier la date (Admin)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {delay > 0 && <span className="font-semibold">— {formatDelay(delay)} de retard</span>}
                        </>
                      )}
                    </div>
                    {delay >= 10 && lot.motif_installation_libelle && (
                      <div className="text-xs sm:text-sm text-red-500 ml-7 italic">Motif : {lot.motif_installation_libelle}</div>
                    )}
                    {delay >= 10 && lot.commentaire_installation && (
                      <div className="text-xs text-gray-500 ml-7">{lot.commentaire_installation}</div>
                    )}
                  </div>
                );
              })()
            ) : lot.bobine_recue ? (
              canAct ? (
                <button onClick={handleInstallation} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium">
                  <Check className="w-4 h-4" /> Bobine installée
                </button>
              ) : (
                <p className="text-gray-400 italic">En attente d'installation de la bobine</p>
              )
            ) : (
              <p className="text-gray-400 italic">La bobine doit être reçue d'abord</p>
            )}
          </WorkflowStep>

          {/* Étape 4: Équipe de Production confirmée */}
          <WorkflowStep number={4} title="Équipe de Production confirmée" icon={Users} done={!!lot.equipe_confirmee} active={!!lot.bobine_installee && !lot.equipe_confirmee}>
            {lot.equipe_confirmee ? (
              <div className="space-y-2">
                <div className="text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {editingDate === 'date_equipe_confirmee' ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="datetime-local"
                        value={editDateValue}
                        onChange={(e) => setEditDateValue(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <button onClick={() => handleSaveDate('date_equipe_confirmee')} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingDate(null); setEditDateValue(''); }} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>Confirmée le {lot.date_equipe_confirmee && new Date(lot.date_equipe_confirmee).toLocaleString('fr-FR')}</span>
                      {isSystemAdmin && lot.date_equipe_confirmee && (
                        <button
                          onClick={() => {
                            setEditingDate('date_equipe_confirmee');
                            setEditDateValue(new Date(lot.date_equipe_confirmee).toISOString().slice(0, 16));
                          }}
                          className="p-1 text-violet-600 hover:bg-violet-100 rounded transition-colors"
                          title="Modifier la date (Admin)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                {lot.equipe_nom && (
                  <div className="flex items-center gap-2 bg-violet-50 px-3 py-2 rounded-lg">
                    <Users className="w-4 h-4 text-violet-600" />
                    <span className="font-medium text-violet-800">{lot.equipe_code} — {lot.equipe_nom}</span>
                  </div>
                )}
              </div>
            ) : lot.bobine_installee ? (
              <div className="space-y-3">
                {/* Afficher l'équipe actuelle ou dropdown pour changer */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Équipe assignée</label>
                  <select
                    value={selectedEquipeId}
                    onChange={(e) => setSelectedEquipeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">-- Sélectionner une équipe --</option>
                    {equipes.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.code} — {eq.nom}</option>
                    ))}
                  </select>
                </div>
                {canAct && selectedEquipeId && (
                  <button
                    onClick={() => updateStep('equipe-confirmee', { equipe_id: Number(selectedEquipeId) })}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirmer l'équipe
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">La bobine doit être installée d'abord</p>
            )}
          </WorkflowStep>

          {/* Étape 5: Démarrer Production */}
          {!!lot.equipe_confirmee && lot.statut === 'pret_production' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Play className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="font-bold text-green-700 text-lg">Prêt pour la production</h3>
              <p className="text-green-600 text-sm mb-4">Équipe confirmée, vous pouvez lancer la production</p>
              {canAct && (
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await lotsApi.updateStep(lot.id, 'demarrer-production');
                      toast.success('Production démarrée');
                      onRefresh();
                      onClose();
                      navigate('/tubes');
                    } catch (error) {
                      toast.error('Erreur lors du démarrage');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mx-auto"
                >
                  <Play className="w-5 h-5" /> Démarrer la production
                </button>
              )}
            </div>
          )}

          {lot.statut === 'en_production' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <Play className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <h3 className="font-bold text-orange-700 text-lg">Production en cours</h3>
              {canAct && (
                <button
                  onClick={() => updateStep('terminer')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mt-4"
                >
                  <Square className="w-5 h-5" /> Terminer le lot
                </button>
              )}
            </div>
          )}

          {/* Section Paramètres de Production */}
          <div className="border border-violet-200 rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-violet-50">
              <div className="flex items-center gap-2 min-w-0">
                <Settings className="w-5 h-5 text-violet-600 flex-shrink-0" />
                <span className="font-medium text-violet-800 text-sm sm:text-base">Paramètres de Production</span>
                {lot.parametre_numero && (
                  <span className="font-mono text-sm bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-300">
                    {lot.parametre_numero}
                  </span>
                )}
              </div>
              {lot.statut !== 'termine' && parametreMode === null && canAct && (
                <div className="flex gap-2">
                  <button onClick={() => { setParametreMode('select'); setSelectedPresetId(''); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 border border-violet-300">
                    <ChevronDown className="w-3 h-3" /> Changer
                  </button>
                  <button onClick={loadPresetForEdit}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 border border-amber-300">
                    <Edit3 className="w-3 h-3" /> Modifier
                  </button>
                </div>
              )}
              {parametreMode !== null && (
                <button onClick={() => setParametreMode(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4">
              {/* Résumé */}
              {parametreMode === null && (
                lot.parametre_id ? (
                  <ParametreResume lot={lot} presets={presets} />
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <Settings className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucun preset associé</p>
                    {canAct && (
                      <button onClick={() => { setParametreMode('select'); setSelectedPresetId(''); }}
                        className="mt-2 text-violet-600 hover:underline text-sm">
                        Associer un preset
                      </button>
                    )}
                  </div>
                )
              )}

              {/* Mode sélection */}
              {parametreMode === 'select' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Sélectionner un preset existant :</p>
                  <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm">
                    <option value="">-- Choisir un preset --</option>
                    {presets.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.code} — Strip {p.strip_vitesse_m}m{String(p.strip_vitesse_cm).padStart(2,'0')} | Tack {p.tack_amperage}A/{p.tack_voltage}V
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setParametreMode(null)} className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                      Annuler
                    </button>
                    <button onClick={handleSelectPreset} disabled={!selectedPresetId || savingParam}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
                      <Check className="w-4 h-4" /> Appliquer
                    </button>
                  </div>
                </div>
              )}

              {/* Mode édition */}
              {parametreMode === 'edit' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    La sauvegarde créera un <strong>nouveau preset</strong> (traçabilité). L'ancien preset reste inchangé.
                  </div>

                  {/* Formage */}
                  <ParamSection title="Formage" color="blue" open={openSections.formage} onToggle={() => setOpenSections(s => ({...s, formage: !s.formage}))}>
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
                  </ParamSection>

                  {/* Tackwelding */}
                  <ParamSection title="Tackwelding" color="amber" open={openSections.tack} onToggle={() => setOpenSections(s => ({...s, tack: !s.tack}))}>
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
                  </ParamSection>

                  {/* Soudure Finale */}
                  <ParamSection title="Soudure Finale" color="orange" open={openSections.soudure} onToggle={() => setOpenSections(s => ({...s, soudure: !s.soudure}))}>
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
                        <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm py-1.5 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-12 text-xs font-mono text-gray-500">{head.type} #{head.numero}</span>
                            <button type="button" onClick={() => {
                              const updated = [...editHeads];
                              updated[idx] = {...updated[idx], actif: !updated[idx].actif};
                              setEditHeads(updated);
                            }}>
                              {head.actif ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                            </button>
                          </div>
                          {head.actif && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <select value={head.type_fil || '3.2mm'} onChange={e => { const u = [...editHeads]; u[idx] = {...u[idx], type_fil: e.target.value}; setEditHeads(u); }} className="w-20 px-1 py-1 border rounded text-sm">
                                {FIL_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                              <div className="flex items-center gap-1">
                                <input type="number" value={head.amperage} onChange={e => { const u = [...editHeads]; u[idx] = {...u[idx], amperage: Number(e.target.value)}; setEditHeads(u); }} className="w-16 px-2 py-1 border rounded text-sm" placeholder="A" />
                                <span className="text-xs text-gray-400">A</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input type="number" value={head.voltage} onChange={e => { const u = [...editHeads]; u[idx] = {...u[idx], voltage: Number(e.target.value)}; setEditHeads(u); }} className="w-16 px-2 py-1 border rounded text-sm" placeholder="V" />
                                <span className="text-xs text-gray-400">V</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ParamSection>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} className="w-full px-2 py-1.5 border rounded text-sm" rows={2} placeholder="Notes optionnelles..." />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setParametreMode(null)} className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                      Annuler
                    </button>
                    <button onClick={handleSaveModifiedPreset} disabled={savingParam}
                      className="flex items-center gap-1 px-4 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                      <Save className="w-4 h-4" /> Créer & Appliquer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Créé par {lot.operateur_prenom} {lot.operateur_nom}
          </div>
          <div className="flex gap-2 justify-center sm:justify-end">
            {canAct && lot.statut !== 'en_production' && lot.statut !== 'termine' && 
             !!(lot.bobine_recue || lot.bobine_installee || lot.equipe_confirmee) && (
              <button
                onClick={() => updateStep('reinitialiser')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Fermer
            </button>
          </div>
        </div>

        {/* Modal Retard */}
        {showRetardForm && (
          <RetardModal
            type={showRetardForm}
            motifs={motifsRetard[showRetardForm] || []}
            data={retardData}
            onChange={setRetardData}
            onConfirm={confirmRetard}
            onCancel={() => setShowRetardForm(null)}
          />
        )}
      </div>
    </div>
  );
}

// ==========================================
// ParametreResume
// ==========================================
function ParametreResume({ lot, presets }) {
  const preset = presets?.find(p => p.id === lot.parametre_id);
  if (!preset) return <p className="text-sm text-gray-500">Preset introuvable</p>;
  const activeHeads = (preset.heads || []).filter(h => h.actif);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
      <div>
        <span className="text-xs text-gray-500 block">Strip Speed</span>
        <span className="font-medium">{preset.strip_vitesse_m}m{String(preset.strip_vitesse_cm).padStart(2,'0')}</span>
      </div>
      <div>
        <span className="text-xs text-gray-500 block">Milling</span>
        <span className="font-medium">{preset.milling_edge_gauche}° / {preset.milling_edge_droit}°</span>
      </div>
      <div>
        <span className="text-xs text-gray-500 block">Tack</span>
        <span className="font-medium">{preset.tack_amperage}A / {preset.tack_voltage}V</span>
      </div>
      <div>
        <span className="text-xs text-gray-500 block">Soudure Speed</span>
        <span className="font-medium">{preset.soudure_vitesse_m}m{String(preset.soudure_vitesse_cm).padStart(2,'0')}</span>
      </div>
      <div>
        <span className="text-xs text-gray-500 block">Fil / Flux</span>
        <span className="font-medium">{preset.soudure_type_fil} / {preset.soudure_type_flux}</span>
      </div>
      <div>
        <span className="text-xs text-gray-500 block">Têtes</span>
        <span className="font-medium">{activeHeads.length} actives</span>
      </div>
    </div>
  );
}

// ==========================================
// ParamSection (mini accordion)
// ==========================================
function ParamSection({ title, color, open, onToggle, children }) {
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

// ==========================================
// WorkflowStep
// ==========================================
function WorkflowStep({ number, title, icon: Icon, done, active, retard, motif, children }) {
  return (
    <div className={`border rounded-lg overflow-hidden ${
      done ? 'border-green-300 bg-green-50/50' : 
      active ? 'border-amber-300 bg-amber-50/50' : 
      'border-gray-200 bg-gray-50/50'
    }`}>
      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 ${
        done ? 'bg-green-100' : active ? 'bg-amber-100' : 'bg-gray-100'
      }`}>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
          done ? 'bg-green-500' : active ? 'bg-amber-500' : 'bg-gray-400'
        }`}>
          {done ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : number}
        </div>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${done ? 'text-green-600' : active ? 'text-amber-600' : 'text-gray-400'}`} />
        <span className={`font-medium text-sm sm:text-base ${done ? 'text-green-800' : active ? 'text-amber-800' : 'text-gray-600'}`}>
          {title}
        </span>
        {retard > 0 && (
          <span className={`ml-auto text-xs sm:text-sm flex items-center gap-1 ${
            retard < 5 ? 'text-blue-600' : retard < 10 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {retard < 5 ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" /> :
             retard < 10 ? <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" /> :
             <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
            +{retard < 60 ? `${retard}mn` : `${Math.floor(retard/60)}h${retard%60 > 0 ? retard%60 + 'mn' : ''}`} {motif && `(${motif})`}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

// ==========================================
// RetardModal
// ==========================================
function RetardModal({ type, motifs, data, onChange, onConfirm, onCancel }) {
  const initTotal = data.minutes || 0;
  const [jours, setJours] = useState(Math.floor(initTotal / (24 * 60)));
  const [heures, setHeures] = useState(Math.floor((initTotal % (24 * 60)) / 60));
  const [minutes, setMinutes] = useState(initTotal % 60);

  const totalMinutes = (parseInt(jours) || 0) * 24 * 60 + (parseInt(heures) || 0) * 60 + (parseInt(minutes) || 0);

  const updateTotal = (j, h, m) => {
    const total = (parseInt(j) || 0) * 24 * 60 + (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
    onChange({ ...data, minutes: total });
  };

  const handleJoursChange = (v) => { setJours(v); updateTotal(v, heures, minutes); };
  const handleHeuresChange = (v) => { setHeures(v); updateTotal(jours, v, minutes); };
  const handleMinutesChange = (v) => { setMinutes(v); updateTotal(jours, heures, v); };

  const formatDuree = (mins) => {
    if (!mins) return '';
    const j = Math.floor(mins / (24 * 60));
    const h = Math.floor((mins % (24 * 60)) / 60);
    const m = mins % 60;
    const parts = [];
    if (j > 0) parts.push(`${j} jour${j > 1 ? 's' : ''}`);
    if (h > 0) parts.push(`${h} heure${h > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-10">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
          Retard {type === 'reception' ? 'de réception' : "d'installation"}
        </h3>

        {initTotal > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            <Clock className="w-4 h-4" />
            <span>Retard calculé automatiquement : <strong>{formatDuree(initTotal)}</strong></span>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durée du retard</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Jours</label>
                <input type="number" value={jours} onChange={(e) => handleJoursChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-center" min="0" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Heures</label>
                <input type="number" value={heures} onChange={(e) => handleHeuresChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-center" min="0" max="23" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                <input type="number" value={minutes} onChange={(e) => handleMinutesChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-center" min="0" max="59" placeholder="0" />
              </div>
            </div>
            {totalMinutes > 0 && (
              <p className="text-sm text-orange-600 mt-2 font-medium">
                Total: {formatDuree(totalMinutes)} ({totalMinutes} min)
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif du retard</label>
            <select value={data.motif_id} onChange={(e) => onChange({ ...data, motif_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
              <option value="">-- Sélectionner un motif --</option>
              {motifs.map(m => (
                <option key={m.id} value={m.id}>{m.libelle}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
            <textarea value={data.commentaire} onChange={(e) => onChange({ ...data, commentaire: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" rows={2} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Annuler
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
