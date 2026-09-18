import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  isOpen,
  title,
  itemName,
  itemType,
  isDeleting,
  onConfirm,
  onCancel
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus data <span className="font-semibold text-slate-800">{itemType}</span>{' '}
              berikut secara permanen dari database Firebase Firestore?
            </p>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">Target Penghapusan:</span>
              <span className="text-sm font-bold text-slate-900 break-words">{itemName}</span>
            </div>
            <p className="text-xs text-rose-600 font-medium mt-2">
              Tindakan ini tidak dapat dibatalkan dan akan langsung memperbarui database produksi.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus Permanen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
