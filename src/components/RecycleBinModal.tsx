import React, { useState } from 'react';
import { DeletedProduct, CarCategory, UserRole } from '../types';
import { BarcodeSvg } from './BarcodeSvg';
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  X,
  Search,
  Check,
  ShieldAlert,
  Folder,
  Tag,
  AlertCircle
} from 'lucide-react';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedProducts: DeletedProduct[];
  categories: CarCategory[];
  onRestoreProduct: (deletedItem: DeletedProduct) => Promise<void>;
  onHardDeleteProduct: (deletedItem: DeletedProduct) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
  onViewImage?: (imageUrl: string, title?: string) => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  deletedProducts,
  categories,
  onRestoreProduct,
  onHardDeleteProduct,
  onEmptyTrash,
  onViewImage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState('');

  if (!isOpen) return null;

  const getDaysRemaining = (expiresAtStr: string): { days: number; text: string; isNearExpiry: boolean } => {
    try {
      const now = new Date().getTime();
      const expires = new Date(expiresAtStr).getTime();
      const diffMs = expires - now;
      if (diffMs <= 0) {
        return { days: 0, text: 'منتهي الصلاحية (سيُحذف تلقائياً)', isNearExpiry: true };
      }
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

      if (days > 0) {
        return { 
          days, 
          text: `متبقي ${days} يوم و ${hours} ساعة`, 
          isNearExpiry: days <= 3 
        };
      }
      return { 
        days: 0, 
        text: `متبقي ${hours} ساعة فقط`, 
        isNearExpiry: true 
      };
    } catch {
      return { days: 30, text: 'متبقي 30 يوم', isNearExpiry: false };
    }
  };

  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || 'القسم المحذوف / عام';
  };

  const filteredItems = deletedProducts.filter((item) => {
    const p = item.originalProduct;
    const matchesCat = selectedFilterCategory === 'all' || p.categoryId === selectedFilterCategory;
    const matchesQuery = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.barcode.includes(searchQuery.trim());
    return matchesCat && matchesQuery;
  });

  const handleRestore = async (item: DeletedProduct) => {
    setIsRestoringId(item.id);
    try {
      await onRestoreProduct(item);
      setActionSuccessNotice(`✅ تمت استعادة المنتج (${item.originalProduct.name}) بنجاح إلى قسمه (${getCategoryName(item.originalProduct.categoryId)})!`);
      setTimeout(() => setActionSuccessNotice(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRestoringId(null);
    }
  };

  const handleHardDelete = async (item: DeletedProduct) => {
    setIsDeletingId(item.id);
    try {
      await onHardDeleteProduct(item);
      setActionSuccessNotice(`🗑️ تم الحذف النهائي للمنتج (${item.originalProduct.name}) من قاعدة البيانات!`);
      setTimeout(() => setActionSuccessNotice(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">سلة المحذوفات السحابية (Recycle Bin)</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {deletedProducts.length} منتج محذوف
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>تبقى المنتجات المحذوفة محفوظة لمدة 30 يوماً قبل مسحها التلقائي، ويمكنك استعادتها لأقسامها في أي لحظة.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deletedProducts.length > 0 && (
              <button
                type="button"
                onClick={onEmptyTrash}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إفراغ السلة بالكامل</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionSuccessNotice && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessNotice}</span>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في المحذوفات بالاسم أو الباركود..."
              className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 shrink-0">تصفية حسب القسم:</span>
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-rose-500 w-full sm:w-auto"
            >
              <option value="all">جميع الأقسام ({deletedProducts.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({deletedProducts.filter(d => d.originalProduct.categoryId === c.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Trash2 className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-bold text-slate-600">
                {deletedProducts.length === 0 ? 'سلة المحذوفات فارغة حالياً' : 'لا توجد عناصر مطابقة لخيارات البحث'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                عند حذف أي منتج من الكتالوج سيتم الاحتفاظ به هنا لمدة 30 يوماً تلقائياً لتمكين استرجاعه.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const p = item.originalProduct;
                const expiry = getDaysRemaining(item.expiresAt);
                const catName = getCategoryName(p.categoryId);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 text-right"
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail with Click to View */}
                      <div 
                        onClick={() => p.imageUrl && onViewImage && onViewImage(p.imageUrl, p.name)}
                        className={`w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 ${p.imageUrl ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Tag className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {catName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            expiry.isNearExpiry 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{expiry.text}</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-1">
                          {p.name}
                        </h4>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-mono">
                          <span>الباركود: <strong className="text-slate-800">{p.barcode}</strong></span>
                          <span>السعر: <strong className="text-orange-600">{p.price} QAR</strong></span>
                        </div>

                        <div className="text-[10px] text-slate-400 mt-1">
                          حذفه: <span className="font-bold text-slate-600">{item.deletedBy || 'المسؤول'}</span> ({new Date(item.deletedAt).toLocaleDateString('ar-QA')} {new Date(item.deletedAt).toLocaleTimeString('ar-QA', { hour: '2-digit', minute: '2-digit' })})
                        </div>
                      </div>
                    </div>

                    {/* Actions: Restore or Hard Delete */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        disabled={isRestoringId === item.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRestoringId === item.id ? 'animate-spin' : ''}`} />
                        <span>{isRestoringId === item.id ? 'جاري الاستعادة...' : 'استعادة للقسم'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleHardDelete(item)}
                        disabled={isDeletingId === item.id}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition disabled:opacity-50"
                        title="حذف نهائي فوري من قاعدة البيانات"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف نهائي</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>الاحتفاظ بالسجلات: 30 يوماً متواصلة مع إمكانية الاسترجاع بضغطة زر</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
