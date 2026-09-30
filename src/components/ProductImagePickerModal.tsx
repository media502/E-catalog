import React, { useState } from 'react';
import { Product, CarCategory, ProductImageTransform } from '../types';
import {
  Image as ImageIcon,
  Search,
  X,
  Check,
  Sparkles,
  Car,
  Filter,
  Copy
} from 'lucide-react';

interface ProductImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: CarCategory[];
  currentProductId?: string;
  onSelectImage: (imageUrl: string, imageTransform?: ProductImageTransform, sourceProductName?: string) => void;
}

export const ProductImagePickerModal: React.FC<ProductImagePickerModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  currentProductId,
  onSelectImage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('all');

  if (!isOpen) return null;

  // Filter products with valid images
  const productsWithImages = products.filter((p) => {
    if (!p.imageUrl || p.imageUrl.trim() === '') return false;
    if (p.id === currentProductId) return false; // exclude currently edited product

    const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600/30 text-orange-400 rounded-xl border border-orange-500/40 shrink-0">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">اختيار ونسخ صورة من منتج آخر</h3>
              <p className="text-slate-400 text-[11px]">
                اختر أي منتج من الكتالوج لنسخ صورته وإعدادات إزاحتها وتطبيقها على منتجك الحالي بنقرة واحدة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج أو الباركود..."
              className="w-full pl-3 pr-8 py-1.5 text-xs font-bold bg-white rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">جميع الأقسام ({products.filter(p => p.imageUrl).length} صورة متاحة)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({products.filter(p => p.categoryId === cat.id && p.imageUrl).length})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Products Grid with Images */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          {productsWithImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {productsWithImages.map((prod) => {
                const cat = categories.find((c) => c.id === prod.categoryId);
                const transform = prod.imageTransform;

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      onSelectImage(prod.imageUrl, prod.imageTransform, prod.name);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-orange-500 hover:shadow-md transition-all text-right group flex flex-col justify-between"
                  >
                    {/* Image Preview Box */}
                    <div className="w-full h-24 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative flex items-center justify-center p-1 mb-2 group-hover:bg-orange-50/50">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          style={{
                            transform: transform ? `translate(${transform.xOffset || 0}%, ${transform.yOffset || 0}%) scale(${transform.zoom || 1})` : 'none',
                            objectFit: transform?.fit || 'contain',
                          }}
                          className="max-w-full max-h-full transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-[10px] text-slate-400 font-bold">بدون صورة</div>
                      )}
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-orange-600 text-white rounded p-1 shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {prod.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate">{cat?.name || 'قسم'}</span>
                        <span className="font-mono text-orange-600 font-bold">{prod.price} QAR</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">لا توجد منتجات بصور مطابقة للبحث.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 px-5 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            اختر أي صورة لنسخها مع إعدادات المحاذاة والإزاحة تلقائياً
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition"
          >
            إلغاء
          </button>
        </div>

      </div>
    </div>
  );
};
