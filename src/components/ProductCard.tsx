import React from 'react';
import { Product } from '../types';
import { BarcodeSvg } from './BarcodeSvg';
import { Edit, Trash2, Copy, Check, Maximize2, GripVertical } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onDeleteProduct?: (id: string) => void;
  onViewImage?: (product: Product) => void;
  showEmployeeActions?: boolean;
  isEmployeeUnlocked?: boolean;
  frameHeight?: number; // custom global frame height
  frameRatio?: '50-50' | '60-40' | '40-60';
  isHighlighted?: boolean;
  // Drag & Drop custom reordering props
  isDraggable?: boolean;
  isBeingDragged?: boolean;
  isDragTarget?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, productId: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, productId: string) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>, productId: string) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, targetProductId: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onEditProduct,
  onDelete,
  onDeleteProduct,
  onViewImage,
  showEmployeeActions = false,
  isEmployeeUnlocked = false,
  frameHeight,
  frameRatio = '50-50',
  isHighlighted = false,
  isDraggable = false,
  isBeingDragged = false,
  isDragTarget = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const [copied, setCopied] = React.useState(false);
  const canManage = isEmployeeUnlocked || showEmployeeActions;
  const handleEdit = onEditProduct || onEdit;
  const handleDelete = onDeleteProduct || onDelete;

  const handleCopyBarcode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transform = product.imageTransform;
  const xOffset = transform?.xOffset ?? 0;
  const yOffset = transform?.yOffset ?? 0;
  const zoom = transform?.zoom ?? 1;
  const fit = transform?.fit ?? 'contain';
  // Global frameHeight from catalog toolbar takes priority over individual inner defaults
  const activeFrameHeight = frameHeight !== undefined ? frameHeight : (transform?.frameHeight || 105);

  // Grid distribution (Column 1: Barcode / Right, Column 2: Image / Left in RTL)
  const gridClass = frameRatio === '40-60'
    ? 'grid-cols-[38%_62%]' // صورة أكبر
    : frameRatio === '60-40'
    ? 'grid-cols-[62%_38%]' // باركود أكبر
    : 'grid-cols-2';        // 50:50 متوازن

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewImage) {
      onViewImage(product);
    }
  };

  return (
    <div 
      id={`product-card-${product.id}`}
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && onDragStart && onDragStart(e, product.id)}
      onDragOver={(e) => isDraggable && onDragOver && onDragOver(e, product.id)}
      onDragLeave={(e) => isDraggable && onDragLeave && onDragLeave(e, product.id)}
      onDrop={(e) => isDraggable && onDrop && onDrop(e, product.id)}
      onDragEnd={(e) => isDraggable && onDragEnd && onDragEnd(e)}
      className={`group relative bg-white rounded-xl transition-all duration-200 p-3.5 flex flex-col justify-between overflow-hidden ${
        isBeingDragged
          ? 'opacity-40 scale-95 border-2 border-dashed border-orange-500 shadow-none'
          : isDragTarget
          ? 'ring-4 ring-orange-500 bg-orange-50/80 scale-[1.02] border-2 border-orange-500 shadow-xl'
          : isHighlighted
          ? 'ring-4 ring-orange-500 shadow-2xl scale-[1.02] border-2 border-orange-500 bg-orange-50/20 animate-pulse'
          : isDraggable
          ? 'border border-slate-200 shadow-xs hover:shadow-lg hover:border-orange-400 cursor-grab active:cursor-grabbing'
          : 'border border-slate-200 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Drag Handle Badge for Custom Sorting Mode */}
      {isDraggable && (
        <div 
          className="no-print absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-200/80 flex items-center gap-1 text-[11px] font-bold cursor-grab active:cursor-grabbing hover:bg-orange-600 hover:text-white transition-all shadow-2xs"
          title="اضغط وقم بالسحب لإعادة ترتيب هذا المنتج"
        >
          <GripVertical className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">سحب</span>
        </div>
      )}

      {/* Employee Quick Actions Overlay */}
      {canManage && (
        <div className={`no-print absolute top-2 ${isDraggable ? 'left-2' : 'left-2'} z-10 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md rounded-lg p-1 shadow-sm border border-slate-800 transition-opacity`}>
          {handleEdit && (
            <button
              onClick={() => handleEdit(product)}
              className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              title="تعديل المنتج وضبط صورته"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleCopyBarcode}
            className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="نسخ رقم الباركود"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {handleDelete && (
            <button
              onClick={() => handleDelete(product.id)}
              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-md transition-colors"
              title="حذف هذا المنتج"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Product Title - Adaptive Height Typography */}
      <div className={`mb-2 text-center min-h-[36px] flex items-center justify-center ${isDraggable ? 'px-8 sm:px-12' : ''}`}>
        <h3 className="font-bold text-slate-900 text-sm md:text-base leading-snug line-clamp-2 tracking-tight">
          {product.name}
        </h3>
      </div>

      {/* Center Layout: Barcode SVG on left side, Product Image on right side */}
      <div className={`grid ${gridClass} gap-2 items-center justify-between my-1 bg-slate-50/90 p-2 rounded-xl border border-slate-200/80`}>
        {/* Barcode Graphic */}
        <div className="flex flex-col items-center justify-center border-l border-slate-200/80 pl-1.5 overflow-hidden">
          <BarcodeSvg 
            value={product.barcode} 
            width={1.15} 
            height={38} 
            fontSize={10}
          />
        </div>

        {/* Product Image - Clickable for Fullscreen Customer View */}
        <div 
          onClick={handleImageClick}
          style={{ height: `${activeFrameHeight}px` }}
          className="relative group/img flex items-center justify-center w-full p-1 bg-white rounded-lg border border-slate-200/60 shadow-2xs overflow-hidden cursor-pointer hover:border-orange-400 transition-all"
          title="اضغط لتكبير الصورة وعرض تفاصيل المنتج"
        >
          {product.imageUrl ? (
            <>
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  transform: `translate(${xOffset}%, ${yOffset}%) scale(${zoom})`,
                  objectFit: fit,
                  width: '100%',
                  height: '100%',
                }}
                className="max-w-full max-h-full transition-transform duration-150 group-hover/img:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80';
                }}
              />
              {/* Subtle Zoom Indicator on Hover */}
              <div className="absolute inset-0 bg-slate-950/0 group-hover/img:bg-slate-950/20 transition-all flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-slate-900/80 text-white p-1 rounded-md shadow-xs">
                  <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-[10px] text-slate-400 font-bold">بدون صورة</div>
          )}
        </div>
      </div>

      {/* Centered Price Footer */}
      <div className="mt-2.5 pt-2 flex items-center justify-center border-t border-slate-100">
        <div className="flex items-baseline justify-center gap-1.5 text-center">
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-slate-400 line-through text-xs font-semibold">
              {product.oldPrice}
            </span>
          )}
          <div className="flex items-baseline justify-center gap-1 text-orange-600 font-extrabold text-xl tracking-tight">
            <span>{product.price}</span>
            <span className="text-xs font-bold text-slate-700">{product.currency || 'QAR'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

