import React, { useState } from 'react';
import { Product, CarCategory } from '../types';
import { BarcodeSvg } from './BarcodeSvg';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Copy, 
  Check, 
  Tag, 
  Maximize2,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface ImageViewerModalProps {
  product: Product | null;
  category?: CarCategory;
  onClose: () => void;
  onPrevProduct?: () => void;
  onNextProduct?: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  product,
  category,
  onClose,
  onPrevProduct,
  onNextProduct,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 font-sans animate-in fade-in duration-200">
      
      {/* Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Top Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-600/20 text-orange-400 rounded-2xl border border-orange-500/30">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {category && (
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                    {category.name}
                  </span>
                )}
                <span className="font-mono text-orange-400 font-bold">
                  {product.price} {product.currency || 'QAR'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                title="تكبير الصورة"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition text-xs font-mono px-2"
                title="إعادة ضبط الحجم"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                title="تصغير الصورة"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex-1 bg-radial from-slate-900 to-slate-950 p-4 sm:p-8 flex items-center justify-center overflow-auto min-h-[350px]">
          
          {/* Navigation Arrows */}
          {onPrevProduct && (
            <button
              onClick={onPrevProduct}
              className="absolute right-3 sm:right-6 z-20 p-3 bg-slate-800/80 hover:bg-orange-600 text-white rounded-full transition shadow-lg backdrop-blur-xs"
              title="المنتج السابق"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {onNextProduct && (
            <button
              onClick={onNextProduct}
              className="absolute left-3 sm:left-6 z-20 p-3 bg-slate-800/80 hover:bg-orange-600 text-white rounded-full transition shadow-lg backdrop-blur-xs"
              title="المنتج التالي"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* High Res Product Image */}
          <div 
            className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'}
              alt={product.name}
              className="max-h-[50vh] sm:max-h-[60vh] max-w-full object-contain rounded-2xl drop-shadow-2xl select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80';
              }}
            />
          </div>

        </div>

        {/* Bottom Bar: Barcode, Price, and Quick Specs */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          {/* Barcode & Copy Button */}
          <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl shadow-inner border border-slate-700">
            <BarcodeSvg 
              value={product.barcode} 
              width={1.4} 
              height={40} 
              fontSize={11}
            />
            <button
              onClick={handleCopyBarcode}
              className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition flex items-center gap-1.5 text-xs font-bold"
              title="نسخ الباركود"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>

          {/* Price & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              {product.oldPrice && product.oldPrice > product.price && (
                <div className="text-xs text-slate-500 line-through font-semibold">
                  السعر السابق: {product.oldPrice} {product.currency || 'QAR'}
                </div>
              )}
              <div className="text-xl sm:text-2xl font-black text-orange-400">
                {product.price} <span className="text-sm font-bold text-slate-400">{product.currency || 'QAR'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              إغلاق المعاينة
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
