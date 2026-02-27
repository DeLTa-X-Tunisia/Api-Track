import { useState, createContext, useContext, useCallback } from 'react';
import { AlertTriangle, Trash2, RefreshCw, CheckCircle, X, Info, HelpCircle } from 'lucide-react';

const CONFIRM_TYPES = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBg: 'bg-red-600 hover:bg-red-700',
    confirmText: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    confirmBg: 'bg-orange-500 hover:bg-orange-600',
    confirmText: 'text-white',
  },
  reset: {
    icon: RefreshCw,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBg: 'bg-amber-500 hover:bg-amber-600',
    confirmText: 'text-white',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    confirmBg: 'bg-green-600 hover:bg-green-700',
    confirmText: 'text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
    confirmText: 'text-white',
  },
  question: {
    icon: HelpCircle,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    confirmBg: 'bg-indigo-600 hover:bg-indigo-700',
    confirmText: 'text-white',
  },
};

const ConfirmContext = createContext(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    description: '',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback(({
    type = 'warning',
    title,
    message,
    description = '',
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type,
        title,
        message,
        description,
        confirmLabel,
        cancelLabel,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const confirmDelete = useCallback((itemName) => {
    return confirm({
      type: 'danger',
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer ${itemName} ?`,
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
  }, [confirm]);

  const confirmAction = useCallback((title, message) => {
    return confirm({
      type: 'question',
      title,
      message,
      confirmLabel: 'Confirmer',
      cancelLabel: 'Annuler',
    });
  }, [confirm]);

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete, confirmAction }}>
      {children}
      {modalState.isOpen && (
        <ConfirmModal
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          description={modalState.description}
          confirmLabel={modalState.confirmLabel}
          cancelLabel={modalState.cancelLabel}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

function ConfirmModal({
  type = 'warning',
  title,
  message,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  const config = CONFIRM_TYPES[type] || CONFIRM_TYPES.warning;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
        {/* Header avec icône */}
        <div className="flex items-start gap-4 p-6 pb-0">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-gray-600">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description optionnelle */}
        {description && (
          <div className="px-6 pt-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 p-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 ${config.confirmBg} ${config.confirmText} rounded-xl font-medium transition-colors`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
