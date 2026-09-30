import React, { useState, useEffect } from 'react';
import { Product, CarCategory, ProductImageTransform } from '../types';
import { BarcodeSvg } from './BarcodeSvg';
import { bulkSaveProductsToDb, SUPABASE_SQL_SCHEMA, SUPABASE_URL } from '../supabase';
import { db as firestoreDb } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ProductImagePickerModal } from './ProductImagePickerModal';
import { removeImageBackground, upscaleAndEnhanceImage } from '../utils/imageEnhancer';
import { compressUploadedFile } from '../utils/imageOptimizer';
import {
  Plus,
  Save,
  X,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Car,
  Tag,
  Barcode as BarcodeIcon,
  DollarSign,
  FolderPlus,
  Trash2,
  Check,
  FileSpreadsheet,
  Layers,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  FileText,
  AlertCircle,
  Pencil,
  ImageOff,
  Sliders,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Maximize2,
  Copy,
  Sparkles,
  Wand2,
  Undo2,
  Redo2,
  History,
  CheckCircle2
} from 'lucide-react';

interface EmployeePanelProps {
  categories: CarCategory[];
  products: Product[];
  activeCategoryId: string;
  editingProduct?: Product | null;
  editingCategory?: CarCategory | null;
  onSaveProduct: (productData: Partial<Product>) => Promise<void> | void;
  onSaveCategory: (categoryData: Partial<CarCategory>) => Promise<void> | void;
  onDeleteCategory: (categoryId: string, deleteProductsToo?: boolean) => Promise<void> | void;
  onDeleteMultipleProducts?: (productIds: string[]) => Promise<void> | void;
  onBulkImportProducts?: (newProducts: Product[], newCategories?: CarCategory[]) => Promise<void> | void;
  onOpenPdfExtractor?: () => void;
  onClose: () => void;
}

