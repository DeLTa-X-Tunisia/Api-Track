import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Package, Trash2, Edit2, BarChart3, Scale, Layers, 
  Calendar, Camera, Upload, X, Eye, Filter 
} from 'lucide-react';
import { bobinesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || '';

/** Build a photo URL with auth token for <img> tags */
const getPhotoUrl = (photoPath) => {
  const token = localStorage.getItem('logitrack2_token');
  return `${API_URL}${photoPath}${token ? `?token=${token}` : ''}`;
};

const NORMES = ['API 5L', 'API 5CT', 'ASTM A53', 'EN 10219', 'ISO 3183'];

export default function BobinesEnStock() {
  const { user, canAct } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  const fileInputRef = useRef(null);

  const [bobines, setBobines] = useState([]);
  const [grades, setGrades] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBobine, setEditingBobine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [viewingBobine, setViewingBobine] = useState(null);
  const [viewPhotos, setViewPhotos] = useState([]);
  const [showFournisseurModal, setShowFournisseurModal] = useState(false);
  const [newFournisseurNom, setNewFournisseurNom] = useState('');

  const emptyForm = {
    numero: '', norme: 'API 5L', grade: '', epaisseur: '', largeur: '', poids: '',
    fournisseur: '', date_reception: '', notes: ''
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [bobinesRes, statsRes, gradesRes] = await Promise.all([
        bobinesApi.getAll(),
        bobinesApi.getStats(),
        bobinesApi.getGrades()
      ]);
      setBobines(bobinesRes.data);
      setStats(statsRes.data);
      setGrades(gradesRes.data);
      try {
        const fRes = await bobinesApi.getFournisseurs();
        setFournisseurs(fRes.data);
      } catch (e) { console.error('Erreur chargement fournisseurs:', e); }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // ============ CRUD ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let bobineId = editingBobine?.id;
      if (editingBobine) {
        await bobinesApi.update(editingBobine.id, formData);
        if (previewPhotos.length > 0) await uploadPhotos(editingBobine.id);
        toast.success('Bobine modifiée avec succès');
      } else {
        const res = await bobinesApi.create(formData);
        bobineId = res.data.id;
        if (previewPhotos.length > 0 && bobineId) await uploadPhotos(bobineId);
        toast.success('Bobine créée avec succès');
      }
      setShowModal(false);
      setEditingBobine(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (bobine) => {
    setEditingBobine(bobine);
    setFormData({
      numero: bobine.numero || '',
      norme: bobine.norme || 'API 5L',
      grade: bobine.grade || '',
      epaisseur: bobine.epaisseur || '',
      largeur: bobine.largeur || '',
      poids: bobine.poids || '',
      fournisseur: bobine.fournisseur || '',
      date_reception: bobine.date_reception?.split('T')[0] || '',
      notes: bobine.notes || ''
    });
    loadPhotos(bobine.id);
    setShowModal(true);
  };

  const handleDelete = async (bobine) => {
    const confirmed = await confirm({
      type: 'danger',
      title: `Supprimer ${bobine.numero} ?`,
      message: 'Cette action est irréversible. La bobine et ses photos seront définitivement supprimées.',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler'
    });
    if (!confirmed) return;
    try {
      await bobinesApi.delete(bobine.id);
      toast.success('Bobine supprimée avec succès');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleView = async (bobine) => {
    try {
      const res = await bobinesApi.getById(bobine.id);
      setViewingBobine(res.data);
      const photosRes = await bobinesApi.getPhotos(bobine.id);
      setViewPhotos(photosRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setPhotos([]);
    setPreviewPhotos([]);
  };

  // ============ PHOTOS ============
  const loadPhotos = async (bobineId) => {
    try {
      const res = await bobinesApi.getPhotos(bobineId);
      setPhotos(res.data);
    } catch (error) {
      console.error('Erreur chargement photos:', error);
      setPhotos([]);
    }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalPhotos = photos.length + previewPhotos.length + files.length;
    if (totalPhotos > 5) {
      toast.error(`Maximum 5 photos. Vous avez déjà ${photos.length + previewPhotos.length} photo(s).`);
      return;
    }
    const newPreviews = files.map(file => ({
      file, preview: URL.createObjectURL(file), name: file.name
    }));
    setPreviewPhotos(prev => [...prev, ...newPreviews]);
  };

  const removePreviewPhoto = (index) => {
    setPreviewPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadPhotos = async (bobineId) => {
    if (previewPhotos.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      previewPhotos.forEach(p => fd.append('photos', p.file));
      await bobinesApi.uploadPhotos(bobineId, fd);
      toast.success(`${previewPhotos.length} photo(s) uploadée(s)`);
      previewPhotos.forEach(p => URL.revokeObjectURL(p.preview));
      setPreviewPhotos([]);
      await loadPhotos(bobineId);
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!editingBobine) return;
    try {
      await bobinesApi.deletePhoto(editingBobine.id, photoId);
      toast.success('Photo supprimée');
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error) {
      toast.error('Erreur lors de la suppression de la photo');
    }
  };

  // ============ FILTRES ============
  const filteredBobines = bobines.filter(b => {
    const matchSearch = (b.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.grade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.fournisseur || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || b.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatusBadge = (statut) => {
    const badges = {
      'en_stock': { cls: 'bg-success-100 text-success-800', label: 'Disponible' },
      'en_cours': { cls: 'bg-primary-100 text-primary-800', label: 'En cours' },
      'epuisee': { cls: 'bg-gray-100 text-gray-600', label: 'Épuisée' }
    };
    return badges[statut] || { cls: 'bg-gray-100 text-gray-800', label: statut || 'Disponible' };
  };

  const formatPoids = (poids) => {
    if (!poids) return '-';
    return new Intl.NumberFormat('fr-FR').format(poids) + ' kg';
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bobines en Stock</h1>
          <p className="text-gray-500 mt-1">Gestion des bobines de matière première</p>
        </div>
        {canAct && (
          <button 
            onClick={() => { resetForm(); setEditingBobine(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle bobine
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-100">
              <Layers className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Disponibles</p>
              <p className="text-3xl font-bold text-success-600">{stats.en_stock || 0}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">En production</p>
              <p className="text-3xl font-bold text-primary-600">{stats.en_cours || 0}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-100">
              <Scale className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Poids total</p>
              <p className="text-3xl font-bold text-gray-600">
                {stats.poids_total ? `${(Number(stats.poids_total) / 1000).toFixed(1)} t` : '0 t'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code, grade, fournisseur..."
              className="input-field pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field w-full md:w-48"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="en_stock">Disponible</option>
            <option value="en_cours">En cours</option>
            <option value="epuisee">Épuisée</option>
          </select>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="card overflow-hidden p-0 hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code Bobine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Norme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Épaisseur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poids</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé par</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBobines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    Aucune bobine trouvée
                  </td>
                </tr>
              ) : (
                filteredBobines.map(bobine => (
                  <tr key={bobine.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary-600">{bobine.numero}</td>
                    <td className="px-6 py-4 text-gray-600">{bobine.norme || '-'}</td>
                    <td className="px-6 py-4">
                      {bobine.grade ? <span className="font-medium text-gray-900">{bobine.grade}</span> : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{bobine.epaisseur} mm</td>
                    <td className="px-6 py-4 text-gray-600">{formatPoids(bobine.poids)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(bobine.statut).cls}`}>
                        {getStatusBadge(bobine.statut).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {bobine.createur_prenom && bobine.createur_nom 
                        ? `${bobine.createur_prenom} ${bobine.createur_nom.charAt(0)}.`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleView(bobine)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {canAct && (
                          <>
                            <button 
                              onClick={() => handleEdit(bobine)}
                              className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Modifier"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(bobine)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredBobines.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            Aucune bobine trouvée
          </div>
        ) : (
          filteredBobines.map(bobine => (
            <div key={bobine.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-100">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-600">{bobine.numero}</p>
                    <p className="text-xs text-gray-500">{bobine.norme || '-'} {bobine.grade ? `· ${bobine.grade}` : ''}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(bobine.statut).cls}`}>
                  {getStatusBadge(bobine.statut).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-gray-400">Épaisseur</span>
                  <p className="font-medium text-gray-700">{bobine.epaisseur} mm</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Poids</span>
                  <p className="font-medium text-gray-700">{formatPoids(bobine.poids)}</p>
                </div>
              </div>
              {bobine.fournisseur && (
                <p className="text-xs text-gray-500">Fournisseur: {bobine.fournisseur}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {bobine.createur_prenom ? `${bobine.createur_prenom} ${bobine.createur_nom?.charAt(0)}.` : '-'}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleView(bobine)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                  {canAct && (
                    <>
                      <button onClick={() => handleEdit(bobine)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(bobine)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL FORMULAIRE CREATE / EDIT               */}
      {/* ============================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBobine ? 'Modifier la bobine' : 'Nouvelle bobine'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Opérateur : {user?.prenom} {user?.nom}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code Bobine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code bobine *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: BOB-2026-001"
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  required
                />
              </div>

              {/* Norme + Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Norme</label>
                  <select
                    className="input-field"
                    value={formData.norme}
                    onChange={(e) => setFormData({...formData, norme: e.target.value})}
                  >
                    {NORMES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Nuance</label>
                  <select
                    className="input-field"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  >
                    <option value="">— Sélectionner —</option>
                    {Object.entries(
                      grades.reduce((acc, g) => {
                        const norme = g.norme || 'Autre';
                        if (!acc[norme]) acc[norme] = [];
                        acc[norme].push(g);
                        return acc;
                      }, {})
                    ).map(([norme, items]) => (
                      <optgroup key={norme} label={norme}>
                        {items.map(g => (
                          <option key={g.id} value={g.code}>{g.code} - {g.nom}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Épaisseur + Largeur + Poids */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Épaisseur (mm) *</label>
                  <input
                    type="number" step="0.01" className="input-field" placeholder="Ex: 12"
                    value={formData.epaisseur}
                    onChange={(e) => setFormData({...formData, epaisseur: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Largeur (mm)</label>
                  <input
                    type="number" step="0.01" className="input-field" placeholder="Ex: 1500"
                    value={formData.largeur}
                    onChange={(e) => setFormData({...formData, largeur: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
                  <input
                    type="number" step="0.01" className="input-field" placeholder="Ex: 31600"
                    value={formData.poids}
                    onChange={(e) => setFormData({...formData, poids: e.target.value})}
                  />
                </div>
              </div>

              {/* Fournisseur + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                  <div className="flex gap-2">
                    <select
                      className="input-field flex-1"
                      value={formData.fournisseur}
                      onChange={(e) => setFormData({...formData, fournisseur: e.target.value})}
                    >
                      <option value="">— Sélectionner —</option>
                      {fournisseurs.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowFournisseurModal(true)}
                      className="flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
                      title="Gérer les fournisseurs"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de réception</label>
                  <input
                    type="date" className="input-field"
                    value={formData.date_reception}
                    onChange={(e) => setFormData({...formData, date_reception: e.target.value})}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input-field" rows="3"
                  placeholder="Commentaires, observations..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Photos ({photos.length + previewPhotos.length}/5)
                </label>
                
                {/* Photos existantes */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {photos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={getPhotoUrl(photo.path)}
                          alt={photo.original_name}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previews */}
                {previewPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {previewPhotos.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={preview.preview}
                          alt={preview.name}
                          className="w-full h-20 object-cover rounded-lg border-2 border-primary-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePreviewPhoto(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-primary-500/80 text-white text-xs text-center py-0.5 rounded-b-lg">
                          Nouveau
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {photos.length + previewPhotos.length < 5 && (
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Ajouter des photos (max {5 - photos.length - previewPhotos.length})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => { setShowModal(false); setEditingBobine(null); }}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingBobine ? 'Modifier' : 'Créer la bobine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL VOIR DÉTAILS                           */}
      {/* ============================================ */}
      {viewingBobine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Détails de la bobine</h2>
                <p className="text-primary-600 font-semibold">{viewingBobine.numero}</p>
              </div>
              <button onClick={() => setViewingBobine(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Informations générales
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500">Code Bobine</p>
                    <p className="font-semibold text-gray-900">{viewingBobine.numero}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Norme</p>
                    <p className="font-semibold text-gray-900">{viewingBobine.norme || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Grade / Nuance</p>
                    <p className="font-semibold text-gray-900">{viewingBobine.grade || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(viewingBobine.statut).cls}`}>
                      {getStatusBadge(viewingBobine.statut).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Caractéristiques techniques */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4" /> Caractéristiques techniques
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500">Épaisseur</p>
                    <p className="font-semibold text-gray-900">{viewingBobine.epaisseur ? `${viewingBobine.epaisseur} mm` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Largeur</p>
                    <p className="font-semibold text-gray-900">{viewingBobine.largeur ? `${viewingBobine.largeur} mm` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Poids</p>
                    <p className="font-semibold text-gray-900">{viewingBobine.poids ? formatPoids(viewingBobine.poids) : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Fournisseur et réception */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Fournisseur & Réception
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500">Fournisseur</p>
                    <p className="font-semibold text-gray-900">{viewingBobine.fournisseur || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date de réception</p>
                    <p className="font-semibold text-gray-900">
                      {viewingBobine.date_reception 
                        ? new Date(viewingBobine.date_reception).toLocaleDateString('fr-FR')
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingBobine.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingBobine.notes}</p>
                  </div>
                </div>
              )}

              {/* Photos */}
              {viewPhotos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Photos ({viewPhotos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {viewPhotos.map(photo => (
                      <a key={photo.id} href={getPhotoUrl(photo.path)} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={getPhotoUrl(photo.path)}
                          alt={photo.original_name}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:border-primary-400 transition-colors"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Traçabilité */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Traçabilité
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500">Créé par</p>
                    <p className="font-semibold text-gray-900">
                      {viewingBobine.createur_prenom && viewingBobine.createur_nom 
                        ? `${viewingBobine.createur_prenom} ${viewingBobine.createur_nom}`
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date de création</p>
                    <p className="font-semibold text-gray-900">
                      {viewingBobine.created_at ? new Date(viewingBobine.created_at).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  {viewingBobine.modificateur_prenom && viewingBobine.modificateur_nom && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500">Modifié par</p>
                        <p className="font-semibold text-gray-900">
                          {`${viewingBobine.modificateur_prenom} ${viewingBobine.modificateur_nom}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Dernière modification</p>
                        <p className="font-semibold text-gray-900">
                          {viewingBobine.updated_at ? new Date(viewingBobine.updated_at).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setViewingBobine(null)} className="btn-secondary w-full">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL GESTION FOURNISSEURS                   */}
      {/* ============================================ */}
      {showFournisseurModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fadeIn max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Gérer les fournisseurs</h3>
              <button onClick={() => { setShowFournisseurModal(false); setNewFournisseurNom(''); }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newFournisseurNom.trim()) return;
              try {
                const res = await bobinesApi.addFournisseur({ nom: newFournisseurNom.trim() });
                const newF = res.data;
                const fRes = await bobinesApi.getFournisseurs();
                setFournisseurs(fRes.data);
                setFormData(prev => ({ ...prev, fournisseur: newF.nom }));
                setNewFournisseurNom('');
                toast.success('Fournisseur ajouté');
              } catch (error) {
                toast.error(error.response?.data?.error || 'Erreur lors de la création');
              }
            }} className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du fournisseur</label>
              <div className="flex gap-2">
                <input
                  type="text" className="input-field flex-1" placeholder="Ex: ArcelorMittal"
                  value={newFournisseurNom} onChange={(e) => setNewFournisseurNom(e.target.value)} autoFocus required
                />
                <button type="submit" className="btn-primary px-4"><Plus size={18} /></button>
              </div>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                Fournisseurs existants ({fournisseurs.length})
              </p>
              {fournisseurs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun fournisseur</p>
              ) : (
                <div className="space-y-1">
                  {fournisseurs.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 group">
                      <span className="text-sm font-medium text-gray-800">{f.nom}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = await confirm({
                            type: 'danger',
                            title: 'Supprimer le fournisseur',
                            message: `Êtes-vous sûr de vouloir supprimer "${f.nom}" ?`,
                            description: 'Cette action est définitive.',
                            confirmLabel: 'Supprimer',
                            cancelLabel: 'Annuler'
                          });
                          if (!confirmed) return;
                          try {
                            await bobinesApi.deleteFournisseur(f.id);
                            const fRes = await bobinesApi.getFournisseurs();
                            setFournisseurs(fRes.data);
                            if (formData.fournisseur === f.nom) {
                              setFormData(prev => ({ ...prev, fournisseur: '' }));
                            }
                            toast.success('Fournisseur supprimé');
                          } catch (error) {
                            toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
                          }
                        }}
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

            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => { setShowFournisseurModal(false); setNewFournisseurNom(''); }} className="btn-secondary w-full">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
