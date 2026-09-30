import React, { useState } from 'react';
import { CarCategory } from '../types';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Car, 
  ShieldCheck, 
  Check, 
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface CategoryOrderModalProps {
  categories: CarCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (reordered: CarCategory[]) => Promise<void> | void;
  onResetDefaultOrder?: () => void;
}

export const CategoryOrderModal: React.FC<CategoryOrderModalProps> = ({
  categories,
  isOpen,
  onClose,
  onSaveOrder,
  onResetDefaultOrder
}) => {
  const [orderedCats, setOrderedCats] = useState<CarCategory[]>(() => [...categories]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if categories change while opening
  React.useEffect(() => {
    setOrderedCats([...categories]);
    setSaveSuccess(false);
  }, [categories, isOpen]);

  if (!isOpen) return null;

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= orderedCats.length) return;

    const copy = [...orderedCats];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setOrderedCats(copy);
  };

  const moveToTop = (index: number) => {
    if (index === 0) return;
    const copy = [...orderedCats];
    const [item] = copy.splice(index, 1);
    copy.unshift(item);
    setOrderedCats(copy);
  };

  const moveToBottom = (index: number) => {
    if (index === orderedCats.length - 1) return;
    const copy = [...orderedCats];
    const [item] = copy.splice(index, 1);
    copy.push(item);
    setOrderedCats(copy);
  };

  const changePosition = (currentIndex: number, newPositionIndex: number) => {
    if (newPositionIndex < 0 || newPositionIndex >= orderedCats.length || currentIndex === newPositionIndex) return;
    const copy = [...orderedCats];
    const [item] = copy.splice(currentIndex, 1);
    copy.splice(newPositionIndex, 0, item);
    setOrderedCats(copy);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveOrder(orderedCats);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600 border border-orange-200 shrink-0">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                ترتيب أقسام السيارات في الهيدر الرئيسي
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                حدد الترتيب الدقيق للأقسام وتعيين الأول والثاني والثالث. يحفظ الترتيب مباشرة في قاعدة البيانات.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Header Bar Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>معاينة شريط الهيدر العلوي وفقاً للترتيب الحالي:</span>
            </span>
            <span className="text-slate-400">({orderedCats.length} أقسام)</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-1">
            {orderedCats.map((cat, idx) => {
              const isProtection = cat.id === 'cat-protection-tint' || cat.name.includes('الحماية');
              const isFirst = idx === 0;
              return (
                <div
                  key={cat.id}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                    isFirst
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-500/20'
                      : isProtection
                      ? 'bg-orange-50 text-orange-950 border-orange-200'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                    isFirst ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{cat.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories List (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pl-1 scrollbar-thin">
          {orderedCats.map((cat, idx) => {
            const isProtection = cat.id === 'cat-protection-tint' || cat.name.includes('الحماية');
            const isFirst = idx === 0;
            const isLast = idx === orderedCats.length - 1;

            return (
              <div
                key={cat.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-2.5 ${
                  isFirst
                    ? 'border-orange-300 bg-orange-50/30 shadow-xs'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                {/* Right: Order number badge & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                    isFirst 
                      ? 'bg-orange-600 text-white ring-2 ring-orange-200' 
                      : 'bg-slate-900 text-white'
                  }`}>
                    {idx + 1}
                  </span>

                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {isProtection ? (
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Car className="w-4 h-4 text-slate-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        {cat.name}
                      </h4>
                      {isFirst && (
                        <span className="text-[10px] bg-orange-600 text-white font-extrabold px-2 py-0.5 rounded-full shrink-0">
                          القسم الأول
                        </span>
                      )}
                    </div>
                    {cat.carModel && cat.carModel !== cat.name && (
                      <span className="text-[10px] text-slate-400 font-semibold block truncate">
                        {cat.carModel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Left: Direct Order Dropdown & Reorder Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  {/* Position Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                      الترتيب:
                    </span>
                    <select
                      value={idx + 1}
                      onChange={(e) => changePosition(idx, Number(e.target.value) - 1)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
                      title="حدد موقع هذا القسم مباشرة"
                    >
                      {orderedCats.map((_, pIdx) => (
                        <option key={pIdx + 1} value={pIdx + 1}>
                          {pIdx + 1} {pIdx === 0 ? '(الأول)' : pIdx === orderedCats.length - 1 ? '(الأخير)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Move Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveToTop(idx)}
                      disabled={isFirst}
                      className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-orange-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                      title="نقل للبداية ليكون القسم الأول"
                    >
                      الأول
                    </button>

                    <button
                      onClick={() => moveCategory(idx, 'up')}
                      disabled={isFirst}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => moveCategory(idx, 'down')}
                      disabled={isLast}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => moveToBottom(idx)}
                      disabled={isLast}
                      className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-orange-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
                      title="نقل للنهاية ليكون القسم الأخير"
                    >
                      الأخير
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          {onResetDefaultOrder ? (
            <button
              onClick={() => {
                if (confirm('هل تريد إعادة تعيين ترتيب الأقسام للوضع الافتراضي؟')) {
                  onResetDefaultOrder();
                  onClose();
                }
              }}
              className="text-xs text-slate-500 hover:text-orange-600 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>الترتيب الافتراضي</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-bounce" />
                  <span>تم حفظ الترتيب بنجاح!</span>
                </>
              ) : isSaving ? (
                <span>جاري الحفظ بالسحابة...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ الترتيب الجديد</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
