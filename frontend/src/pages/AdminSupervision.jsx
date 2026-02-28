import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import socketService from '../services/socket';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { 
  Shield, 
  Users, 
  Wifi, 
  WifiOff, 
  Send, 
  UserX, 
  RefreshCw, 
  MessageSquare,
  Clock,
  Globe,
  ChevronDown,
  AlertTriangle,
  Info,
  AlertCircle,
  Megaphone,
  User,
  X,
  Radio,
  Power,
  CheckCircle
} from 'lucide-react';

// Role labels & colors
const ROLE_CONFIG = {
  system_admin: { label: 'Admin Système', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  admin: { label: 'Admin', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  superviseur: { label: 'Superviseur', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  consultant: { label: 'Consultant', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-500' },
};

const MESSAGE_TYPES = [
  { value: 'info', label: 'Information', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  { value: 'warning', label: 'Avertissement', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  { value: 'urgent', label: 'Urgent', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
];

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(isoString) {
  if (!isoString) return '-';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h${remainMins.toString().padStart(2, '0')}`;
}

export default function AdminSupervision() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm, confirmAction } = useConfirm();

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Message modal
  const [messageModal, setMessageModal] = useState({ open: false, target: null }); // target: null = broadcast
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Sent messages log
  const [sentMessages, setSentMessages] = useState([]);

  // Timer for durations
  const [, setTick] = useState(0);

  const mySocketId = socketService.getSocketId();

  // Fetch connected users
  const fetchUsers = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const { data } = await adminApi.getConnectedUsers();
      setConnectedUsers(data.users || []);
    } catch (err) {
      console.error('Erreur fetch connected users:', err);
      toast.error('Erreur lors du chargement des utilisateurs connectés');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const handleUserConnected = (userInfo) => {
      setConnectedUsers(prev => {
        const exists = prev.find(u => u.socketId === userInfo.socketId);
        if (exists) return prev;
        return [...prev, userInfo];
      });
    };

    const handleUserDisconnected = ({ socketId }) => {
      setConnectedUsers(prev => prev.filter(u => u.socketId !== socketId));
    };

    socketService.on('admin:user-connected', handleUserConnected);
    socketService.on('admin:user-disconnected', handleUserDisconnected);

    return () => {
      socketService.off('admin:user-connected', handleUserConnected);
      socketService.off('admin:user-disconnected', handleUserDisconnected);
    };
  }, []);

  // Update durations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Disconnect user
  const handleDisconnect = async (userInfo) => {
    const confirmed = await confirm({
      type: 'danger',
      title: 'Déconnecter l\'utilisateur',
      message: `Êtes-vous sûr de vouloir déconnecter ${userInfo.prenom} ${userInfo.nom} ?`,
      description: 'L\'utilisateur sera immédiatement déconnecté de Logi-Track.',
      confirmLabel: 'Déconnecter',
      cancelLabel: 'Annuler',
    });
    if (!confirmed) return;

    try {
      const { data } = await adminApi.disconnectUser(userInfo.socketId);
      toast.success(data.message);
      // Remove from list immediately
      setConnectedUsers(prev => prev.filter(u => u.socketId !== userInfo.socketId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la déconnexion');
    }
  };

  // Disconnect all
  const handleDisconnectAll = async () => {
    const otherUsers = connectedUsers.filter(u => u.socketId !== mySocketId);
    if (otherUsers.length === 0) {
      toast.info('Aucun autre utilisateur connecté');
      return;
    }

    const confirmed = await confirm({
      type: 'danger',
      title: 'Déconnecter tous les utilisateurs',
      message: `Êtes-vous sûr de vouloir déconnecter ${otherUsers.length} utilisateur(s) ?`,
      description: 'Tous les utilisateurs (sauf vous) seront immédiatement déconnectés.',
      confirmLabel: 'Tout déconnecter',
      cancelLabel: 'Annuler',
    });
    if (!confirmed) return;

    try {
      const { data } = await adminApi.disconnectAll();
      toast.success(data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la déconnexion');
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setSendingMessage(true);
    try {
      const payload = {
        message: messageText.trim(),
        type: messageType,
        broadcast: !messageModal.target,
        socketId: messageModal.target?.socketId || undefined,
      };
      const { data } = await adminApi.sendMessage(payload);
      toast.success(data.message);
      
      // Log sent message
      setSentMessages(prev => [{
        ...data.payload,
        targetName: messageModal.target 
          ? `${messageModal.target.prenom} ${messageModal.target.nom}`
          : 'Tous les utilisateurs',
      }, ...prev].slice(0, 50));

      setMessageModal({ open: false, target: null });
      setMessageText('');
      setMessageType('info');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setSendingMessage(false);
    }
  };

  // Stats
  const totalUsers = connectedUsers.length;
  const otherUsers = connectedUsers.filter(u => u.socketId !== mySocketId);
  const roleGroups = connectedUsers.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            Supervision Admin
          </h1>
          <p className="text-gray-500 mt-1">Gestion des connexions et communication en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => { setMessageModal({ open: true, target: null }); setMessageText(''); setMessageType('info'); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Diffuser un message</span>
            <span className="sm:hidden">Diffuser</span>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total connected */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              <p className="text-xs text-gray-500">Connecté{totalUsers > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Roles breakdown */}
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const count = roleGroups[role] || 0;
          if (count === 0 && role !== 'system_admin') return null;
          return (
            <div key={role} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                  <User className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>

      {/* Connected users table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="w-5 h-5 text-green-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Utilisateurs connectés
              <span className="ml-2 text-sm font-normal text-gray-400">({totalUsers})</span>
            </h2>
          </div>
          {otherUsers.length > 0 && (
            <button
              onClick={handleDisconnectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
              Tout déconnecter
            </button>
          )}
        </div>

        {connectedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <WifiOff className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">Aucun utilisateur connecté</p>
            <p className="text-sm">Les utilisateurs apparaîtront ici dès leur connexion</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">IP</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Connecté depuis</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Durée</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {connectedUsers.map((u) => {
                  const isMe = u.socketId === mySocketId;
                  const roleConf = ROLE_CONFIG[u.role] || ROLE_CONFIG.consultant;
                  return (
                    <tr key={u.socketId} className={`hover:bg-gray-50 transition-colors ${isMe ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-white">
                                {u.prenom?.[0]}{u.nom?.[0]}
                              </span>
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {u.prenom} {u.nom}
                              {isMe && <span className="ml-2 text-xs text-blue-500 font-normal">(vous)</span>}
                            </p>
                            <p className="text-xs text-gray-400">Code: {u.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConf.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${roleConf.dot}`} />
                          {roleConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          {u.ip?.replace('::ffff:', '') || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatTime(u.connectedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{formatDuration(u.connectedAt)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setMessageModal({ open: true, target: u }); setMessageText(''); setMessageType('info'); }}
                            title={`Envoyer un message à ${u.prenom}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {!isMe && (
                            <button
                              onClick={() => handleDisconnect(u)}
                              title={`Déconnecter ${u.prenom}`}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sent messages log */}
      {sentMessages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              Messages envoyés
              <span className="text-sm font-normal text-gray-400">({sentMessages.length})</span>
            </h2>
            <button
              onClick={() => setSentMessages([])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Effacer l'historique
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {sentMessages.map((msg, idx) => {
              const typeConf = MESSAGE_TYPES.find(t => t.value === msg.type) || MESSAGE_TYPES[0];
              const TypeIcon = typeConf.icon;
              return (
                <div key={msg.id || idx} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50">
                  <TypeIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${typeConf.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      → {msg.targetName} • {formatTime(msg.timestamp)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${typeConf.bg}`}>
                    {typeConf.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMessageModal({ open: false, target: null })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${messageModal.target ? 'bg-blue-100' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
                  {messageModal.target ? (
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Megaphone className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {messageModal.target ? 'Message privé' : 'Diffusion générale'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {messageModal.target 
                      ? `À : ${messageModal.target.prenom} ${messageModal.target.nom}` 
                      : `À : Tous les utilisateurs connectés (${totalUsers})`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModal({ open: false, target: null })}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-4">
              {/* Message type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type de message</label>
                <div className="flex gap-2">
                  {MESSAGE_TYPES.map((t) => {
                    const TIcon = t.icon;
                    const selected = messageType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setMessageType(t.value)}
                        className={`
                          flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                          ${selected 
                            ? `${t.bg} border-current shadow-sm` 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }
                        `}
                      >
                        <TIcon className={`w-4 h-4 ${selected ? t.color : ''}`} />
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message text */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Message</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Tapez votre message ici..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleSendMessage();
                    }
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">Ctrl+Entrée pour envoyer</p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setMessageModal({ open: false, target: null })}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendingMessage}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sendingMessage ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
