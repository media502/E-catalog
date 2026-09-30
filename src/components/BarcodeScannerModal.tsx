import React, { useState, useMemo } from 'react';
import { Product, CarCategory } from '../types';
import { BarcodeSvg } from './BarcodeSvg';
import { 
  Search, 
  X, 
  Barcode as BarcodeIcon, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Lock, 
  Eye, 
  Layers,
  Sparkles,
  ArrowRight,
  Tag
} from 'lucide-react';

interface BarcodeScannerModalProps {
  products: Product[];
  categories?: CarCategory[];
  isEmployeeUnlocked?: boolean;
  onEditProduct: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  categories = [],
  isEmployeeUnlocked = false,
  onEditProduct,
  onSelectProduct,
  onClose,
}) => {
  const [scannedCode, setScannedCode] = useState('');

  // Find all products that match exactly or partially with the scanned code
  const matchingProducts = useMemo(() => {
    const query = scannedCode.trim().toLowerCase();
    if (!query) return [];

    const matches = products.filter((p) => {
      const barcode = p.barcode.trim().toLowerCase();
      const id = p.id.toLowerCase();
      const name = p.name.toLowerCase();

      return barcode.includes(query) || id.includes(query) || name.includes(query);
    });

    // Sort: Exact match first, then startsWith, then general includes
    return matches.sort((a, b) => {
      const aCode = a.barcode.trim().toLowerCase();
      const bCode = b.barcode.trim().toLowerCase();

      if (aCode === query && bCode !== query) return -1;
      if (bCode === query && aCode !== query) return 1;

      if (aCode.startsWith(query) && !bCode.startsWith(query)) return -1;
      if (bCode.startsWith(query) && !aCode.startsWith(query)) return 1;

      return 0;
    });
  }, [products, scannedCode]);

  const handleQuickSelect = (barcode: string) => {
    setScannedCode(barcode);
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'قسم عام';
  };

  const cleanQuery = scannedCode.trim();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden font-sans my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600/30 text-orange-400 rounded-lg border border-orange-500/40 shrink-0">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-white tracking-tight flex items-center gap-2">
                <span>فحص ومطابقة الباركود</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Live Search
                </span>
              </h3>
              <p className="text-slate-400 text-xs">ابحث بالباركود الكامل أو الجزئي لعرض وتعديل جميع المنتجات المطابقة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input Container */}
        <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              أدخل أو امسح الباركود (يقبل الباركود الكامل أو جزء منه):
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="اكتب أي رقم أو جزء من الباركود (مثال: 1001 أو 0108)..."
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm md:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-xs"
              />
              <BarcodeIcon className="absolute right-3 w-5 h-5 text-slate-400" />
              {scannedCode && (
                <button
                  type="button"
                  onClick={() => setScannedCode('')}
                  className="absolute left-3 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  title="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick presets for convenience */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-500" />
              أمثلة سريعة:
            </span>
            {products.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleQuickSelect(p.barcode)}
                className="px-2 py-0.5 bg-white hover:bg-orange-50 hover:text-orange-700 text-slate-600 font-mono text-xs font-bold rounded border border-slate-200 transition-colors shadow-2xs"
              >
                {p.barcode}
              </button>
            ))}
          </div>
        </div>

        {/* Results List Area */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-3">
          {!cleanQuery ? (
            /* Empty State / Initial Instructions */
            <div className="py-8 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <BarcodeIcon className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-sm text-slate-800">جاهز لمسح والبحث في الباركود</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  يمكنك استخدام جهاز قارئ الباركود (Barcode Scanner) أو كتابة رقم الباركود (كاملاً أو جزءاً منه). سيتم عرض كافة المنتجات المطابقة فوراً.
                </p>
              </div>
            </div>
          ) : matchingProducts.length > 0 ? (
            /* Matching Products List */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    تم العثور على ({matchingProducts.length}) {matchingProducts.length === 1 ? 'منتج مطابق' : 'منتجات مطابقة'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  البحث عن: "{cleanQuery}"
                </span>
              </div>

              {/* Product Cards Grid / List */}
              <div className="space-y-2.5">
                {matchingProducts.map((product) => {
                  const isExactMatch = product.barcode.trim().toLowerCase() === cleanQuery.toLowerCase();
                  const categoryName = getCategoryName(product.categoryId);

                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isExactMatch
                          ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-400/50 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        
                        {/* Product Thumbnail & Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-14 w-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Tag className="w-5 h-5 text-slate-300" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                {categoryName}
                              </span>
                              {isExactMatch && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  تطابق تام (100%)
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs md:text-sm text-slate-900 truncate mt-0.5">
                              {product.name}
                            </h4>

                            {/* Barcode & Price highlight */}
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <div className="flex items-center gap-1 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                                <BarcodeIcon className="w-3.5 h-3.5 text-orange-600" />
                                <span>{product.barcode}</span>
                              </div>

                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-black text-orange-600">
                                  {product.price} {product.currency}
                                </span>
                                {product.oldPrice && (
                                  <span className="text-[11px] text-slate-400 line-through">
                                    {product.oldPrice} {product.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for this specific matched product */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                          {/* Edit Button with Auth Flow */}
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="flex-1 sm:flex-none py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                            title="تعديل هذا المنتج"
                          >
                            {isEmployeeUnlocked ? (
                              <Edit3 className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                            <span>{isEmployeeUnlocked ? 'تعديل المنتج' : 'تسجيل وتعديل'}</span>
                          </button>

                          {/* View in Catalog Button */}
                          {onSelectProduct && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProduct(product);
                                onClose();
                              }}
                              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                              title="الانتقال للمنتج في الكتالوج"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden xs:inline">عرض</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* No Results Found */
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-800 space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="font-bold text-sm">لم يتم العثور على أي منتج يطابق هذا الباركود</h4>
              <p className="text-xs text-rose-600 max-w-sm mx-auto leading-relaxed">
                لا يوجد منتج يحتوي على الباركود <code className="bg-white px-2 py-0.5 rounded border border-rose-200 font-mono font-bold text-rose-800">{cleanQuery}</code>. تأكد من صحة الأرقام المدخلة.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span>إجمالي المنتجات المسجلة في الكتالوج: <strong className="text-slate-900 font-mono">{products.length}</strong> منتج</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
