import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const iconBg = variant === 'danger'
    ? 'bg-red-100 dark:bg-red-500/20'
    : 'bg-amber-100 dark:bg-amber-500/20';

  const iconColor = variant === 'danger'
    ? 'text-red-600 dark:text-red-400'
    : 'text-amber-600 dark:text-amber-400';

  const confirmBg = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-amber-600 hover:bg-amber-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 w-full max-w-md border border-[#1E1E2E]/10 dark:border-white/10 shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-[#1E1E2E]/40 dark:text-white/40 hover:text-[#1E1E2E] dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
          {variant === 'danger' ? (
            <Trash2 className={`w-6 h-6 ${iconColor}`} />
          ) : (
            <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
          )}
        </div>

        {/* Content */}
        <h2 className="text-xl font-semibold text-[#1E1E2E] dark:text-white mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
          {title}
        </h2>
        <p className="text-[#1E1E2E]/60 dark:text-white/60 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-[#1E1E2E]/10 dark:border-white/10 text-[#1E1E2E] dark:text-white font-medium rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 ${confirmBg} text-white font-medium rounded-xl transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
