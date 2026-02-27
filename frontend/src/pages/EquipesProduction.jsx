/**
 * Page Équipes de Production
 * 3 onglets : Équipes, Personnel, Zones
 * Design cohérent avec ParametresSoudure
 * Logi-Track V2
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Search, Eye, X, Check, Edit3, Save,
  Users, UserCheck, MapPin, Shield, Phone, Hash,
  ChevronDown, ToggleLeft, ToggleRight, Award, AlertTriangle,
  Briefcase, Settings
} from 'lucide-react';
import { equipesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';

// ────────────────────────────────────────────────
// Constantes
// ────────────────────────────────────────────────
const ZONE_COLORS = [
  { key: 'red', label: 'Rouge', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
  { key: 'blue', label: 'Bleu', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
  { key: 'green', label: 'Vert', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  { key: 'orange', label: 'Orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  { key: 'violet', label: 'Violet', bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500' },
  { key: 'cyan', label: 'Cyan', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', dot: 'bg-cyan-500' },
  { key: 'rose', label: 'Rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' },
  { key: 'amber', label: 'Ambre', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
  { key: 'indigo', label: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500' },
  { key: 'emerald', label: 'Émeraude', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' },
];

function getColorClasses(colorKey) {
  return ZONE_COLORS.find(c => c.key === colorKey) || ZONE_COLORS[1]; // default blue
}

const TABS = [
  { key: 'equipes', label: 'Équipes', icon: Users },
  { key: 'personnel', label: 'Personnel', icon: UserCheck },
  { key: 'zones', label: 'Zones', icon: MapPin },
];

// ═══════════════════════════════════════════════════════════
// Composant principal
// ═══════════════════════════════════════════════════════════
export default function EquipesProduction() {
  const { isAdmin, isSystemAdmin } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState('equipes');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data stores
  const [equipes, setEquipes] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [zones, setZones] = useState([]);
  const [qualifications, setQualifications] = useState([]);

  // Modal states
  const [showEquipeModal, setShowEquipeModal] = useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showQualifModal, setShowQualifModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [eq, pe, zo, qu] = await Promise.all([
        equipesApi.getAll(),
        equipesApi.getPersonnel(),
        equipesApi.getZones(),
        equipesApi.getQualifications(),
      ]);
      setEquipes(eq.data);
      setPersonnel(pe.data);
      setZones(zo.data);
      setQualifications(qu.data);
    } catch (e) {
      console.error(e);
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  // ─── Check si un personnel est déjà dans d'autres équipes ───
  const getPersonnelEquipes = (personnelId) => {
    return equipes.filter(eq =>
      eq.actif && (eq.all_membres || []).some(m => m.personnel_id === personnelId)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-violet-600" />
            Équipes de Production
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion des équipes, personnel et zones de travail
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                active
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search + Action */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Rechercher...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {activeTab === 'equipes' && (
              <button onClick={() => { setEditingItem(null); setShowEquipeModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm text-sm sm:text-base">
                <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nouvelle</span> Équipe
              </button>
            )}
            {activeTab === 'personnel' && (<>
              <button onClick={() => { setEditingItem(null); setShowPersonnelModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm text-sm sm:text-base">
                <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nouveau</span> Personnel
              </button>
              <button onClick={() => setShowQualifModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 border border-violet-300 rounded-xl hover:bg-violet-50 transition-colors text-sm sm:text-base">
                <Award className="w-4 h-4" /> Qualifications
              </button>
            </>)}
            {activeTab === 'zones' && (
              <button onClick={() => { setEditingItem(null); setShowZoneModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm text-sm sm:text-base">
                <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nouvelle</span> Zone
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <>
          {activeTab === 'equipes' && (
            <TabEquipes equipes={equipes} zones={zones} searchQuery={searchQuery} isAdmin={isAdmin} isSystemAdmin={isSystemAdmin}
              onView={(eq) => setShowDetailModal(eq)}
              onEdit={(eq) => { setEditingItem(eq); setShowEquipeModal(true); }}
              onDelete={async (eq) => {
                const action = eq.actif ? 'désactiver' : 'réactiver';
                const ok = await confirm({ type: eq.actif ? 'danger' : 'info', title: `${eq.actif ? 'Désactiver' : 'Réactiver'} ${eq.code} ?`, message: `Voulez-vous ${action} cette équipe ?`, confirmLabel: eq.actif ? 'Désactiver' : 'Réactiver', cancelLabel: 'Annuler' });
                if (!ok) return;
                try { await equipesApi.delete(eq.id); toast.success(`Équipe ${action === 'désactiver' ? 'désactivée' : 'réactivée'}`); fetchAll(); } catch (e) { toast.error('Erreur'); }
              }}
              onHardDelete={async (eq) => {
                const ok = await confirm({ type: 'danger', title: 'Supprimer définitivement ?', message: `Êtes-vous sûr de vouloir supprimer définitivement l'équipe ${eq.code} (${eq.nom}) ? Tous les membres seront détachés. Cette action est irréversible.`, confirmLabel: 'Supprimer définitivement', cancelLabel: 'Annuler' });
                if (!ok) return;
                try { await equipesApi.hardDelete(eq.id); toast.success(`Équipe ${eq.code} supprimée définitivement`); fetchAll(); } catch (e) { toast.error(e.response?.data?.error || 'Erreur suppression'); }
              }}
            />
          )}
          {activeTab === 'personnel' && (
            <TabPersonnel personnel={personnel} qualifications={qualifications} searchQuery={searchQuery} isAdmin={isAdmin} isSystemAdmin={isSystemAdmin}
              getPersonnelEquipes={getPersonnelEquipes}
              onEdit={(p) => { setEditingItem(p); setShowPersonnelModal(true); }}
              onDelete={async (p) => {
                const action = p.actif ? 'désactiver' : 'réactiver';
                const ok = await confirm({ type: p.actif ? 'danger' : 'info', title: `${p.actif ? 'Désactiver' : 'Réactiver'} ${p.prenom} ${p.nom} ?`, message: `Voulez-vous ${action} ce personnel ?`, confirmLabel: p.actif ? 'Désactiver' : 'Réactiver', cancelLabel: 'Annuler' });
                if (!ok) return;
                try { await equipesApi.deletePersonnel(p.id); toast.success(`Personnel ${action === 'désactiver' ? 'désactivé' : 'réactivé'}`); fetchAll(); } catch (e) { toast.error('Erreur'); }
              }}
              onHardDelete={async (p) => {
                const ok = await confirm({ type: 'danger', title: `Supprimer définitivement ?`, message: `Êtes-vous sûr de vouloir supprimer définitivement ${p.prenom} ${p.nom} (${p.matricule}) ? Cette action est irréversible.`, confirmLabel: 'Supprimer définitivement', cancelLabel: 'Annuler' });
                if (!ok) return;
                try { await equipesApi.hardDeletePersonnel(p.id); toast.success(`${p.prenom} ${p.nom} supprimé définitivement`); fetchAll(); } catch (e) { toast.error(e.response?.data?.error || 'Erreur suppression'); }
              }}
            />
          )}
          {activeTab === 'zones' && (
            <TabZones zones={zones} searchQuery={searchQuery} isAdmin={isAdmin} isSystemAdmin={isSystemAdmin}
              onEdit={(z) => { setEditingItem(z); setShowZoneModal(true); }}
              onDelete={async (z) => {
                const action = z.actif ? 'désactiver' : 'réactiver';
                const ok = await confirm({ type: z.actif ? 'danger' : 'info', title: `${z.actif ? 'Désactiver' : 'Réactiver'} "${z.nom}" ?`, message: `Voulez-vous ${action} cette zone ?`, confirmLabel: z.actif ? 'Désactiver' : 'Réactiver', cancelLabel: 'Annuler' });
                if (!ok) return;
                try { await equipesApi.deleteZone(z.id); toast.success(`Zone ${action === 'désactiver' ? 'désactivée' : 'réactivée'}`); fetchAll(); } catch (e) { toast.error('Erreur'); }
              }}
              onHardDelete={async (z) => {
                const ok = await confirm({ type: 'danger', title: 'Supprimer définitivement ?', message: `Êtes-vous sûr de vouloir supprimer définitivement la zone "${z.nom}" ? Les équipes assignées seront détachées. Cette action est irréversible.`, confirmLabel: 'Supprimer définitivement', cancelLabel: 'Annuler' });
                if (!ok) return;
                try { await equipesApi.hardDeleteZone(z.id); toast.success(`Zone "${z.nom}" supprimée définitivement`); fetchAll(); } catch (e) { toast.error(e.response?.data?.error || 'Erreur suppression'); }
              }}
            />
          )}
        </>
      )}

      {/* ===== MODALS ===== */}

      {showEquipeModal && (
        <EquipeModal
          editing={editingItem}
          zones={zones.filter(z => z.actif)}
          personnel={personnel}
          qualifications={qualifications}
          onClose={() => { setShowEquipeModal(false); setEditingItem(null); }}
          onSaved={() => { setShowEquipeModal(false); setEditingItem(null); fetchAll(); }}
          toast={toast}
        />
      )}

      {showPersonnelModal && (
        <PersonnelModal
          editing={editingItem}
          qualifications={qualifications.filter(q => q.actif)}
          onClose={() => { setShowPersonnelModal(false); setEditingItem(null); }}
          onSaved={() => { setShowPersonnelModal(false); setEditingItem(null); fetchAll(); }}
          toast={toast}
        />
      )}

      {showZoneModal && (
        <ZoneModal
          editing={editingItem}
          onClose={() => { setShowZoneModal(false); setEditingItem(null); }}
          onSaved={() => { setShowZoneModal(false); setEditingItem(null); fetchAll(); }}
          toast={toast}
        />
      )}

      {showQualifModal && (
        <QualificationsModal
          qualifications={qualifications}
          onClose={() => setShowQualifModal(false)}
          onSaved={fetchAll}
          toast={toast}
        />
      )}

      {showDetailModal && (
        <EquipeDetailModal
          equipe={showDetailModal}
          onClose={() => setShowDetailModal(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * TAB: Équipes
 * ═══════════════════════════════════════════════════════════ */
function TabEquipes({ equipes, zones, searchQuery, isAdmin, isSystemAdmin, onView, onEdit, onDelete, onHardDelete }) {
  const filtered = equipes.filter(eq => {
    const q = searchQuery.toLowerCase();
    if (eq.code?.toLowerCase().includes(q)) return true;
    if (eq.nom?.toLowerCase().includes(q)) return true;
    const za = eq.zones_assignees || [];
    return za.some(z =>
      z.zone_nom?.toLowerCase().includes(q) ||
      z.chef?.prenom?.toLowerCase().includes(q) ||
      z.chef?.nom?.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune équipe trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map(eq => {
        const zonesAssignees = eq.zones_assignees || [];
        const totalMembres = (eq.all_membres || []).length;

        return (
          <div key={eq.id} className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow ${!eq.actif ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b rounded-t-xl bg-gradient-to-r from-violet-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-100 border border-violet-200">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-900">{eq.code}</span>
                  {!eq.actif && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactif</span>}
                  <p className="text-sm text-gray-600 truncate max-w-[180px]">{eq.nom}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onView(eq)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg" title="Voir détail">
                  <Eye className="w-4 h-4" />
                </button>
                {isAdmin && (<>
                  <button onClick={() => onEdit(eq)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Modifier">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(eq)} className={`p-1.5 rounded-lg ${eq.actif ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={eq.actif ? 'Désactiver' : 'Réactiver'}>
                    {eq.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  {isSystemAdmin && (
                    <button onClick={() => onHardDelete(eq)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer définitivement">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>)}
              </div>
            </div>

            {/* Content – Zones assignées */}
            <div className="p-4 space-y-2 text-sm">
              {zonesAssignees.length === 0 ? (
                <p className="text-gray-400 italic text-xs">Aucune zone assignée</p>
              ) : (
                zonesAssignees.map(za => {
                  const zColor = getColorClasses(za.zone_couleur);
                  return (
                    <div key={za.zone_id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${zColor.bg} border ${zColor.border}`}>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${zColor.dot}`}></span>
                      <span className={`font-medium text-xs ${zColor.text}`}>{za.zone_nom}</span>
                      <span className="text-gray-300 mx-0.5">·</span>
                      {za.chef ? (
                        <span className="text-xs text-gray-700 flex items-center gap-1 truncate">
                          <Shield className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          {za.chef.prenom} {za.chef.nom}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Pas de chef</span>
                      )}
                      <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{za.membres?.length || 0} mbr</span>
                    </div>
                  );
                })
              )}

              {/* Total membres */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <UserCheck className="w-4 h-4 text-violet-500" />
                <span className="text-gray-500">Total</span>
                <span className="font-medium text-gray-900">{totalMembres}</span>
                <div className="flex -space-x-1 ml-auto">
                  {(eq.all_membres || []).slice(0, 5).map((m, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center"
                         title={`${m.prenom} ${m.nom}`}>
                      <span className="text-[9px] font-bold text-violet-600">
                        {m.prenom?.[0]}{m.nom?.[0]}
                      </span>
                    </div>
                  ))}
                  {totalMembres > 5 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-500">+{totalMembres - 5}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-3 space-y-1">
              {eq.notes && <p className="text-xs text-gray-400 truncate">{eq.notes}</p>}
              <p className="text-[10px] text-gray-300">
                {eq.createur_prenom} {eq.createur_nom}
                {eq.created_at && ` · ${new Date(eq.created_at).toLocaleDateString('fr-FR')}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * TAB: Personnel
 * ═══════════════════════════════════════════════════════════ */
function TabPersonnel({ personnel, qualifications, searchQuery, isAdmin, isSystemAdmin, getPersonnelEquipes, onEdit, onDelete, onHardDelete }) {
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = personnel.filter(p => {
    const matchesSearch =
      p.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.matricule?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.qualification_nom?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Filtre par rôle */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'Tous', count: personnel.length },
          { value: 'chef', label: 'Chefs', count: personnel.filter(p => p.role === 'chef').length },
          { value: 'operateur', label: 'Opérateurs', count: personnel.filter(p => p.role === 'operateur').length },
        ].map(f => (
          <button key={f.value} onClick={() => setRoleFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === f.value
                ? 'bg-violet-100 text-violet-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {f.label} <span className="ml-1 text-xs opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun personnel trouvé</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: Card layout ── */}
          <div className="md:hidden space-y-3">
            {filtered.map(p => {
              const eqs = getPersonnelEquipes(p.id);
              return (
                <div key={p.id} className={`bg-white border border-gray-200 rounded-xl p-4 ${!p.actif ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        p.role === 'chef' ? 'bg-amber-100' : 'bg-violet-100'
                      }`}>
                        <span className={`text-sm font-bold ${p.role === 'chef' ? 'text-amber-700' : 'text-violet-600'}`}>
                          {p.prenom?.[0]}{p.nom?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{p.prenom} {p.nom}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-gray-500">{p.matricule}</span>
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.role === 'chef' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {p.role === 'chef' ? <Shield className="w-2.5 h-2.5" /> : <Briefcase className="w-2.5 h-2.5" />}
                            {p.role === 'chef' ? 'Chef' : 'Opér.'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                      {isAdmin && (<>
                        <button onClick={() => onEdit(p)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(p)} className={`p-1.5 rounded-lg ${p.actif ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                          {p.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        {isSystemAdmin && (
                          <button onClick={() => onHardDelete(p)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer définitivement">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    {p.qualification_nom && (
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {p.qualification_nom}</span>
                    )}
                    {p.telephone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.telephone}</span>
                    )}
                    {eqs.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Users className="w-3 h-3" />
                        {eqs.map(eq => (
                          <span key={eq.id} className="bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded text-[10px] font-medium">{eq.code}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop: Table layout ── */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Nom & Prénom</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Matricule</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Rôle</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Qualification</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Tél.</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Équipes</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                    {isAdmin && <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const eqs = getPersonnelEquipes(p.id);
                    return (
                      <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!p.actif ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {p.prenom} {p.nom}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600 text-xs">{p.matricule}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            p.role === 'chef' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {p.role === 'chef' ? <Shield className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                            {p.role === 'chef' ? 'Chef' : 'Opérateur'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.qualification_nom || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.telephone || '—'}</td>
                        <td className="px-4 py-3">
                          {eqs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {eqs.map(eq => (
                                <span key={eq.id} className="text-xs bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">{eq.code}</span>
                              ))}
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            p.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {p.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => onEdit(p)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDelete(p)} className={`p-1.5 rounded-lg ${p.actif ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                                {p.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              {isSystemAdmin && (
                                <button onClick={() => onHardDelete(p)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer définitivement">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * TAB: Zones
 * ═══════════════════════════════════════════════════════════ */
function TabZones({ zones, searchQuery, isAdmin, isSystemAdmin, onEdit, onDelete, onHardDelete }) {
  const filtered = zones.filter(z =>
    z.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune zone trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.map(z => {
        const color = getColorClasses(z.couleur);
        return (
          <div key={z.id} className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow ${!z.actif ? 'opacity-60' : ''}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b rounded-t-xl ${color.bg}`}>
              <div className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full ${color.dot}`}></span>
                <span className={`font-bold ${color.text}`}>{z.nom}</span>
                {!z.actif && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactif</span>}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(z)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50/50 rounded-lg" title="Modifier">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(z)} className={`p-1.5 rounded-lg ${z.actif ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={z.actif ? 'Désactiver' : 'Réactiver'}>
                    {z.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  {isSystemAdmin && (
                    <button onClick={() => onHardDelete(z)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer définitivement">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="p-4">
              {z.description ? (
                <p className="text-sm text-gray-600">{z.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucune description</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                {z.nb_equipes || 0} équipe{(z.nb_equipes || 0) > 1 ? 's' : ''} assignée{(z.nb_equipes || 0) > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * Modal: Créer / Modifier Équipe
 * ═══════════════════════════════════════════════════════════ */
function EquipeModal({ editing, zones, personnel, qualifications, onClose, onSaved, toast }) {
  const [nom, setNom] = useState(editing?.nom || '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [saving, setSaving] = useState(false);

  // Zone assignments: { [zoneId]: { chef_id, membres: [personnelId, ...] } }
  const [zoneAssignments, setZoneAssignments] = useState(() => {
    if (!editing?.zones_assignees) return {};
    const map = {};
    for (const za of editing.zones_assignees) {
      if (!za.zone_id) continue;
      map[za.zone_id] = {
        chef_id: za.chef?.personnel_id || '',
        membres: za.membres.map(m => m.personnel_id)
      };
    }
    return map;
  });

  const activeZones = zones.filter(z => z.actif);
  const chefs = personnel.filter(p => p.role === 'chef' && p.actif);
  const allActivePersonnel = personnel.filter(p => p.actif);

  // Collect all assigned personnel IDs across all zones (chefs + members)
  const allAssignedIds = useMemo(() => {
    const ids = new Set();
    Object.values(zoneAssignments).forEach(za => {
      if (za.chef_id) ids.add(Number(za.chef_id));
      za.membres.forEach(id => ids.add(Number(id)));
    });
    return ids;
  }, [zoneAssignments]);

  // Get available personnel for a specific zone (exclude those already assigned elsewhere)
  const getAvailableForZone = (zoneId) => {
    const currentZone = zoneAssignments[zoneId] || { chef_id: '', membres: [] };
    const currentZoneIds = new Set([
      ...(currentZone.chef_id ? [Number(currentZone.chef_id)] : []),
      ...currentZone.membres.map(Number)
    ]);

    return allActivePersonnel.filter(p => {
      // Keep if already in this zone, or not assigned anywhere
      return currentZoneIds.has(p.id) || !allAssignedIds.has(p.id);
    });
  };

  const toggleZone = (zoneId) => {
    setZoneAssignments(prev => {
      const next = { ...prev };
      if (next[zoneId]) {
        delete next[zoneId];
      } else {
        next[zoneId] = { chef_id: '', membres: [] };
      }
      return next;
    });
  };

  const setZoneChef = (zoneId, chefId) => {
    setZoneAssignments(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        chef_id: chefId,
        // Remove chef from membres if they were there
        membres: (prev[zoneId]?.membres || []).filter(id => id !== Number(chefId))
      }
    }));
  };

  const toggleZoneMembre = (zoneId, personnelId) => {
    setZoneAssignments(prev => {
      const za = prev[zoneId] || { chef_id: '', membres: [] };
      const has = za.membres.includes(personnelId);
      return {
        ...prev,
        [zoneId]: {
          ...za,
          membres: has ? za.membres.filter(id => id !== personnelId) : [...za.membres, personnelId]
        }
      };
    });
  };

  const handleSubmit = async () => {
    if (!nom.trim()) { toast.error('Le nom est requis'); return; }
    const hasAnyZone = Object.keys(zoneAssignments).length > 0;
    if (!hasAnyZone) { toast.error('Veuillez sélectionner au moins une zone'); return; }

    try {
      setSaving(true);
      const zones_assignees = Object.entries(zoneAssignments).map(([zoneId, za]) => ({
        zone_id: Number(zoneId),
        chef_id: za.chef_id ? Number(za.chef_id) : null,
        membres: za.membres.map(Number)
      }));

      const data = { nom, notes, zones_assignees };
      if (editing) {
        await equipesApi.update(editing.id, data);
        toast.success('Équipe modifiée');
      } else {
        await equipesApi.create(data);
        toast.success('Équipe créée');
      }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-2 sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-violet-50 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{editing ? 'Modifier' : 'Nouvelle'} Équipe</h2>
          <button onClick={onClose} className="p-2 hover:bg-violet-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'équipe *</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 text-base"
              placeholder="Ex: Équipe Formage Matin" />
          </div>

          {/* ── Zones Assignment ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Zones de travail — sélectionner et affecter le personnel
            </label>

            <div className="space-y-4">
              {activeZones.map(zone => {
                const isActive = !!zoneAssignments[zone.id];
                const color = getColorClasses(zone.couleur);
                const za = zoneAssignments[zone.id] || { chef_id: '', membres: [] };
                const availablePersonnel = isActive ? getAvailableForZone(zone.id) : [];
                const availableChefs = availablePersonnel.filter(p => p.role === 'chef');
                const availableForList = availablePersonnel.filter(p =>
                  p.id !== Number(za.chef_id)
                );

                return (
                  <div key={zone.id} className={`border-2 rounded-xl transition-all ${isActive ? `${color.border} shadow-sm` : 'border-gray-200 opacity-70'}`}>
                    {/* Zone header — toggle */}
                    <button
                      type="button"
                      onClick={() => toggleZone(zone.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-t-xl transition-colors ${isActive ? color.bg : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isActive ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`}>
                        {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`w-3 h-3 rounded-full ${color.dot}`}></span>
                      <span className={`font-semibold ${isActive ? color.text : 'text-gray-500'}`}>{zone.nom}</span>
                      {zone.description && <span className="text-xs text-gray-400 ml-auto hidden sm:inline">{zone.description}</span>}
                    </button>

                    {/* Zone content — chef + members */}
                    {isActive && (
                      <div className="px-4 pb-4 pt-3 space-y-4 border-t border-gray-100">
                        {/* Chef selector */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
                            <Shield className="w-3.5 h-3.5" /> Chef d'équipe
                          </label>
                          <select
                            value={za.chef_id}
                            onChange={e => setZoneChef(zone.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 bg-white text-sm"
                          >
                            <option value="">— Aucun chef —</option>
                            {availableChefs.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.prenom} {c.nom} — {c.matricule}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Members list — full list, click to select */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 mb-1.5">
                            <Users className="w-3.5 h-3.5" /> Personnel ({za.membres.length} sélectionné{za.membres.length > 1 ? 's' : ''})
                          </label>
                          {availableForList.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2">Aucun personnel disponible</p>
                          ) : (
                            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                              {availableForList.map(p => {
                                const isSelected = za.membres.includes(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => toggleZoneMembre(zone.id, p.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isSelected ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                                  >
                                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                                      <span className="text-[10px] font-bold text-gray-500">{p.prenom?.[0]}{p.nom?.[0]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium text-gray-900">{p.prenom} {p.nom}</span>
                                      <span className="text-xs text-gray-400 ml-1.5">{p.matricule}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${p.role === 'chef' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {p.role === 'chef' ? 'Chef' : 'Opér.'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {activeZones.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune zone créée. Créez d'abord des zones de travail.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500"
              placeholder="Notes ou commentaires..." />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center">Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> {editing ? 'Enregistrer' : 'Créer l\'Équipe'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * Modal: Créer / Modifier Personnel
 * ═══════════════════════════════════════════════════════════ */
function PersonnelModal({ editing, qualifications, onClose, onSaved, toast }) {
  const [form, setForm] = useState({
    nom: editing?.nom || '',
    prenom: editing?.prenom || '',
    telephone: editing?.telephone || '',
    role: editing?.role || 'operateur',
    qualification_id: editing?.qualification_id || '',
    notes: editing?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [nextMatricule, setNextMatricule] = useState('...');

  useEffect(() => {
    if (!editing) {
      equipesApi.getProchainMatricule?.().then(r => setNextMatricule(r.data.matricule)).catch(() => setNextMatricule('ALT-???'));
    }
  }, [editing]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast.error('Nom et prénom sont requis');
      return;
    }
    try {
      setSaving(true);
      const data = { ...form, qualification_id: form.qualification_id || null };
      if (editing) {
        await equipesApi.updatePersonnel(editing.id, data);
        toast.success('Personnel modifié');
      } else {
        await equipesApi.createPersonnel(data);
        toast.success('Personnel créé');
      }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 sm:my-8">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-violet-50 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{editing ? 'Modifier' : 'Nouveau'} Personnel</h2>
          <button onClick={onClose} className="p-2 hover:bg-violet-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input value={form.prenom} onChange={e => update('prenom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input value={form.nom} onChange={e => update('nom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-gray-600">
                {editing ? editing.matricule : <span className="text-violet-600">{nextMatricule} <span className="text-xs text-gray-400 font-sans">(auto)</span></span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input value={form.telephone} onChange={e => update('telephone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
              <select value={form.role} onChange={e => update('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white">
                <option value="operateur">Opérateur</option>
                <option value="chef">Chef d'équipe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <select value={form.qualification_id} onChange={e => update('qualification_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white">
                <option value="">— Aucune —</option>
                {qualifications.map(q => <option key={q.id} value={q.id}>{q.nom}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500" />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center">Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> {editing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * Modal: Créer / Modifier Zone
 * ═══════════════════════════════════════════════════════════ */
function ZoneModal({ editing, onClose, onSaved, toast }) {
  const [nom, setNom] = useState(editing?.nom || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [couleur, setCouleur] = useState(editing?.couleur || 'blue');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nom.trim()) { toast.error('Le nom est requis'); return; }
    try {
      setSaving(true);
      const data = { nom, description, couleur };
      if (editing) {
        await equipesApi.updateZone(editing.id, data);
        toast.success('Zone modifiée');
      } else {
        await equipesApi.createZone(data);
        toast.success('Zone créée');
      }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4 sm:my-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-violet-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{editing ? 'Modifier' : 'Nouvelle'} Zone</h2>
          <button onClick={onClose} className="p-2 hover:bg-violet-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              placeholder="Ex: Zone Formage" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
            <div className="grid grid-cols-5 gap-2">
              {ZONE_COLORS.map(c => (
                <button key={c.key} onClick={() => setCouleur(c.key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    couleur === c.key
                      ? `${c.border} ${c.bg} ring-2 ring-offset-1 ring-violet-300`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className={`w-6 h-6 rounded-full ${c.dot}`}></span>
                  <span className="text-[10px] text-gray-500">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center">Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> {editing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * Modal: Gérer les Qualifications (CRUD inline)
 * ═══════════════════════════════════════════════════════════ */
function QualificationsModal({ qualifications, onClose, onSaved, toast }) {
  const [newNom, setNewNom] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNom, setEditNom] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newNom.trim()) return;
    try {
      setSaving(true);
      await equipesApi.createQualification({ nom: newNom.trim() });
      setNewNom('');
      toast.success('Qualification ajoutée');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id) => {
    if (!editNom.trim()) return;
    try {
      await equipesApi.updateQualification(id, { nom: editNom.trim() });
      setEditId(null);
      toast.success('Qualification modifiée');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    }
  };

  const handleToggle = async (q) => {
    try {
      await equipesApi.deleteQualification(q.id);
      toast.success(q.actif ? 'Qualification désactivée' : 'Qualification réactivée');
      onSaved();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4 sm:my-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-violet-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-600" /> Qualifications
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-violet-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3 sm:p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {qualifications.map(q => (
            <div key={q.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${!q.actif ? 'opacity-50 bg-gray-50' : 'bg-white'} border-gray-200`}>
              {editId === q.id ? (
                <>
                  <input value={editNom} onChange={e => setEditNom(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-violet-500"
                    onKeyDown={e => e.key === 'Enter' && handleUpdate(q.id)} autoFocus />
                  <button onClick={() => handleUpdate(q.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{q.nom}</span>
                  {!q.actif && <span className="text-xs text-red-500 font-bold">Inactif</span>}
                  <button onClick={() => { setEditId(q.id); setEditNom(q.nom); }}
                    className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleToggle(q)}
                    className={`p-1 rounded ${q.actif ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                    {q.actif ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="px-3 sm:px-4 pb-4">
          <div className="flex gap-2">
            <input value={newNom} onChange={e => setNewNom(e.target.value)}
              className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
              placeholder="Nouvelle qualification..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <button onClick={handleAdd} disabled={saving || !newNom.trim()}
              className="px-4 py-2.5 sm:py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-end px-4 sm:px-6 py-3 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-center">Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * Modal: Détail d'une équipe (lecture seule)
 * ═══════════════════════════════════════════════════════════ */
function EquipeDetailModal({ equipe, onClose }) {
  const zonesAssignees = equipe.zones_assignees || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b rounded-t-2xl bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{equipe.code}</h2>
              {!equipe.actif && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Inactif</span>}
            </div>
            <p className="text-sm text-gray-600 truncate">{equipe.nom}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Zones */}
          {zonesAssignees.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune zone assignée</p>
          ) : (
            zonesAssignees.map(za => {
              const zColor = getColorClasses(za.zone_couleur);
              const membres = za.membres || [];
              return (
                <div key={za.zone_id} className={`rounded-xl border ${zColor.border} overflow-hidden`}>
                  {/* Zone header */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 ${zColor.bg}`}>
                    <MapPin className={`w-4 h-4 ${zColor.text}`} />
                    <span className={`font-semibold text-sm ${zColor.text}`}>{za.zone_nom}</span>
                    <span className="ml-auto text-xs text-gray-500">{membres.length + (za.chef ? 1 : 0)} pers.</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {/* Chef */}
                    {za.chef ? (
                      <div className="flex flex-wrap items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">{za.chef.prenom} {za.chef.nom}</span>
                          <span className="text-xs text-gray-400 ml-2">{za.chef.matricule}</span>
                        </div>
                        {za.chef.qualification_nom && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{za.chef.qualification_nom}</span>
                        )}
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Chef</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic px-2">Pas de chef assigné</p>
                    )}
                    {/* Members */}
                    {membres.map(m => (
                      <div key={m.id || m.personnel_id} className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-violet-600">{m.prenom?.[0]}{m.nom?.[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">{m.prenom} {m.nom}</span>
                          <span className="text-xs text-gray-400 ml-2">{m.matricule}</span>
                        </div>
                        {m.qualification_nom && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{m.qualification_nom}</span>
                        )}
                      </div>
                    ))}
                    {membres.length === 0 && !za.chef && (
                      <p className="text-xs text-gray-400 italic px-2">Aucun membre</p>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Notes */}
          {equipe.notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">{equipe.notes}</p>
            </div>
          )}

          {/* Meta */}
          <p className="text-xs text-gray-400">
            Créé par {equipe.createur_prenom} {equipe.createur_nom}
            {equipe.created_at && ` le ${new Date(equipe.created_at).toLocaleDateString('fr-FR')}`}
          </p>
        </div>

        <div className="flex justify-end px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-center">Fermer</button>
        </div>
      </div>
    </div>
  );
}
