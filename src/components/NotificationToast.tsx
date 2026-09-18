import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Info, X } from 'lucide-react';
import { ToastFeedback } from '../types/shipping';

interface Props {
  toast: ToastFeedback | null;
  onDismiss: () => void;
}

export default function NotificationToast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast || toast.type === 'loading') return;
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'loading':
        return {
          bg: 'bg-white border-blue-200 text-blue-900',
          icon: <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />,
          accent: 'border-l-4 border-l-blue-600'
        };
      case 'success':
        return {
          bg: 'bg-white border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          accent: 'border-l-4 border-l-emerald-600'
        };
      case 'error':
        return {
          bg: 'bg-white border-rose-200 text-rose-900',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
          accent: 'border-l-4 border-l-rose-600'
        };
      case 'info':
      default:
        return {
          bg: 'bg-white border-slate-200 text-slate-900',
          icon: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
          accent: 'border-l-4 border-l-sky-600'
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`p-4 rounded-xl shadow-xl border ${style.bg} ${style.accent} flex items-start gap-3 relative overflow-hidden`}>
        {style.icon}
        <div className="flex-1 pr-2">
          <h4 className="font-semibold text-sm leading-tight mb-1">{toast.title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{toast.message}</p>
        </div>
        {toast.type !== 'loading' && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
