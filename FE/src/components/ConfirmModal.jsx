import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Delete', loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/10 max-w-sm w-full p-6 animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-secondary hover:bg-surface transition-all">
          <X size={16} />
        </button>
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-danger" />
        </div>
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface text-secondary hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger text-white hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm shadow-danger/20"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Wait...
              </div>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
