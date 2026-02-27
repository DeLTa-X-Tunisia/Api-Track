import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { usersApi } from '../services/api';
import {
  Users, UserPlus, Shield, ShieldCheck, Eye, EyeOff, Search, Filter,
  Edit2, Trash2, Check, X, RefreshCw, Copy, UserCog, UserX, Building2,
  ChevronDown, Plus, Loader2, KeyRound, ShieldAlert
} from 'lucide-react';

const ROLE_CONFIG = {
  system_admin: {
    label: 'Admin Système',
    shortLabel: 'Sys Admin',
    color: 'bg-red-100 text-red-700',
    icon: ShieldAlert,
  },
  admin: {
    label: 'Administrateur',
    shortLabel: 'Admin',
    color: 'bg-accent-100 text-accent-600',
    icon: ShieldCheck,
  },
  superviseur: {
    label: 'Superviseur',
    shortLabel: 'Superviseur',
    color: 'bg-warning-100 text-warning-600',
    icon: UserCog,
  },
  consultant: {
    label: 'Consultant',
    shortLabel: 'Consultant',
    color: 'bg-primary-100 text-primary-600',
    icon: Eye,
  },
};

export default function GestionUtilisateurs() {
  const { user: currentUser, isSystemAdmin } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  // Data
  const [users, setUsers] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterEntreprise, setFilterEntreprise] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActif, setFilterActif] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeName, setCodeName] = useState('');

  // ============ Chargement ============

  const loadUsers = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterEntreprise) params.entreprise = filterEntreprise;
      if (filterRole) params.role = filterRole;
      if (filterActif !== '') params.actif = filterActif;
      const res = await usersApi.getAll(params);
      setUsers(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  }, [search, filterEntreprise, filterRole, filterActif]);

  const loadStats = useCallback(async () => {
    try {
      const res = await usersApi.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  }, []);

  const loadEntreprises = useCallback(async () => {
    try {
      const res = await usersApi.getEntreprises();
      setEntreprises(res.data);
    } catch (error) {
      console.error('Erreur entreprises:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadStats(), loadEntreprises()]);
      setLoading(false);
    };
    init();
  }, []);

  // Recharger les users quand les filtres changent
  useEffect(() => {
    if (!loading) loadUsers();
  }, [search, filterEntreprise, filterRole, filterActif]);

  // ============ Actions ============

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, formData);
        toast.success('Utilisateur mis à jour');
      } else {
        const res = await usersApi.create(formData);
        setGeneratedCode(res.data.codeConnexion);
        setCodeName(`${formData.prenom} ${formData.nom}`);
        setShowCodeModal(true);
        toast.success('Utilisateur créé avec succès');
      }
      setShowModal(false);
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (user) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Désactiver l\'utilisateur',
      message: `Voulez-vous désactiver le compte de ${user.prenom} ${user.nom} ?`,
      description: 'L\'utilisateur ne pourra plus se connecter mais son compte sera conservé.',
      confirmLabel: 'Désactiver',
      cancelLabel: 'Annuler',
    });
    if (!confirmed) return;

    try {
      await usersApi.delete(user.id);
      toast.success('Utilisateur désactivé');
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handlePermanentDelete = async (user) => {
    const confirmed = await confirm({
      type: 'danger',
      title: 'Supprimer définitivement',
      message: `Supprimer définitivement le compte de ${user.prenom} ${user.nom} ?`,
      description: 'Cette action est irréversible. Toutes les données seront perdues.',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!confirmed) return;

    try {
      await usersApi.permanentDelete(user.id);
      toast.success('Utilisateur supprimé définitivement');
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleActivate = async (user) => {
    try {
      await usersApi.activate(user.id);
      toast.success('Utilisateur réactivé');
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error('Erreur lors de la réactivation');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    if (user.role === newRole) return;
    const roleLabel = ROLE_CONFIG[newRole]?.label || newRole;

    const confirmed = await confirm({
      type: 'warning',
      title: 'Changer le rôle',
      message: `Changer le rôle de ${user.prenom} ${user.nom} en "${roleLabel}" ?`,
      confirmLabel: 'Confirmer',
      cancelLabel: 'Annuler',
    });
    if (!confirmed) return;

    try {
      await usersApi.changeRole(user.id, newRole);
      toast.success(`Rôle changé en ${roleLabel}`);
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleRegenerateCode = async (user) => {
    const confirmed = await confirm({
      type: 'reset',
      title: 'Régénérer le code',
      message: `Régénérer le code de connexion de ${user.prenom} ${user.nom} ?`,
      description: 'L\'ancien code ne fonctionnera plus.',
      confirmLabel: 'Régénérer',
      cancelLabel: 'Annuler',
    });
    if (!confirmed) return;

    try {
      const res = await usersApi.regenerateCode(user.id);
      setGeneratedCode(res.data.nouveauCode);
      setCodeName(`${user.prenom} ${user.nom}`);
      setShowCodeModal(true);
      toast.success('Nouveau code généré');
      loadUsers();
    } catch (error) {
      toast.error('Erreur lors de la régénération');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Code copié dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  // ============ Filtrage local ============
  // Le filtrage principal se fait côté serveur via les params

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <span className="text-sm text-gray-400">Chargement des utilisateurs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gérer les comptes et les permissions</p>
        </div>
        {isSystemAdmin && (
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        )}
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total" value={stats.total} icon={Users} color="primary" />
          <StatCard label="Actifs" value={stats.actifs} icon={Check} color="success" />
          <StatCard label="Admins" value={Number(stats.system_admins || 0) + Number(stats.admins || 0)} icon={Shield} color="accent" />
          <StatCard label="Superviseurs" value={stats.superviseurs} icon={UserCog} color="warning" />
          <StatCard label="Consultants" value={stats.consultants || 0} icon={Eye} color="primary" />
          <StatCard label="Entreprises" value={entreprises.length} icon={Building2} color="warning" />
        </div>
      )}

      {/* Filtres */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, code, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Entreprise */}
          <select
            value={filterEntreprise}
            onChange={(e) => setFilterEntreprise(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="">Entreprise</option>
            {entreprises.map(e => (
              <option key={e.id} value={e.code}>{e.nom}</option>
            ))}
          </select>

          {/* Rôle */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="">Rôle</option>
            {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Statut */}
          <select
            value={filterActif}
            onChange={(e) => setFilterActif(e.target.value)}
            className="input-field w-full sm:w-32"
          >
            <option value="">Statut</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-medium">Aucun utilisateur trouvé</p>
            <p className="text-sm mt-1">Modifiez vos filtres ou créez un nouvel utilisateur</p>
          </div>
        ) : (
          users.map((u) => {
            const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.consultant;
            return (
              <div key={u.id} className={`card p-4 ${!u.actif ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${roleCfg.color}`}>
                      {u.role === 'system_admin' ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <span className="font-semibold text-sm">{u.prenom?.[0]}{u.nom?.[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.prenom} {u.nom}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${roleCfg.color}`}>{roleCfg.shortLabel}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.actif ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'}`}>
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                  <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{u.code}</code>
                  {(u.entreprise_nom || u.entreprise) && (
                    <span className="flex items-center gap-1 text-xs"><Building2 className="w-3 h-3" />{u.entreprise_nom || u.entreprise}</span>
                  )}
                </div>
                {isSystemAdmin && u.id !== currentUser?.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => handleEdit(u)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleRegenerateCode(u)} className="p-2 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600" title="Régénérer code"><RefreshCw className="w-4 h-4" /></button>
                    <button onClick={() => copyToClipboard(u.code)} className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-600" title="Copier code"><Copy className="w-4 h-4" /></button>
                    {!u.actif && (
                      <button onClick={() => handleActivate(u)} className="p-2 rounded-lg bg-success-50 hover:bg-success-100 text-success-600" title="Réactiver"><Check className="w-4 h-4" /></button>
                    )}
                    {u.actif && (
                      <button onClick={() => handleDelete(u)} className="p-2 rounded-lg bg-warning-50 hover:bg-warning-100 text-warning-600" title="Désactiver"><UserX className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handlePermanentDelete(u)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="px-1 py-2">
          <p className="text-xs text-gray-500">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} affiché{users.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Entreprise</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium">Aucun utilisateur trouvé</p>
                    <p className="text-sm mt-1">Modifiez vos filtres ou créez un nouvel utilisateur</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isSystemAdmin={isSystemAdmin}
                    currentUserId={currentUser?.id}
                    onEdit={() => handleEdit(u)}
                    onDelete={() => handleDelete(u)}
                    onPermanentDelete={() => handlePermanentDelete(u)}
                    onActivate={() => handleActivate(u)}
                    onChangeRole={(role) => handleChangeRole(u, role)}
                    onRegenerate={() => handleRegenerateCode(u)}
                    onCopy={() => copyToClipboard(u.code)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Counter */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} affiché{users.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <UserModal
          user={editingUser}
          entreprises={entreprises}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onEntreprisesChanged={loadEntreprises}
          isSystemAdmin={isSystemAdmin}
        />
      )}

      {showCodeModal && (
        <CodeModal
          code={generatedCode}
          name={codeName}
          onClose={() => setShowCodeModal(false)}
          onCopy={() => copyToClipboard(generatedCode)}
        />
      )}
    </div>
  );
}

// ============================================
// Composants enfants
// ============================================

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    accent: 'bg-accent-50 text-accent-600'
  };

  return (
    <div className="card flex items-center gap-3">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function UserRow({ user, isSystemAdmin, currentUserId, onEdit, onDelete, onPermanentDelete, onActivate, onChangeRole, onRegenerate, onCopy }) {
  const [showCode, setShowCode] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const roleButtonRef = useRef(null);

  const handleToggleRoleMenu = () => {
    if (!showRoleMenu && roleButtonRef.current) {
      const rect = roleButtonRef.current.getBoundingClientRect();
      // On mobile, center the menu; on desktop, position near button
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setMenuPos({
          bottom: 'auto',
          top: rect.bottom + 4,
          left: '50%',
          right: 'auto',
          transform: 'translateX(-50%)',
        });
      } else {
        setMenuPos({
          bottom: window.innerHeight - rect.top + 4,
          right: window.innerWidth - rect.right,
          top: 'auto',
          left: 'auto',
          transform: 'none',
        });
      }
    }
    setShowRoleMenu(!showRoleMenu);
  };

  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.consultant;
  const RoleIcon = roleCfg.icon;

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${!user.actif ? 'opacity-60' : ''}`}>
      {/* Utilisateur */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${roleCfg.color}`}>
            {user.role === 'system_admin' ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <span className="font-semibold text-sm">{user.prenom?.[0]}{user.nom?.[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900">{user.prenom} {user.nom}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleCfg.color}`}>
                {roleCfg.shortLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500">{user.matricule}</p>
          </div>
        </div>
      </td>

      {/* Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
            {showCode ? user.code : '••••••'}
          </code>
          <button
            onClick={() => setShowCode(!showCode)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title={showCode ? 'Masquer le code' : 'Afficher le code'}
          >
            {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          {isSystemAdmin && (
            <>
              <button
                onClick={onRegenerate}
                className="p-1 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                title="Régénérer le code"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onCopy}
                className="p-1 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                title="Copier le code"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>

      {/* Entreprise */}
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{user.entreprise_nom || user.entreprise || '-'}</span>
        </div>
      </td>

      {/* Statut */}
      <td className="px-4 py-3 text-center hidden sm:table-cell">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          user.actif ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {user.actif ? 'Actif' : 'Inactif'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
          {isSystemAdmin && (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
                title="Modifier"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Role change menu */}
              <button
                ref={roleButtonRef}
                onClick={handleToggleRoleMenu}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors flex-shrink-0"
                title="Changer le rôle"
              >
                <UserCog className="w-4 h-4" />
              </button>
              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                  <div
                    className="fixed w-52 max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn"
                    style={menuPos}
                  >
                    {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                      const MenuIcon = cfg.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => { onChangeRole(key); setShowRoleMenu(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${user.role === key ? cfg.color : ''}`}
                        >
                          <MenuIcon className="w-4 h-4" />
                          {cfg.label}
                          {user.role === key && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {user.id !== currentUserId && (
                <>
                  {!user.actif && (
                    <button
                      onClick={onActivate}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-success-50 hover:bg-success-100 text-success-600 transition-colors flex-shrink-0"
                      title="Réactiver"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {user.actif && (
                    <button
                      onClick={onDelete}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-warning-50 hover:bg-warning-100 text-warning-600 transition-colors flex-shrink-0"
                      title="Désactiver"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onPermanentDelete}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors flex-shrink-0"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function UserModal({ user, entreprises, onClose, onSave, onEntreprisesChanged, isSystemAdmin }) {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    entreprise: user?.entreprise || 'danieli',
    role: user?.role || 'consultant',
    actif: user?.actif !== undefined ? user.actif : true,
  });
  const [saving, setSaving] = useState(false);
  const [showEntrepriseManager, setShowEntrepriseManager] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Informations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Informations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="input-field"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Entreprise */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Entreprise
            </h3>
            <div className="flex gap-2">
              <select
                value={formData.entreprise}
                onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                className="input-field flex-1"
              >
                {entreprises.map(e => (
                  <option key={e.id} value={e.code}>{e.nom}</option>
                ))}
              </select>
              {isSystemAdmin && (
                <button
                  type="button"
                  onClick={() => setShowEntrepriseManager(true)}
                  className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                  title="Gérer les entreprises"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Rôle */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rôle & Statut
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="consultant">Consultant (lecture seule)</option>
                  <option value="superviseur">Superviseur (production)</option>
                  <option value="admin">Administrateur</option>
                  <option value="system_admin">Admin Système (tous droits)</option>
                </select>
              </div>
              {user && (
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.actif}
                      onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-success-600 focus:ring-success-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Compte actif</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {user ? 'Enregistrer' : 'Créer l\'utilisateur'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Entreprise manager sub-modal */}
      {showEntrepriseManager && (
        <EntrepriseManager
          entreprises={entreprises}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowEntrepriseManager(false)}
          onChanged={onEntreprisesChanged}
        />
      )}
    </div>
  );
}

function EntrepriseManager({ entreprises, formData, setFormData, onClose, onChanged }) {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [localItems, setLocalItems] = useState(entreprises);
  const [newCode, setNewCode] = useState('');
  const [newNom, setNewNom] = useState('');

  useEffect(() => {
    setLocalItems(entreprises);
  }, [entreprises]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newNom.trim()) return;
    try {
      const res = await usersApi.addEntreprise({ code: newCode.trim(), nom: newNom.trim() });
      await onChanged();
      const newItem = res.data;
      setLocalItems(prev => [...prev, { id: newItem.id, code: newItem.code, nom: newItem.nom }]);
      setFormData(prev => ({ ...prev, entreprise: newItem.code }));
      setNewCode('');
      setNewNom('');
      toast.success('Entreprise ajoutée');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirm({
      type: 'danger',
      title: 'Supprimer l\'entreprise',
      message: `Supprimer "${item.nom}" ?`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!confirmed) return;

    try {
      await usersApi.deleteEntreprise(item.id);
      await onChanged();
      setLocalItems(prev => prev.filter(i => i.id !== item.id));
      if (formData.entreprise === item.code) {
        setFormData(prev => ({ ...prev, entreprise: '' }));
      }
      toast.success('Entreprise supprimée');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-fadeIn max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Gérer les entreprises</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire d'ajout */}
        <form onSubmit={handleAdd} className="p-4 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ajouter une entreprise</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field w-28 flex-shrink-0"
              placeholder="Code (ex: abc)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              required
            />
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Nom de l'entreprise"
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" className="btn-primary px-4 flex-shrink-0">
              <Plus size={18} />
            </button>
          </div>
        </form>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            Entreprises existantes ({localItems.length})
          </p>
          {localItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune entreprise</p>
          ) : (
            <div className="space-y-1">
              {localItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 group">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{item.nom}</span>
                    <span className="text-xs text-gray-400 ml-2">({item.code})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="btn-secondary w-full">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeModal({ code, name, onClose, onCopy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slideUp">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-success-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Code de connexion généré
          </h2>
          <p className="text-gray-500 mb-6">
            Code pour <strong>{name}</strong>
          </p>

          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-4xl font-mono font-bold text-primary-600 tracking-widest">
              {code}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={onCopy} className="btn-secondary flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Copier
            </button>
            <button onClick={onClose} className="btn-primary">
              Fermer
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Communiquez ce code à l'utilisateur de façon sécurisée
          </p>
        </div>
      </div>
    </div>
  );
}