export const EmployeePanel: React.FC<EmployeePanelProps> = ({
  categories,
  products,
  activeCategoryId,
  editingProduct,
  editingCategory,
  onSaveProduct,
  onSaveCategory,
  onDeleteCategory,
  onDeleteMultipleProducts,
  onBulkImportProducts,
  onOpenPdfExtractor,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'product' | 'category' | 'bulk_delete' | 'import_export' | 'supabase_sync'>('product');
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Product form state
  const [productName, setProductName] = useState('');
  const [productBarcode, setProductBarcode] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [productOldPrice, setProductOldPrice] = useState<number | ''>('');
  const [productCurrency, setProductCurrency] = useState('QAR');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [imgXOffset, setImgXOffset] = useState<number>(0);
  const [imgYOffset, setImgYOffset] = useState<number>(0);
  const [imgZoom, setImgZoom] = useState<number>(1.0);
  const [imgFit, setImgFit] = useState<'contain' | 'cover'>('contain');
  const [imgFrameHeight, setImgFrameHeight] = useState<number>(105);
  const [isSaving, setIsSaving] = useState(false);
  const [productFormError, setProductFormError] = useState('');

  // AI Image Enhancer, Background Removal & Non-Destructive History State
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [enhanceNotice, setEnhanceNotice] = useState('');
  const [originalProductImage, setOriginalProductImage] = useState<string>('');
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Push new image modification into non-destructive history stack
  const pushImageToHistory = (newUrl: string) => {
    setImageHistory((prev) => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, newUrl];
    });
    setHistoryIndex((prev) => prev + 1);
    setProductImageUrl(newUrl);
  };

  // Revert to previous image state (Undo)
  const handleUndoImage = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      setHistoryIndex(targetIdx);
      setProductImageUrl(imageHistory[targetIdx]);
      setEnhanceNotice('↩️ تم التراجع عن الإجراء السابق');
      setTimeout(() => setEnhanceNotice(''), 3000);
    }
  };

  // Step forward to next image state (Redo)
  const handleRedoImage = () => {
    if (historyIndex < imageHistory.length - 1) {
      const targetIdx = historyIndex + 1;
      setHistoryIndex(targetIdx);
      setProductImageUrl(imageHistory[targetIdx]);
      setEnhanceNotice('↪️ تم إعادة تطبيق التعديل');
      setTimeout(() => setEnhanceNotice(''), 3000);
    }
  };

  // Reset completely to the original untouched image
  const handleResetToOriginalImage = () => {
    if (originalProductImage && originalProductImage !== productImageUrl) {
      pushImageToHistory(originalProductImage);
      setEnhanceNotice('🔄 تمت استعادة الصورة الأصلية بنجاح');
      setTimeout(() => setEnhanceNotice(''), 3000);
    }
  };

  // Category form state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catHeaderTitle, setCatHeaderTitle] = useState('');
  const [catCarModel, setCatCarModel] = useState('');
  const [catMainImageUrl, setCatMainImageUrl] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [categoryFormError, setCategoryFormError] = useState('');
  const [isClearingImages, setIsClearingImages] = useState(false);

  // Bulk Delete State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkFilterCatId, setBulkFilterCatId] = useState<string>('all');
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [bulkDeleteSuccessMsg, setBulkDeleteSuccessMsg] = useState('');
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);

  // Category Delete State Confirmation
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string; count: number } | null>(null);

  // Product Image Picker from Other Products
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [copiedImageNotice, setCopiedImageNotice] = useState('');

  // Import / Export state
  const [importText, setImportText] = useState('');
  const [importCatId, setImportCatId] = useState(categories[0]?.id || '');
  const [importNotice, setImportNotice] = useState('');

  // Sample Car Accessories Quick Preset Images
  const sampleProductImages = [
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&auto=format&fit=crop&q=80',
  ];

  const sampleCarImages = [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80',
  ];

  // Initialize Product Form
  useEffect(() => {
    if (editingProduct) {
      setActiveTab('product');
      setProductName(editingProduct.name);
      setProductBarcode(editingProduct.barcode);
      setProductPrice(editingProduct.price);
      setProductOldPrice(editingProduct.oldPrice || '');
      setProductCurrency(editingProduct.currency || 'QAR');
      setProductCategoryId(editingProduct.categoryId);
      setProductImageUrl(editingProduct.imageUrl);
      setOriginalProductImage(editingProduct.imageUrl);
      setImageHistory([editingProduct.imageUrl]);
      setHistoryIndex(0);
      const t = editingProduct.imageTransform;
      setImgXOffset(t?.xOffset ?? 0);
      setImgYOffset(t?.yOffset ?? 0);
      setImgZoom(t?.zoom ?? 1.0);
      setImgFit(t?.fit ?? 'contain');
      setImgFrameHeight(t?.frameHeight ?? 105);
      setProductFormError('');
    } else {
      setProductName('');
      generateRandomBarcode();
      setProductPrice('');
      setProductOldPrice('');
      setProductCurrency('QAR');
      setProductCategoryId(activeCategoryId === 'all' ? (categories[0]?.id || '') : (activeCategoryId || categories[0]?.id || ''));
      setProductImageUrl(sampleProductImages[0]);
      setOriginalProductImage(sampleProductImages[0]);
      setImageHistory([sampleProductImages[0]]);
      setHistoryIndex(0);
      setImgXOffset(0);
      setImgYOffset(0);
      setImgZoom(1.0);
      setImgFit('contain');
      setImgFrameHeight(105);
    }
  }, [editingProduct, activeCategoryId, categories]);

  // Initialize Category Form
  useEffect(() => {
    if (editingCategory) {
      setActiveTab('category');
      setCatName(editingCategory.name);
      setCatHeaderTitle(editingCategory.headerTitle || editingCategory.name);
      setCatCarModel(editingCategory.carModel);
      setCatMainImageUrl(editingCategory.mainCarImageUrl);
      setCatDescription(editingCategory.description || '');
      setCategoryFormError('');
    } else {
      setCatName('');
      setCatHeaderTitle('');
      setCatCarModel('');
      setCatMainImageUrl(sampleCarImages[0]);
      setCatDescription('');
    }
  }, [editingCategory]);

  const generateRandomBarcode = () => {
    const random10Digit = '100' + Math.floor(1000000 + Math.random() * 9000000);
    setProductBarcode(random10Digit);
  };

  const [isCompressingImg, setIsCompressingImg] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCategory = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImg(true);
    try {
      // Instant high-speed client-side compression (<80KB WebP/JPEG)
      const compressedDataUrl = await compressUploadedFile(file, 800, 800, 0.82);
      if (isCategory) {
        setCatMainImageUrl(compressedDataUrl);
      } else {
        setProductImageUrl(compressedDataUrl);
        setOriginalProductImage(compressedDataUrl);
        setImageHistory([compressedDataUrl]);
        setHistoryIndex(0);
      }
    } catch (err) {
      console.error('File upload compression error:', err);
      // Fallback to basic file reader
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (isCategory) {
          setCatMainImageUrl(base64);
        } else {
          setProductImageUrl(base64);
          setOriginalProductImage(base64);
          setImageHistory([base64]);
          setHistoryIndex(0);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingImg(false);
      // Reset input value so same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productPrice || !productCategoryId) {
      setProductFormError('يرجى ملء جميع الحقول الإلزامية: اسم المنتج، السعر، والقسم.');
      return;
    }

    setIsSaving(true);
    setProductFormError('');
    try {
      await onSaveProduct({
        id: editingProduct ? editingProduct.id : undefined,
        name: productName.trim(),
        barcode: productBarcode.trim() || '1001000000',
        price: Number(productPrice),
        oldPrice: productOldPrice ? Number(productOldPrice) : undefined,
        currency: productCurrency,
        categoryId: productCategoryId,
        imageUrl: productImageUrl || sampleProductImages[0],
        imageTransform: {
          xOffset: imgXOffset,
          yOffset: imgYOffset,
          zoom: imgZoom,
          fit: imgFit,
          frameHeight: imgFrameHeight,
        },
      });
      onClose();
    } catch (err) {
      console.error(err);
      setProductFormError('حدث خطأ أثناء حفظ المنتج في قاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditCategory = (cat: CarCategory) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatHeaderTitle(cat.headerTitle || cat.name);
    setCatCarModel(cat.carModel);
    setCatMainImageUrl(cat.mainCarImageUrl);
    setCatDescription(cat.description || '');
    setCategoryFormError('');
    setTimeout(() => {
      document.getElementById('category-edit-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCatId(null);
    setCatName('');
    setCatHeaderTitle('');
    setCatCarModel('');
    setCatMainImageUrl(sampleCarImages[0]);
    setCatDescription('');
    setCategoryFormError('');
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catCarModel.trim()) {
      setCategoryFormError('يرجى ملء اسم القسم وموديل السيارة.');
      return;
    }

    setIsSaving(true);
    setCategoryFormError('');
    try {
      const catId = editingCatId || (editingCategory ? editingCategory.id : `cat-${Date.now()}`);
      await onSaveCategory({
        id: catId,
        name: catName.trim(),
        headerTitle: catHeaderTitle.trim() || catName.trim(),
        carModel: catCarModel.trim(),
        mainCarImageUrl: catMainImageUrl || sampleCarImages[0],
        description: catDescription.trim(),
      });
      handleCancelCategoryEdit();
      onClose();
    } catch (err) {
      console.error(err);
      setCategoryFormError('حدث خطأ أثناء حفظ القسم في قاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  // Default images count
  const defaultImagesCount = products.filter(p => 
    p.imageUrl && (
      p.imageUrl.includes('unsplash') || 
      p.imageUrl.includes('placehold') || 
      sampleProductImages.includes(p.imageUrl)
    )
  ).length;

  const handleClearDefaultImages = async () => {
    if (defaultImagesCount === 0) {
      alert('لا توجد منتجات بصور افتراضية (Unsplash) حالياً.');
      return;
    }
    
    if (!window.confirm(`هل ترغب في مسح الصور الافتراضية لـ ${defaultImagesCount} منتجاً؟ سيتم تفريغ الصور لتتمكن من استخراج صورها الحقيقية من الكتالوج أو رفعها.`)) {
      return;
    }

    setIsClearingImages(true);
    try {
      const updated = products.map(p => {
        if (p.imageUrl && (p.imageUrl.includes('unsplash') || p.imageUrl.includes('placehold') || sampleProductImages.includes(p.imageUrl))) {
          return { ...p, imageUrl: '', updatedAt: new Date().toISOString() };
        }
        return p;
      });

      const changed = updated.filter(p => p.imageUrl === '');
      await bulkSaveProductsToDb(changed);
      if (onBulkImportProducts) {
        await onBulkImportProducts(updated);
      }
      setBulkDeleteSuccessMsg(`تم مسح وتفريغ الصور الافتراضية لـ ${changed.length} منتجاً بنجاح.`);
      setTimeout(() => setBulkDeleteSuccessMsg(''), 5000);
      alert(`✅ تم بنجاح تفريغ ومسح الصور الافتراضية لـ ${changed.length} منتجاً!`);
    } catch (err) {
      console.error('Error clearing default images:', err);
      alert('حدث خطأ أثناء مسح الصور الافتراضية.');
    } finally {
      setIsClearingImages(false);
    }
  };

  // Bulk Delete Functions
  const filteredBulkProducts = products.filter((p) => {
    const matchesCat = bulkFilterCatId === 'all' || p.categoryId === bulkFilterCatId;
    const matchesQuery = !bulkSearchQuery.trim() || 
      p.name.toLowerCase().includes(bulkSearchQuery.toLowerCase()) || 
      p.barcode.includes(bulkSearchQuery.trim());
    return matchesCat && matchesQuery;
  });

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredBulkProducts.map((p) => p.id);
    const allSelected = filteredIds.every((id) => selectedProductIds.includes(id)) && filteredIds.length > 0;

    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleDirectExecuteBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    setIsDeletingBulk(true);
    setShowBulkConfirmDialog(false);
    const countToDelete = selectedProductIds.length;

    try {
      if (onDeleteMultipleProducts) {
        await onDeleteMultipleProducts(selectedProductIds);
      }
      setSelectedProductIds([]);
      setBulkDeleteSuccessMsg(`تم حذف ${countToDelete} منتج بنجاح من الكتالوج وقاعدة البيانات السحابية.`);
      setTimeout(() => setBulkDeleteSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Bulk delete error:', err);
      setBulkDeleteSuccessMsg('حدث خطأ أثناء حذف المنتجات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Direct category deletion
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const { id } = categoryToDelete;
    setCategoryToDelete(null);
    try {
      await onDeleteCategory(id, true);
    } catch (err) {
      console.error('Category delete error:', err);
    }
  };

  // Quick text parser for Excel/CSV tab
  const handleProcessImport = async () => {
    if (!importText.trim() || !onBulkImportProducts) return;

    const lines = importText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const newProducts: Product[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[\t,;]/).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 1) {
        const name = parts[0];
        let price = 99;
        let barcode = '1001' + Math.floor(100000 + Math.random() * 900000);

        for (let i = 1; i < parts.length; i++) {
          const num = parseFloat(parts[i].replace(/[^\d.]/g, ''));
          if (!isNaN(num)) {
            if (parts[i].length >= 8 && !parts[i].includes('.')) {
              barcode = parts[i];
            } else if (price === 99) {
              price = num;
            }
          }
        }

        newProducts.push({
          id: `prod-imp-${Date.now()}-${index}`,
          categoryId: importCatId || categories[0]?.id || 'cat-1',
          name,
          price,
          barcode,
          currency: 'QAR',
          imageUrl: sampleProductImages[index % sampleProductImages.length],
        });
      }
    });

    if (newProducts.length > 0) {
      await onBulkImportProducts(newProducts);
      setImportNotice(`تم استيراد وحفظ ${newProducts.length} منتج بنجاح!`);
      setImportText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] relative">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-sm">
              W
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                لوحة إدارة المنتجات والأقسام والحذف السريع
              </h3>
              <p className="text-xs text-slate-400">
                حذف متعدد، إدارة الأقسام، والإضافة مع الحفظ والمزامنة السحابية اللحظية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 flex gap-2 overflow-x-auto text-xs font-bold">
          
          <button
            onClick={() => setActiveTab('bulk_delete')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'bulk_delete'
                ? 'border-rose-600 text-rose-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>حذف متعدد للمنتجات ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('product')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'product'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</span>
          </button>

          <button
            onClick={() => setActiveTab('category')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'category'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>إدارة وحذف الأقسام ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import_export')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import_export'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد وتصدير (Excel/CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase_sync')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'supabase_sync'
                ? 'border-emerald-600 text-emerald-600 bg-white font-black'
                : 'border-transparent text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>قاعدة بيانات Supabase (سحابية سريعة ومجانية)</span>
          </button>

          {onOpenPdfExtractor && (
            <button
              onClick={() => {
                onClose();
                onOpenPdfExtractor();
              }}
              className="py-3 px-4 border-b-2 border-transparent text-orange-600 hover:text-orange-700 hover:bg-orange-50/50 flex items-center gap-1.5 transition-colors mr-auto font-bold"
            >
              <ImageIcon className="w-4 h-4" />
              <span>استخراج صور الكتالوج من الـ PDF</span>
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          
          {/* TAB 1: BULK DELETE PRODUCTS (MULTI-SELECT) */}
          {activeTab === 'bulk_delete' && (
            <div className="space-y-4 text-right">
              
              {/* Success Notification Banner */}
              {bulkDeleteSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{bulkDeleteSuccessMsg}</span>
                </div>
              )}

              {/* Action Banner */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs">أداة الحذف المتعدد المباشر للمنتجات</h4>
                    <p className="text-[11px] text-rose-700">
                      حدد المنتجات ثم اضغط على زر الحذف ليتم مسحها فورياً من قاعدة البيانات السحابية (Firestore).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!showBulkConfirmDialog ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProductIds.length > 0) {
                          setShowBulkConfirmDialog(true);
                        }
                      }}
                      disabled={selectedProductIds.length === 0 || isDeletingBulk}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {isDeletingBulk 
                          ? 'جاري الحذف السحابي...' 
                          : `حذف المنتجات المحددة (${selectedProductIds.length})`}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-xl border border-rose-300 shadow-sm">
                      <span className="text-[11px] font-bold text-rose-700 px-2">
                        تأكيد حذف {selectedProductIds.length} منتج؟
                      </span>
                      <button
                        type="button"
                        onClick={handleDirectExecuteBulkDelete}
                        disabled={isDeletingBulk}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        {isDeletingBulk ? 'جاري الحذف...' : 'نعم، حذف الآن'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBulkConfirmDialog(false)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={bulkSearchQuery}
                    onChange={(e) => setBulkSearchQuery(e.target.value)}
                    placeholder="بحث باسم المنتج أو الباركود..."
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={bulkFilterCatId}
                    onChange={(e) => setBulkFilterCatId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="all">جميع الأقسام ({products.length} منتج)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({products.filter((p) => p.categoryId === c.id).length})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    {filteredBulkProducts.length > 0 && filteredBulkProducts.every((p) => selectedProductIds.includes(p.id))
                      ? 'إلغاء تحديد الكل'
                      : `تحديد المعروض (${filteredBulkProducts.length})`}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearDefaultImages}
                    disabled={isClearingImages || defaultImagesCount === 0}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-40"
                    title="مسح وتفريغ الصور الافتراضية (Unsplash) من المنتجات"
                  >
                    <ImageOff className="w-3.5 h-3.5 text-amber-700" />
                    <span>مسح الصور الافتراضية ({defaultImagesCount})</span>
                  </button>
                </div>
              </div>

              {/* Products Table with Checkboxes */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[11px] font-bold">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredBulkProducts.length > 0 &&
                            filteredBulkProducts.every((p) => selectedProductIds.includes(p.id))
                          }
                          onChange={handleSelectAllFiltered}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-14 text-center">الصورة</th>
                      <th className="p-3">اسم المنتج</th>
                      <th className="p-3 w-28">القسم</th>
                      <th className="p-3 w-24">السعر</th>
                      <th className="p-3 w-28 text-center">الباركود</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBulkProducts.length > 0 ? (
                      filteredBulkProducts.map((prod) => {
                        const isSelected = selectedProductIds.includes(prod.id);
                        const cat = categories.find((c) => c.id === prod.categoryId);
                        return (
                          <tr
                            key={prod.id}
                            onClick={() => handleToggleSelectProduct(prod.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-rose-50 font-bold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectProduct(prod.id)}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-10 h-10 object-contain rounded border border-slate-200 bg-white mx-auto"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded border border-slate-200 bg-slate-100 flex items-center justify-center mx-auto text-[9px] text-slate-400 font-bold">
                                  بدون
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-slate-900 font-bold">
                              {prod.name}
                            </td>
                            <td className="p-3 text-slate-600 text-[11px]">
                              {cat?.name || prod.categoryId}
                            </td>
                            <td className="p-3 text-orange-600 font-bold">
                              {prod.price} QAR
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-500 text-center">
                              {prod.barcode}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                          لا توجد منتجات مطابقة للبحث أو الفلتر المحدد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCT FORM (ADD / EDIT) */}
          {activeTab === 'product' && (
            <form onSubmit={handleSubmitProduct} className="space-y-4 text-right">
              
              {productFormError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{productFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Category Target */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    القسم / نوع السيارة *
                  </label>
                  <select
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-orange-500 focus:outline-none"
                    required
                  >
                    <option value="" disabled>اختر القسم...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.carModel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    اسم المنتج / الأكسسوار *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="مثال: هافال - حماية ابواب سيليكون"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Price (QAR) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    السعر الحالي (QAR) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="89"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-orange-600 focus:border-orange-500 focus:outline-none"
                      required
                    />
                    <span className="text-xs font-bold text-slate-500">QAR</span>
                  </div>
                </div>

                {/* Old Price (Discount) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    السعر السابق / قبل الخصم (اختياري)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={productOldPrice}
                      onChange={(e) => setProductOldPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="120"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-400 focus:border-orange-500 focus:outline-none line-through"
                    />
                    <span className="text-xs font-bold text-slate-400">QAR</span>
                  </div>
                </div>

                {/* Barcode Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      رقم الباركود (10 أرقام) *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomBarcode}
                      className="text-[11px] text-orange-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>توليد تلقائي</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={productBarcode}
                    onChange={(e) => setProductBarcode(e.target.value)}
                    placeholder="1001042001"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 focus:border-orange-500 focus:outline-none text-center"
                    required
                  />
                </div>

                {/* Image URL & Upload & Pick from other product */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      صورة المنتج (رابط مباشر، رفع، أو نسخ من منتج آخر) *
                    </label>
                    {copiedImageNotice && (
                      <span className="text-[10px] text-emerald-600 font-bold animate-pulse flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>{copiedImageNotice}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={productImageUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductImageUrl(val);
                        if (val.trim()) {
                          pushImageToHistory(val);
                        }
                      }}
                      placeholder="رابط الصورة https://..."
                      className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                    
                    <button
                      type="button"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-xs font-bold border border-orange-200 shrink-0 transition-colors shadow-2xs"
                      title="اختيار ونسخ صورة وموضع من منتج آخر في الكتالوج"
                    >
                      <Copy className="w-3.5 h-3.5 text-orange-600" />
                      <span>نسخ من منتج آخر</span>
                    </button>

                    <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* Preset Images */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-slate-500 font-bold block">
                  أو اختر صورة سريعة من النماذج الرسمية:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {sampleProductImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => pushImageToHistory(img)}
                      className={`w-14 h-14 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                        productImageUrl === img ? 'border-orange-600 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Sample" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* INTERACTIVE IMAGE FRAME & LIVE POSITION TUNER */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        تحريك الصورة والتحكم بقالب وإطار الكارد (مباشر)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        حرك الصورة يميناً أو يساراً أو لأعلى/لأسفل بمجال كامل (±100%) واضبط حجم الإطار
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImgXOffset(0);
                      setImgYOffset(0);
                      setImgZoom(1.0);
                      setImgFit('contain');
                      setImgFrameHeight(105);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition"
                    title="إعادة ضبط للافتراضي"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إعادة ضبط</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Real-time Card Mini Preview (Matches ProductCard layout) */}
                  <div className="md:col-span-6 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-2">
                      معاينة مباشرة لشكل الكارد مع الإطار:
                    </span>

                    <div className="w-full max-w-[280px] bg-white rounded-xl p-3 border border-slate-300 shadow-md text-slate-900">
                      <div className="text-center font-bold text-xs line-clamp-1 mb-2">
                        {productName || 'اسم المنتج'}
                      </div>

                      <div className="grid grid-cols-2 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {/* Barcode side */}
                        <div className="flex flex-col items-center justify-center border-l border-slate-200 pl-1">
                          <BarcodeSvg value={productBarcode || '1001000000'} width={0.9} height={30} fontSize={8} />
                        </div>

                        {/* Image Frame side */}
                        <div 
                          style={{ height: `${imgFrameHeight}px` }}
                          className="relative flex items-center justify-center w-full p-1 bg-white rounded-md border border-slate-300 shadow-2xs overflow-hidden"
                        >
                          {productImageUrl ? (
                            <img
                              src={productImageUrl}
                              alt="Live Preview"
                              style={{
                                transform: `translate(${imgXOffset}%, ${imgYOffset}%) scale(${imgZoom})`,
                                objectFit: imgFit,
                                width: '100%',
                                height: '100%',
                              }}
                              className="max-w-full max-h-full transition-transform duration-100"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400">بدون صورة</span>
                          )}
                        </div>
                      </div>

                      <div className="text-center font-extrabold text-orange-600 text-sm mt-2">
                        {productPrice ? `${productPrice} ${productCurrency}` : '99 QAR'}
                      </div>
                    </div>
                  </div>

                  {/* D-Pad & Sliders Controller */}
                  <div className="md:col-span-6 space-y-3">
                    
                    {/* D-Pad Controller */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">تحريك سريع (D-Pad):</span>
                        <span className="text-[9px] text-slate-500">انقر للتحريك خطوة بخطوة</span>
                      </div>

                      {/* Directional Cross */}
                      <div className="grid grid-cols-3 gap-1 w-28">
                        <div></div>
                        <button
                          type="button"
                          onClick={() => setImgYOffset(prev => Math.max(-100, prev - 5))}
                          className="p-1.5 bg-slate-800 hover:bg-orange-600 rounded flex items-center justify-center transition text-slate-200 hover:text-white"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <div></div>

                        <button
                          type="button"
                          onClick={() => setImgXOffset(prev => Math.max(-100, prev - 5))}
                          className="p-1.5 bg-slate-800 hover:bg-orange-600 rounded flex items-center justify-center transition text-slate-200 hover:text-white"
                          title="تحريك لليمين"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImgXOffset(0); setImgYOffset(0); setImgZoom(1.0); }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-[9px] font-bold text-slate-400 hover:text-white transition"
                          title="إعادة للوسط"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setImgXOffset(prev => Math.min(100, prev + 5))}
                          className="p-1.5 bg-slate-800 hover:bg-orange-600 rounded flex items-center justify-center transition text-slate-200 hover:text-white"
                          title="تحريك لليسار"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>

                        <div></div>
                        <button
                          type="button"
                          onClick={() => setImgYOffset(prev => Math.min(100, prev + 5))}
                          className="p-1.5 bg-slate-800 hover:bg-orange-600 rounded flex items-center justify-center transition text-slate-200 hover:text-white"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <div></div>
                      </div>
                    </div>

                    {/* Precision Sliders */}
                    <div className="space-y-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                      
                      {/* X Offset */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 w-24">إزاحة أفقية (X):</span>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={imgXOffset}
                          onChange={(e) => setImgXOffset(Number(e.target.value))}
                          className="flex-1 accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="font-mono text-orange-400 w-10 text-left">{imgXOffset}%</span>
                      </div>

                      {/* Y Offset */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 w-24">إزاحة رأسية (Y):</span>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          step="1"
                          value={imgYOffset}
                          onChange={(e) => setImgYOffset(Number(e.target.value))}
                          className="flex-1 accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="font-mono text-orange-400 w-10 text-left">{imgYOffset}%</span>
                      </div>

                      {/* Zoom */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 w-24">تكبير/تصغير:</span>
                        <input
                          type="range"
                          min="0.5"
                          max="3.0"
                          step="0.05"
                          value={imgZoom}
                          onChange={(e) => setImgZoom(Number(e.target.value))}
                          className="flex-1 accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="font-mono text-orange-400 w-10 text-left">{imgZoom.toFixed(2)}x</span>
                      </div>

                      {/* Frame Height */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <span className="text-slate-400 w-24">ارتفاع إطار الصورة:</span>
                        <input
                          type="range"
                          min="70"
                          max="160"
                          step="1"
                          value={imgFrameHeight}
                          onChange={(e) => setImgFrameHeight(Number(e.target.value))}
                          className="flex-1 accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="font-mono text-orange-400 w-10 text-left">{imgFrameHeight}px</span>
                      </div>

                      {/* Image Fit Mode */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-slate-400 w-24">نمط ملاءمة الصورة:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImgFit('contain')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              imgFit === 'contain'
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            احتواء كامل (Contain)
                          </button>
                          <button
                            type="button"
                            onClick={() => setImgFit('cover')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              imgFit === 'cover'
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            ملء الإطار (Cover)
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'جاري الحفظ في Firestore...' : editingProduct ? 'حفظ تعديلات المنتج' : 'حفظ ونشر المنتج'}</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 3: CATEGORY MANAGEMENT & DELETE FULL CATEGORY */}
          {activeTab === 'category' && (
            <div className="space-y-6 text-right">
              
              {/* Category Delete In-App Confirmation Banner */}
              {categoryToDelete && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>تأكيد حذف القسم بالكامل: "{categoryToDelete.name}"</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    سيتم مسح هذا القسم مع جميع المنتجات التابعة له ({categoryToDelete.count} منتج) نهائياً من الكتالوج والسحابة.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmDeleteCategory}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      نعم، احذف القسم ومنتجاته الآن
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(null)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Categories List with 1-Click Delete Full Category */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <span>الأقسام الحالية وخيارات الحذف الكامل:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => {
                    const catProductsCount = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {cat.mainCarImageUrl ? (
                            <img
                              src={cat.mainCarImageUrl}
                              alt={cat.name}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
                              بدون
                            </div>
                          )}
                          <div>
                            <h5 className="font-bold text-xs text-slate-900">{cat.name}</h5>
                            <p className="text-[11px] text-slate-500">{cat.carModel}</p>
                            <span className="inline-block mt-0.5 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.2 rounded font-bold">
                              {catProductsCount} منتج
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(cat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold border border-blue-200 transition-colors"
                            title="تعديل اسم وموديل وصورة هذا القسم"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCategoryToDelete({
                                id: cat.id,
                                name: cat.name,
                                count: catProductsCount
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold border border-rose-200 transition-colors"
                            title="حذف هذا القسم وكافة منتجاته من Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add / Edit Category Form */}
              <form id="category-edit-form" onSubmit={handleSubmitCategory} className="space-y-4 pt-4 border-t border-slate-200">
                
                {categoryFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{categoryFormError}</span>
                  </div>
                )}

                {editingCatId ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <Pencil className="w-4 h-4 text-blue-600" />
                      <span>أنت الآن في وضع تعديل بيانات وصورة القسم: "{catName}"</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-300 transition-colors"
                    >
                      إلغاء التعديل
                    </button>
                  </div>
                ) : (
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-orange-600" />
                    <span>إنشاء قسم سيارة جديد:</span>
                  </h4>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">اسم القسم *</label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="مثال: اكسسوارات هافال H6"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">موديل السيارة *</label>
                    <input
                      type="text"
                      value={catCarModel}
                      onChange={(e) => setCatCarModel(e.target.value)}
                      placeholder="مثال: Haval H6"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">صورة السيارة أو القسم الرئيسية</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={catMainImageUrl}
                      onChange={(e) => setCatMainImageUrl(e.target.value)}
                      placeholder="رابط صورة السيارة أو ارفع من جهازك..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {catMainImageUrl && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <img
                        src={catMainImageUrl}
                        alt="معاينة صورة القسم"
                        className="w-16 h-10 object-cover rounded border border-slate-200"
                      />
                      <span className="text-[11px] text-slate-600 font-bold">معاينة صورة القسم الحالية</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      إلغاء
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-6 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'جاري الحفظ...' : editingCatId ? 'حفظ تعديلات القسم' : 'إنشاء القسم'}</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 4: IMPORT / EXPORT (STANDARD EXCEL / CSV) */}
          {activeTab === 'import_export' && (
            <div className="space-y-4 text-right">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  الصق بيانات المنتجات بصيغة جدولية (اسم المنتج	السعر	الباركود):
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-600">القسم المستهدف للاستيراد:</span>
                  <select
                    value={importCatId}
                    onChange={(e) => setImportCatId(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`اسم المنتج	السعر	الباركود
هافال - حماية ابواب	89	1001042001
هافال - كفر المكيف	89	1001042003`}
                  rows={6}
                  className="w-full bg-slate-900 text-white font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-500 leading-relaxed text-right"
                />

                {importNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold">
                    {importNotice}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleProcessImport}
                    className="inline-flex items-center gap-1.5 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>بدء الاستيراد والحفظ في قاعدة البيانات</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUPABASE CLOUD DATABASE SYNC & STATUS */}
          {activeTab === 'supabase_sync' && (
            <div className="space-y-6 text-right font-sans">
              
              {/* Header Info Banner */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                      <span>قاعدة بيانات Supabase السحابية (متصلة ونشطة)</span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-black">مجانية 100% وبدون قيود قراءة</span>
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 font-mono">
                      {SUPABASE_URL}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>متصل الآن</span>
                  </span>
                </div>
              </div>

              {/* Status & Migration Action */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">نقل ومزامنة جميع البيانات إلى Supabase السحابية بنقرة واحدة</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      يقوم هذا الإجراء برفع كافة الأقسام الحالية ({categories.length} قسم) وجميع المنتجات ({products.length} منتج) بكامل صورها وتفاصيلها إلى خوادم Supabase فوراً.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Direct Firebase Fetch & Sync Button */}
                    <button
                      type="button"
                      disabled={supabaseSyncStatus === 'syncing'}
                      onClick={async () => {
                        setSupabaseSyncStatus('syncing');
                        setSupabaseSyncMessage('جاري نقل ورفع كافة البيانات والنسخ الاحتياطية إلى Supabase...');
                        try {
                          const res = await fetch('/api/trigger-migration', { method: 'POST' });
                          const json = await res.json();

                          if (json.success) {
                            setSupabaseSyncStatus('success');
                            setSupabaseSyncMessage(json.message || 'تم بنجاح نقل كافة البيانات من Firebase إلى Supabase!');
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          } else {
                            // Direct upload from loaded memory / backup
                            await bulkSaveProductsToDb(products, categories);
                            setSupabaseSyncStatus('success');
                            setSupabaseSyncMessage(`تم بنجاح رفع وتثبيت البيانات كاملة (${products.length} منتج و ${categories.length} أقسام) في قاعدة بيانات Supabase!`);
                          }
                        } catch (err: any) {
                          console.error(err);
                          try {
                            await bulkSaveProductsToDb(products, categories);
                            setSupabaseSyncStatus('success');
                            setSupabaseSyncMessage(`تم بنجاح رفع البيانات المعروضة (${products.length} منتج) إلى Supabase!`);
                          } catch (fallbackErr: any) {
                            setSupabaseSyncStatus('error');
                            setSupabaseSyncMessage(`حالة الفحص: ${err?.message || 'تعذر استكمال الاتصال'}`);
                          }
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0 disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 ${supabaseSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>تحديث ومزامنة البيانات مع Supabase 🚀</span>
                    </button>

                    <button
                      type="button"
                      disabled={supabaseSyncStatus === 'syncing'}
                      onClick={async () => {
                        setSupabaseSyncStatus('syncing');
                        setSupabaseSyncMessage('جاري رفع ونقل البيانات والصور إلى Supabase...');
                        try {
                          await bulkSaveProductsToDb(products, categories);
                          setSupabaseSyncStatus('success');
                          setSupabaseSyncMessage(`تم بنجاح رفع ${products.length} منتجاً و ${categories.length} قسماً إلى Supabase السحابية!`);
                        } catch (err: any) {
                          console.error(err);
                          setSupabaseSyncStatus('error');
                          setSupabaseSyncMessage(`حدث تنبيه أثناء المزامنة: ${err?.message || 'تم حفظ النسخة محلياً'}`);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>رفع الكتالوج المعروض إلى Supabase</span>
                    </button>
                  </div>
                </div>

                {/* Live Message */}
                {supabaseSyncMessage && (
                  <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                    supabaseSyncStatus === 'success'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : supabaseSyncStatus === 'error'
                      ? 'bg-amber-50 border border-amber-300 text-amber-900'
                      : 'bg-blue-50 border border-blue-300 text-blue-900'
                  }`}>
                    {supabaseSyncStatus === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <span>{supabaseSyncMessage}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 block font-bold">عدد الأقسام</span>
                    <span className="text-lg font-black text-slate-900">{categories.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 block font-bold">عدد المنتجات</span>
                    <span className="text-lg font-black text-slate-900">{products.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 block font-bold">نوع الاتصال</span>
                    <span className="text-xs font-black text-emerald-700">Realtime & REST</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 block font-bold">استهلاك الحصة</span>
                    <span className="text-xs font-black text-emerald-700">غير محدود (Free)</span>
                  </div>
                </div>
              </div>

              {/* SQL Schema helper */}
              <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">كود إنشاء الجداول (SQL Editor Schema):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'تم نسخ الـ SQL!' : 'نسخ كود الـ SQL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  (اختياري): يمكنك نسخه ولصقه في تبويب <strong>SQL Editor</strong> داخل لوحة تحكم Supabase والضغط على <strong>Run</strong> لإنشاء الجداول الرسمية إذا رغبت.
                </p>
                <pre className="p-3 bg-slate-950 rounded-xl text-[10px] text-slate-300 font-mono overflow-x-auto max-h-44 text-left dir-ltr">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Product Image Picker Modal (Copy image from any existing product) */}
      <ProductImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        products={products}
        categories={categories}
        currentProductId={editingProduct?.id}
        onSelectImage={(url, transform, sourceName) => {
          setProductImageUrl(url);
          if (transform) {
            if (transform.xOffset !== undefined) setImgXOffset(transform.xOffset);
            if (transform.yOffset !== undefined) setImgYOffset(transform.yOffset);
            if (transform.zoom !== undefined) setImgZoom(transform.zoom);
            if (transform.fit) setImgFit(transform.fit);
            if (transform.frameHeight) setImgFrameHeight(transform.frameHeight);
          }
          setCopiedImageNotice(`تم نسخ صورة ومحاذاة: ${sourceName || 'المنتج'}`);
          setTimeout(() => setCopiedImageNotice(''), 4000);
        }}
      />
    </div>
  );
};
