import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { settingsApi, responsabilitesApi } from '../services/api';
import {
  Settings, Building2, Upload, Trash2, Save, Image, 
  Hash, MapPin, User, CheckCircle, Loader2, Pencil, Eye,
  Shield, Plus, X, GripVertical, AlertTriangle,
  Smartphone, Download, ExternalLink, QrCode
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState('project');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getAll();
      setSettings(res.data);
      const data = {};
      res.data.forEach(s => { data[s.setting_key] = s.setting_value || ''; });
      setFormData(data);
    } catch (err) {
      toast.error('Erreur chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const getValue = (key) => {
    const s = settings.find(s => s.setting_key === key);
    return s?.setting_value || '';
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(formData)
        .filter(([key]) => !key.includes('_logo'))
        .map(([key, value]) => ({ key, value }));
      await settingsApi.updateBulk(updates);
      toast.success('Paramètres sauvegardés avec succès');
      await fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Section definitions - extensible
  const sections = [
    { id: 'project', label: 'Paramètres du projet', icon: Building2, color: 'blue' },
    { id: 'responsabilites', label: 'Resp. Réparation', icon: Shield, color: 'orange' },
    { id: 'mobile', label: 'Application Mobile', icon: Smartphone, color: 'green' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <span className="text-xl sm:text-2xl">Paramètres</span>
          </h1>
          <p className="page-subtitle text-sm sm:text-base">Configuration du système</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <div className="card p-2 space-y-1">
            <p className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sections</p>
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            </div>
          ) : activeSection === 'project' ? (
            <div className="space-y-5">
              {/* Logos section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <LogoCard
                  title="Logo Entreprise"
                  settingKey="enterprise_logo"
                  logoPath={getValue('enterprise_logo')}
                  isAdmin={isAdmin}
                  onRefresh={fetchSettings}
                />
                <LogoCard
                  title="Logo Client"
                  settingKey="client_logo"
                  logoPath={getValue('client_logo')}
                  isAdmin={isAdmin}
                  onRefresh={fetchSettings}
                />
              </div>

              {/* Informations Client */}
              <div className="card overflow-hidden">
                <div className="border-l-4 border-blue-500">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <User className="w-4.5 h-4.5 text-blue-500" />
                      Informations Client
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom du Client</label>
                        <input
                          type="text"
                          value={formData.client_name || ''}
                          onChange={(e) => handleChange('client_name', e.target.value)}
                          disabled={!isAdmin}
                          placeholder="Ex: ALTUMET"
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Adresse du Client</label>
                        <input
                          type="text"
                          value={formData.client_address || ''}
                          onChange={(e) => handleChange('client_address', e.target.value)}
                          disabled={!isAdmin}
                          placeholder="Ex: Alger Reghaia"
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations Projet */}
              <div className="card overflow-hidden">
                <div className="border-l-4 border-blue-500">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4.5 h-4.5 text-blue-500" />
                      Informations Projet
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom du Projet</label>
                        <input
                          type="text"
                          value={formData.project_name || ''}
                          onChange={(e) => handleChange('project_name', e.target.value)}
                          disabled={!isAdmin}
                          placeholder="Ex: ALTUMET Machine tube Spirale OFF-LINE"
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Code du Projet</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.project_code || ''}
                            onChange={(e) => handleChange('project_code', e.target.value)}
                            disabled={!isAdmin}
                            placeholder="Ex: DP0HYXF1"
                            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Adresse du Projet</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.project_address || ''}
                            onChange={(e) => handleChange('project_address', e.target.value)}
                            disabled={!isAdmin}
                            placeholder="Ex: Zone industrielle Rouiba"
                            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save button */}
              {isAdmin && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Sauvegarder
                  </button>
                </div>
              )}

              {/* Header preview */}
              <HeaderPreview
                enterpriseLogo={getValue('enterprise_logo')}
                clientLogo={getValue('client_logo')}
                clientName={formData.client_name || getValue('client_name')}
                projectName={formData.project_name || getValue('project_name')}
                projectCode={formData.project_code || getValue('project_code')}
              />
            </div>
          ) : activeSection === 'responsabilites' ? (
            <ResponsabilitesManager isAdmin={isAdmin} />
          ) : activeSection === 'mobile' ? (
            <MobileAppDownload />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MOBILE APP DOWNLOAD COMPONENT
// ============================================
function MobileAppDownload() {
  const [appInfo, setAppInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API_URL.replace('/api', '')}/api/mobile/info`);
        const data = await res.json();
        setAppInfo(data);
      } catch {
        setAppInfo({ available: false });
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = `${API_URL.replace('/api', '')}/api/mobile/download`;
    link.download = 'LogiTrack-V2.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Main download card */}
      <div className="card overflow-hidden">
        <div className="border-l-4 border-green-500">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Smartphone className="w-4.5 h-4.5 text-green-500" />
              Application Mobile Logi-Track V2
            </h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : !appInfo?.available ? (
              <div className="text-center py-12 text-gray-400">
                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">APK non disponible</p>
                <p className="text-xs mt-1">Contactez l'administrateur pour obtenir l'application mobile.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Hero section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-green-100">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200">
                      <Smartphone className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-gray-800">Logi-Track V2 Mobile</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Accédez à toutes les fonctionnalités de Logi-Track directement depuis votre appareil Android.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        v{appInfo.version}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        {appInfo.sizeFormatted}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        Android
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {downloading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      {downloading ? 'Téléchargement...' : 'Télécharger l\'APK'}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-gray-100 rounded-xl text-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-sm font-bold text-green-600">1</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Télécharger</p>
                    <p className="text-xs text-gray-500 mt-1">Cliquez sur le bouton ci-dessus pour télécharger le fichier APK.</p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-xl text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-sm font-bold text-blue-600">2</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Autoriser</p>
                    <p className="text-xs text-gray-500 mt-1">Activez "Sources inconnues" dans les paramètres de votre appareil.</p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-xl text-center">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-sm font-bold text-violet-600">3</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Installer</p>
                    <p className="text-xs text-gray-500 mt-1">Ouvrez le fichier APK téléchargé et suivez les instructions.</p>
                  </div>
                </div>

                {/* Features list */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Fonctionnalités incluses</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Accès complet à tous les modules',
                      'Prise de photo intégrée (caméra)',
                      'Téléchargement PDF & Excel',
                      'Découverte automatique du serveur',
                      'Mode plein écran immersif',
                      'Interface optimisée tactile',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// RESPONSABILITES MANAGER COMPONENT
// ============================================
function ResponsabilitesManager({ isAdmin }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editNom, setEditNom] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await responsabilitesApi.getAll();
      setItems(res.data);
    } catch {
      toast.error('Erreur chargement responsabilités');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    if (!newNom.trim()) return;
    setSaving(true);
    try {
      await responsabilitesApi.create({ nom: newNom.trim(), description: newDesc.trim() || null });
      toast.success('Responsabilité ajoutée');
      setNewNom('');
      setNewDesc('');
      setAdding(false);
      await fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur ajout');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditNom(item.nom);
    setEditDesc(item.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editNom.trim()) return;
    setSaving(true);
    try {
      const item = items.find(i => i.id === editingId);
      await responsabilitesApi.update(editingId, { nom: editNom.trim(), description: editDesc.trim() || null, ordre: item?.ordre ?? 0 });
      toast.success('Responsabilité modifiée');
      setEditingId(null);
      await fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur modification');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await responsabilitesApi.delete(id);
      toast.success('Responsabilité supprimée');
      setConfirmDeleteId(null);
      await fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur suppression');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="border-l-4 border-orange-500">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-orange-500" />
              Responsabilités Réparation
            </h3>
            {isAdmin && !adding && (
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            )}
          </div>

          <div className="p-5">
            <p className="text-xs text-gray-500 mb-4">
              Cette liste alimente le champ « Responsabilité » dans la modal de réparation des tubes.
            </p>

            {/* Add form */}
            {adding && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-orange-800">Nouvelle responsabilité</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={newNom}
                      onChange={(e) => setNewNom(e.target.value)}
                      placeholder="Ex: ALTUMET"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => { setAdding(false); setNewNom(''); setNewDesc(''); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newNom.trim() || saving}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Ajouter
                  </button>
                </div>
              </div>
            )}

            {/* Items list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune responsabilité configurée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all group"
                  >
                    {/* Order number */}
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Content */}
                    {editingId === item.id ? (
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editNom}
                          onChange={(e) => setEditNom(e.target.value)}
                          className="px-3 py-1.5 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description (optionnel)"
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.nom}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 truncate">{item.description}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={!editNom.trim() || saving}
                              className="p-1.5 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="Sauvegarder"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                  title="Annuler"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deletingId === item.id}
                                  className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Confirmer suppression"
                                >
                                  {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOGO CARD COMPONENT
// ============================================
function LogoCard({ title, settingKey, logoPath, isAdmin, onRefresh }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont autorisées');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Taille maximale : 5 Mo');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      await settingsApi.uploadLogo(settingKey, fd);
      toast.success('Logo uploadé');
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    try {
      await settingsApi.deleteLogo(settingKey);
      toast.success('Logo supprimé');
      await onRefresh();
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-l-4 border-blue-500">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Image className="w-4.5 h-4.5 text-blue-500" />
            {title}
          </h3>
        </div>
        <div className="p-5 flex flex-col items-center">
          {/* Logo preview */}
          <div className="w-28 sm:w-36 h-24 sm:h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 flex items-center justify-center overflow-hidden mb-4">
            {logoPath ? (
              <img
                src={`${API_URL}${logoPath}${logoPath.includes('?') ? '&' : '?'}token=${localStorage.getItem('logitrack2_token')}`}
                alt={title}
                className="max-w-full max-h-full object-contain p-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="text-center"><svg class="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><p class="text-xs text-gray-400 mt-1">Aucun logo</p></div>';
                }}
              />
            ) : (
              <div className="text-center">
                <Image className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400 mt-1">Aucun logo</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id={`upload-${settingKey}`}
              />
              <label
                htmlFor={`upload-${settingKey}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors
                  ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Changer
              </label>
              {logoPath && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-red-600 border border-red-200 bg-white rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HEADER PREVIEW COMPONENT
// ============================================
function HeaderPreview({ enterpriseLogo, clientLogo, clientName, projectName, projectCode }) {
  const hasContent = enterpriseLogo || clientLogo || clientName || projectName || projectCode;

  if (!hasContent) return null;

  return (
    <div className="card overflow-hidden">
      <div className="border-l-4 border-green-500">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-green-500" />
            Aperçu dans le Header
          </h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-gray-50 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-100">
            {/* Enterprise Logo */}
            {enterpriseLogo && (
              <img
                src={`${API_URL}${enterpriseLogo}${enterpriseLogo.includes('?') ? '&' : '?'}token=${localStorage.getItem('logitrack2_token')}`}
                alt="Logo entreprise"
                className="h-8 sm:h-10 w-auto object-contain flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {/* Client Logo */}
            {clientLogo && (
              <img
                src={`${API_URL}${clientLogo}${clientLogo.includes('?') ? '&' : '?'}token=${localStorage.getItem('logitrack2_token')}`}
                alt="Logo client"
                className="h-8 sm:h-10 w-auto object-contain flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {/* Separator */}
            {(enterpriseLogo || clientLogo) && (clientName || projectName) && (
              <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
            )}
            {/* Text */}
            <div className="min-w-0">
              {clientName && (
                <p className="text-sm font-bold text-gray-800 truncate">{clientName}</p>
              )}
              {(projectName || projectCode) && (
                <p className="text-xs text-gray-500 truncate">
                  {projectName}
                  {projectName && projectCode && '  '}
                  {projectCode && <span className="text-blue-600 font-semibold">({projectCode})</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
