import axios from 'axios';

// URL relative : fonctionne avec Vite proxy (dev) et Express (prod)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('logitrack2_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs (expiration token, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID') {
        localStorage.removeItem('logitrack2_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// API Auth
// ============================================
export const authApi = {
  login: (code) => api.post('/auth/login', { code }),
  me: () => api.get('/auth/me'),
};

// ============================================
// API Dashboard
// ============================================
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// ============================================
// API Utilisateurs
// ============================================
export const usersApi = {
  // CRUD utilisateurs
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  permanentDelete: (id) => api.delete(`/users/${id}?permanent=true`),
  activate: (id) => api.put(`/users/${id}/activate`),
  changeRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  regenerateCode: (id) => api.put(`/users/${id}/regenerate-code`),
  getStats: () => api.get('/users/stats'),

  // Entreprises
  getEntreprises: () => api.get('/users/entreprises'),
  addEntreprise: (data) => api.post('/users/entreprises', data),
  deleteEntreprise: (id) => api.delete(`/users/entreprises/${id}`),
};

// ============================================
// API Bobines en Stock
// ============================================
export const bobinesApi = {
  getAll: () => api.get('/bobines'),
  getById: (id) => api.get(`/bobines/${id}`),
  getStats: () => api.get('/bobines/stats'),
  create: (data) => api.post('/bobines', data),
  update: (id, data) => api.put(`/bobines/${id}`, data),
  delete: (id) => api.delete(`/bobines/${id}`),
  changeStatut: (id, statut) => api.put(`/bobines/${id}/statut`, { statut }),
  // Photos
  getPhotos: (id) => api.get(`/bobines/${id}/photos`),
  uploadPhotos: (id, formData) => api.post(`/bobines/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (id, photoId) => api.delete(`/bobines/${id}/photos/${photoId}`),
  // Grades
  getGrades: () => api.get('/bobines/ref/grades'),
  // Fournisseurs
  getFournisseurs: () => api.get('/bobines/ref/fournisseurs'),
  addFournisseur: (data) => api.post('/bobines/ref/fournisseurs', data),
  deleteFournisseur: (id) => api.delete(`/bobines/ref/fournisseurs/${id}`),
};

// ============================================
// API Paramètres de Soudure (Presets)
// ============================================
export const presetsApi = {
  getAll: () => api.get('/presets'),
  getById: (id) => api.get(`/presets/${id}`),
  getStats: () => api.get('/presets/stats'),
  create: (data) => api.post('/presets', data),
  update: (id, data) => api.put(`/presets/${id}`, data),
  delete: (id) => api.delete(`/presets/${id}`),
  copy: (id, data) => api.post(`/presets/${id}/copy`, data || {}),
  getNextCode: (diametre) => api.get(`/presets/next-code/${diametre}`),
  // Diamètres
  getDiametres: () => api.get('/presets/ref/diametres'),
};

// ============================================
// API Équipes de Production
// ============================================
export const equipesApi = {
  // Qualifications
  getQualifications: () => api.get('/equipes/qualifications'),
  createQualification: (data) => api.post('/equipes/qualifications', data),
  updateQualification: (id, data) => api.put(`/equipes/qualifications/${id}`, data),
  deleteQualification: (id) => api.delete(`/equipes/qualifications/${id}`),
  // Zones
  getZones: () => api.get('/equipes/zones'),
  createZone: (data) => api.post('/equipes/zones', data),
  updateZone: (id, data) => api.put(`/equipes/zones/${id}`, data),
  deleteZone: (id) => api.delete(`/equipes/zones/${id}`),
  hardDeleteZone: (id) => api.delete(`/equipes/zones/${id}/permanent`),
  // Personnel
  getPersonnel: () => api.get('/equipes/personnel'),
  getProchainMatricule: () => api.get('/equipes/personnel/prochain-matricule'),
  createPersonnel: (data) => api.post('/equipes/personnel', data),
  updatePersonnel: (id, data) => api.put(`/equipes/personnel/${id}`, data),
  deletePersonnel: (id) => api.delete(`/equipes/personnel/${id}`),
  hardDeletePersonnel: (id) => api.delete(`/equipes/personnel/${id}/permanent`),
  // Équipes
  getStats: () => api.get('/equipes/stats'),
  getAll: () => api.get('/equipes'),
  getById: (id) => api.get(`/equipes/${id}`),
  create: (data) => api.post('/equipes', data),
  update: (id, data) => api.put(`/equipes/${id}`, data),
  delete: (id) => api.delete(`/equipes/${id}`),
  hardDelete: (id) => api.delete(`/equipes/${id}/permanent`),
};

// ============================================
// API Lots (Bobine de Production)
// ============================================
export const lotsApi = {
  getAll: () => api.get('/lots'),
  getById: (id) => api.get(`/lots/${id}`),
  getStats: () => api.get('/lots/stats'),
  create: (data) => api.post('/lots', data),
  delete: (id) => api.delete(`/lots/${id}`),
  getProchainNumero: () => api.get('/lots/prochain-numero'),
  getBobinesDisponibles: () => api.get('/lots/bobines-disponibles'),
  getMotifsRetard: () => api.get('/lots/motifs-retard'),
  updateStep: (id, step, data) => api.put(`/lots/${id}/${step}`, data),
  validationRapide: (id) => api.put(`/lots/${id}/validation-rapide`),
  updateParametres: (id, data) => api.put(`/lots/${id}/parametres`, data),
};

// ============================================
// API Tubes
// ============================================
export const tubesApi = {
  getAll: (params) => api.get('/tubes', { params }),
  getById: (id) => api.get(`/tubes/${id}`),
  getStats: () => api.get('/tubes/stats'),
  getProchainNumero: () => api.get('/tubes/prochain-numero'),
  create: (data) => api.post('/tubes', data),
  delete: (id) => api.delete(`/tubes/${id}`),
  // Étapes
  validerEtape: (id, data) => api.put(`/tubes/${id}/valider-etape`, data),
  nonConforme: (id, data) => api.put(`/tubes/${id}/non-conforme`, data),
  resoudreNC: (id, data) => api.put(`/tubes/${id}/resoudre-nc`, data),
  reparerEtape: (id, data) => api.put(`/tubes/${id}/reparer-etape`, data),
  resoudreReparation: (id, data) => api.put(`/tubes/${id}/resoudre-reparation`, data),
  interrompreEtape: (id, data) => api.put(`/tubes/${id}/interrompre-etape`, data),
  reprendreEtape: (id, data) => api.put(`/tubes/${id}/reprendre-etape`, data),
  reviserRebut: (id, data) => api.put(`/tubes/${id}/reviser-rebut`, data),
  sauterEtape: (id, data) => api.put(`/tubes/${id}/sauter-etape`, data),
  annulerEtape: (id, data) => api.put(`/tubes/${id}/annuler-etape`, data),
  validerOffline: (id, data) => api.put(`/tubes/${id}/valider-offline`, data),
  debutDecision: (id) => api.put(`/tubes/${id}/debut-decision`),
  decision: (id, data) => api.put(`/tubes/${id}/decision`, data),
  // Photos
  getPhotos: (id, etape) => api.get(`/tubes/${id}/etape/${etape}/photos`),
  uploadPhotos: (id, etape, formData) => api.post(`/tubes/${id}/etape/${etape}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (id, photoId) => api.delete(`/tubes/${id}/photos/${photoId}`),
  // Historique & PDF
  getHistorique: (id) => api.get(`/tubes/${id}/etape-historique`),
  getPDF: (id) => api.get(`/tubes/${id}/pdf`, { responseType: 'blob' }),
  // Responsabilités
  getResponsabilites: () => api.get('/tubes/responsabilites/list'),
};

// ============================================
// API Responsabilités (CRUD complet)
// ============================================
export const responsabilitesApi = {
  getAll: () => api.get('/tubes/responsabilites/list'),
  create: (data) => api.post('/tubes/responsabilites', data),
  update: (id, data) => api.put(`/tubes/responsabilites/${id}`, data),
  delete: (id) => api.delete(`/tubes/responsabilites/${id}`),
};

// ============================================
// API Settings (Paramètres du projet)
// ============================================
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getByCategory: (category) => api.get(`/settings/by-category/${category}`),
  updateBulk: (settings) => api.put('/settings/bulk', { settings }),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  uploadLogo: (type, formData) => api.post(`/settings/upload-logo/${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteLogo: (type) => api.delete(`/settings/delete-logo/${type}`),
};

// ============================================
// API Rapports & Export
// ============================================
export const reportsApi = {
  getStats: () => api.get('/reports/stats'),
  downloadSituationGenerale: () => api.get('/reports/situation-generale', { responseType: 'blob' }),
};

// ============================================
// API Admin Supervision
// ============================================
export const adminApi = {
  getConnectedUsers: () => api.get('/admin/connected-users'),
  disconnectUser: (socketId) => api.post('/admin/disconnect-user', { socketId }),
  disconnectAll: () => api.post('/admin/disconnect-all'),
  sendMessage: (data) => api.post('/admin/send-message', data),
};

// Export par défaut pour usage générique
export default api;
