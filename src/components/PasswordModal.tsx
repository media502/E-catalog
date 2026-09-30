import React, { useState } from 'react';
import { Lock, KeyRound, X, AlertCircle, ArrowLeft, ShieldCheck, Laptop, Car, Calculator, UserCheck, HelpCircle } from 'lucide-react';
import { UserSession } from '../types';

interface PasswordModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onAuthenticated?: (session: UserSession) => void;
  onSuccess?: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen = true,
  onClose,
  onAuthenticated,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim();

    let session: UserSession | null = null;

    if (cleanPass === 'wolf@it' || cleanPass === '1122') {
      session = {
        role: 'it',
        displayName: 'IT Department (تقنية المعلومات)',
        username: 'wolf@it',
        loginTime: new Date().toISOString(),
      };
    } else if (cleanPass === 'wolf@car' || cleanPass === '5566') {
      session = {
        role: 'showroom',
        displayName: 'Showroom Department (قسم المعرض)',
        username: 'wolf@car',
        loginTime: new Date().toISOString(),
      };
    } else if (cleanPass === 'wolf@acc' || cleanPass === '3344') {
      session = {
        role: 'accounting',
        displayName: 'Accounting Department (قسم المحاسبة)',
        username: 'wolf@acc',
        loginTime: new Date().toISOString(),
      };
    } else if (
      cleanPass === 'wolf@admin' || 
      cleanPass === 'wolf9988' || 
      cleanPass === '9988' || 
      cleanPass === 'admin'
    ) {
      session = {
        role: 'admin',
        displayName: 'General Administration (الإدارة العامة)',
        username: 'wolf@admin',
        loginTime: new Date().toISOString(),
      };
    }

    if (session) {
      setError(false);
      if (onAuthenticated) {
        onAuthenticated(session);
      } else if (onSuccess) {
        onSuccess();
      }
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right font-sans animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">تسجيل دخول الموظفين</h3>
              <p className="text-slate-400 text-xs">أدخل كلمة مرور القسم للمتابعة وتوثيق العمليات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة المرور الخاصة بقسمك:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="أدخل كلمة المرور..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-left font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>كلمة المرور غير صحيحة. يرجى التأكد من كتابتها بشكل صحيح.</span>
            </div>
          )}

          {/* Clean Role Guide (Without exposing passwords) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
              <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
              <span>أقسام النظام المعتمدة:</span>
            </div>
            
            <p className="text-[11px] text-slate-600 leading-relaxed">
              يتوفر في النظام <strong className="text-slate-800">3 أقسام رئيسية</strong> (قسم المحاسبة، قسم المعرض، قسم تقنية المعلومات IT)، ولكل قسم كلمة المرور الخاصة به ليتم توثيق أي إضافة أو تعديل باسم القسم مباشرة في سجل الحركات.
            </p>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-center">
                <Calculator className="w-3.5 h-3.5 text-emerald-700 mx-auto mb-1" />
                <span className="font-bold text-emerald-900 text-[10px] block">قسم المحاسبة</span>
              </div>

              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-center">
                <Car className="w-3.5 h-3.5 text-amber-700 mx-auto mb-1" />
                <span className="font-bold text-amber-900 text-[10px] block">قسم المعرض</span>
              </div>

              <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200 text-center">
                <Laptop className="w-3.5 h-3.5 text-indigo-700 mx-auto mb-1" />
                <span className="font-bold text-indigo-900 text-[10px] block">تقنية المعلومات IT</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <span>دخول وتأكيد</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
