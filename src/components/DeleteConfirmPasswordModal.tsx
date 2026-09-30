import React, { useState } from 'react';
import { ShieldAlert, KeyRound, AlertTriangle, X, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface DeleteConfirmPasswordModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemCount?: number;
  onConfirm: (authRole: UserRole, authName: string) => Promise<void> | void;
  onClose: () => void;
}

export const DeleteConfirmPasswordModal: React.FC<DeleteConfirmPasswordModalProps> = ({
  isOpen,
  title,
  description,
  itemCount,
  onConfirm,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Normalize Arabic numerals to standard Latin numerals and trim
    let normalized = password
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .trim()
      .toLowerCase();

    let authorizedRole: UserRole | null = null;
    let authorizedName = 'المسؤول';

    if (
      normalized === 'wolf@it' || 
      normalized === '1122' || 
      normalized === 'it' || 
      normalized === 'wolfit'
    ) {
      authorizedRole = 'it';
      authorizedName = 'تقنية المعلومات IT (wolf@it)';
    } else if (
      normalized === 'wolf@acc' || 
      normalized === '3344' || 
      normalized === 'acc' || 
      normalized === 'accounting' || 
      normalized === 'wolfacc'
    ) {
      authorizedRole = 'accounting';
      authorizedName = 'قسم المحاسبة (wolf@acc)';
    } else if (
      normalized === 'wolf@car' || 
      normalized === '5566' || 
      normalized === 'car' || 
      normalized === 'showroom' || 
      normalized === 'wolfcar'
    ) {
      authorizedRole = 'showroom';
      authorizedName = 'قسم المعرض (wolf@car)';
    } else if (
      normalized === 'wolf@admin' || 
      normalized === 'wolf9988' || 
      normalized === '9988' || 
      normalized === 'admin'
    ) {
      authorizedRole = 'admin';
      authorizedName = 'General Administration (wolf@admin)';
    }

    if (!authorizedRole) {
      setError('Invalid password. Please enter your department password (e.g. wolf@it, wolf@car, wolf@acc, or wolf@admin).');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await onConfirm(authorizedRole, authorizedName);
      setPassword('');
      onClose();
    } catch (err) {
      setError('حدث خطأ أثناء تنفيذ عملية الحذف.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {title}
              </h3>
              <p className="text-xs text-rose-600 font-bold mt-0.5">
                تأكيد الحذف يتطلب إدخال كلمة المرور
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Box */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-4 text-xs font-semibold text-rose-800 leading-relaxed space-y-1">
          <p>{description}</p>
          {itemCount !== undefined && itemCount > 1 && (
            <p className="font-extrabold text-rose-900 pt-1">
              ⚠️ عدد العناصر التي سيتم حذفها: {itemCount} عنصر
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>أدخل كلمة المرور للتأكيد:</span>
              <span className="text-[10px] text-slate-400 font-normal">كلمة مرور أي قسم مصرح</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="أدخل كلمة المرور..."
                autoFocus
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-sans">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Authorized Department Credentials:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • <strong className="text-slate-800">IT Department:</strong> <code className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold">wolf@it</code> (or <code className="font-mono">1122</code>)
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong className="text-slate-800">Showroom Department:</strong> <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-mono font-bold">wolf@car</code> (or <code className="font-mono">5566</code>)
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong className="text-slate-800">Accounting Department:</strong> <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono font-bold">wolf@acc</code> (or <code className="font-mono">3344</code>)
            </p>
            <p className="text-[11px] leading-relaxed">
              • <strong className="text-slate-800">General Admin:</strong> <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded font-mono font-bold">wolf@admin</code> (or <code className="font-mono">wolf9988</code>)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isDeleting || !password.trim()}
              className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-rose-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
