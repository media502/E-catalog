import React, { useState } from 'react';
import { CarCategory } from '../types';
import { Edit2, Sparkles, PlusCircle, Trash2, AlertTriangle, X } from 'lucide-react';

interface CategoryHeaderProps {
  category: CarCategory;
  productCount: number;
  onEditCategory?: (category: CarCategory) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onAddNewProduct?: () => void;
  isEmployeeUnlocked?: boolean;
  showEmployeeActions?: boolean;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  category,
  productCount,
  onEditCategory,
  onDeleteCategory,
  onAddNewProduct,
  isEmployeeUnlocked = false,
  showEmployeeActions = false,
}) => {
  const canEdit = isEmployeeUnlocked || showEmployeeActions;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleConfirmDelete = () => {
    setShowConfirmDelete(false);
    if (onDeleteCategory) {
      onDeleteCategory(category.id);
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white rounded-xl shadow-md mb-6 p-5 md:p-7 border border-slate-800 group">
      {/* Background Radial Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

      {/* Decorative Glow */}
      <div className="absolute left-0 bottom-0 w-72 h-72 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Category Title & Info */}
        <div className="flex-1 text-center md:text-right space-y-2.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-orange-950/80 text-orange-400 border border-orange-800/80 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>قسم السيارات: {category.carModel}</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-black italic tracking-tight text-white leading-tight">
            {category.headerTitle || category.name}
          </h2>

          {category.description && (
            <p className="text-slate-300 text-xs md:text-sm max-w-xl leading-relaxed">
              {category.description}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-semibold text-slate-300">
            <span className="bg-slate-800/90 px-3 py-1 rounded border border-slate-700 text-slate-200">
              إجمالي المنتجات: <strong className="text-orange-400 font-bold">{productCount}</strong> قطعة
            </span>

            {canEdit && onAddNewProduct && (
              <button
                onClick={onAddNewProduct}
                className="no-print inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة منتج لهذا القسم</span>
              </button>
            )}

            {canEdit && onEditCategory && (
              <button
                onClick={() => onEditCategory(category)}
                className="no-print inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-colors shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-orange-400" />
                <span>تعديل القسم</span>
              </button>
            )}

            {canEdit && onDeleteCategory && !showConfirmDelete && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="no-print inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold transition-colors shadow-xs"
                title="حذف هذا القسم بالكامل مع كافة منتجاته"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>حذف هذا القسم بالكامل</span>
              </button>
            )}

            {/* In-App Confirmation Inline State */}
            {canEdit && showConfirmDelete && (
              <div className="no-print inline-flex items-center gap-2 p-1 bg-rose-900/90 rounded-lg border border-rose-600">
                <span className="text-white text-[11px] font-bold px-1">
                  تأكيد حذف القسم وجميع منتجاته ({productCount})؟
                </span>
                <button
                  onClick={handleConfirmDelete}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Main Car Image */}
        <div className="w-full md:w-80 h-44 md:h-48 flex items-center justify-center relative">
          {category.mainCarImageUrl ? (
            <img
              src={category.mainCarImageUrl}
              alt={category.name}
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80';
              }}
            />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80"
              alt={category.name}
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)] opacity-60"
            />
          )}
        </div>
      </div>
    </div>
  );
};
