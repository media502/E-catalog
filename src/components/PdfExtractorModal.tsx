import React, { useState, useRef, useEffect } from 'react';
import { Product, CarCategory } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { bulkSaveProductsToDb } from '../supabase';
import { removeImageBackground, upscaleAndEnhanceImage } from '../utils/imageEnhancer';
import { 
  Upload, 
  Check, 
  Image as ImageIcon, 
  X, 
  RefreshCw,
  FolderUp,
  Zap,
  CheckCircle2,
  Eye,
  Sliders,
  Car,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings2,
  Sparkles,
  FileImage,
  AlertTriangle,
  Plus,
  Wand2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// Import worker URL directly via Vite
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker URL
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
} catch (e) {
  console.warn('PDF.js worker init fallback:', e);
}

interface PdfExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories?: CarCategory[];
  activeCategoryId?: string;
  onSaveCategory?: (cat: Partial<CarCategory>) => Promise<void> | void;
  onSuccess: (updatedProducts: Product[], updatedCategory?: CarCategory) => void;
}

interface PageCanvasData {
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
}

interface ProductCropState {
  productId: string;
  pageNum: number;
  baseBox: { ymin: number; xmin: number; ymax: number; xmax: number }; // 0..1000 normalized
  xOffsetPercent: number; // in %
  yOffsetPercent: number; // in %
  zoom: number; // scale multiplier e.g. 1.0
  source: 'geometric' | 'ai_vision';
}

// Exact Page distribution for LYK-900 53-Product Catalog
const PAGE_PRODUCTS_CONFIG: { [pageNum: number]: { startIdx: number; count: number; cols: number; rows: number } } = {
  1: { startIdx: 0, count: 6, cols: 2, rows: 3 },
  2: { startIdx: 6, count: 10, cols: 2, rows: 5 },
  3: { startIdx: 16, count: 10, cols: 2, rows: 5 },
  4: { startIdx: 26, count: 10, cols: 2, rows: 5 },
  5: { startIdx: 36, count: 10, cols: 2, rows: 5 },
  6: { startIdx: 46, count: 7, cols: 2, rows: 4 },
};

export const PdfExtractorModal: React.FC<PdfExtractorModalProps> = ({
  isOpen,
  onClose,
  products,
  categories = [],
  activeCategoryId,
  onSaveCategory,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Stored canvases for real-time manual cropping adjustments
  const pageCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [pages, setPages] = useState<PageCanvasData[]>([]);
  
  // Crop state & generated data URLs
  const [cropStates, setCropStates] = useState<{ [productId: string]: ProductCropState }>({});
  const [extractedMap, setExtractedMap] = useState<{ [productId: string]: string }>({});
  const [extractedCarImage, setExtractedCarImage] = useState<string | null>(null);
  const [carImageSaved, setCarImageSaved] = useState<boolean>(false);
  
  // Category Destination State
  const initialCatId = (activeCategoryId && activeCategoryId !== 'all') 
    ? activeCategoryId 
    : (categories.find(c => c.id === 'cat-lyk-900')?.id || categories[0]?.id || 'cat-lyk-900');

  const [targetCategoryId, setTargetCategoryId] = useState<string>(initialCatId);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState<boolean>(false);
  const [catNameInput, setCatNameInput] = useState<string>('قسم لكزس LYK-900');
  const [catCarModelInput, setCatCarModelInput] = useState<string>('LYK-900 / 2024');
  const [catHeaderTitleInput, setCatHeaderTitleInput] = useState<string>('أكسسوارات حصرية لسيارات LYK-900');

  // Synchronize category inputs when target category changes
  useEffect(() => {
    if (!isCreatingNewCategory) {
      const selected = categories.find(c => c.id === targetCategoryId);
      if (selected) {
        setCatNameInput(selected.name);
        setCatCarModelInput(selected.carModel);
        setCatHeaderTitleInput(selected.headerTitle || selected.name);
        if (!extractedCarImage && selected.mainCarImageUrl) {
          setExtractedCarImage(selected.mainCarImageUrl);
        }
      }
    }
  }, [targetCategoryId, categories, isCreatingNewCategory]);

  // Active viewing tab
  const [activeTab, setActiveTab] = useState<'auto_results' | 'pdf_pages' | 'bulk_images'>('auto_results');
  const [isSaving, setIsSaving] = useState(false);

  // Single Product Interactive Fine-Tuning Modal State
  const [activeTuningProductId, setActiveTuningProductId] = useState<string | null>(null);
  const [isTuningBgRemoving, setIsTuningBgRemoving] = useState(false);
  const [isTuningUpscaling, setIsTuningUpscaling] = useState(false);
  const [tuningNotice, setTuningNotice] = useState('');

  // Global Fine-Tuning Nudge (All items)
  const [globalXOffset, setGlobalXOffset] = useState<number>(0);
  const [globalYOffset, setGlobalYOffset] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageImagesInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Ensure we dynamically target the products of selected category
  const targetCategoryProducts = products.filter(p => p.categoryId === targetCategoryId);
  const baseLykList = INITIAL_PRODUCTS.filter(p => p.categoryId === 'cat-lyk-900' || p.barcode.startsWith('1001200'));
  const targetProductsList = targetCategoryProducts.length > 0 
    ? targetCategoryProducts 
    : (products.filter(p => p.categoryId === 'cat-lyk-900').length >= 50 ? products.filter(p => p.categoryId === 'cat-lyk-900') : baseLykList);

  if (!isOpen) return null;

  // Helper to re-generate crop data URL from a crop state
  const renderProductCrop = (cropState: ProductCropState): string | null => {
    const canvas = pageCanvasesRef.current.get(cropState.pageNum);
    if (!canvas) return null;

    const { baseBox, xOffsetPercent, yOffsetPercent, zoom } = cropState;
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // Base dimensions in pixels
    let boxX = (baseBox.xmin / 1000) * canvasW;
    let boxY = (baseBox.ymin / 1000) * canvasH;
    let boxW = ((baseBox.xmax - baseBox.xmin) / 1000) * canvasW;
    let boxH = ((baseBox.ymax - baseBox.ymin) / 1000) * canvasH;

    // Apply offset nudges
    boxX += (xOffsetPercent / 100) * canvasW;
    boxY += (yOffsetPercent / 100) * canvasH;

    // Apply zoom around box center
    if (zoom !== 1) {
      const centerX = boxX + boxW / 2;
      const centerY = boxY + boxH / 2;
      boxW = boxW / zoom;
      boxH = boxH / zoom;
      boxX = centerX - boxW / 2;
      boxY = centerY - boxH / 2;
    }

    // Clamp coordinates safely
    boxX = Math.max(0, Math.min(canvasW - 10, boxX));
    boxY = Math.max(0, Math.min(canvasH - 10, boxY));
    boxW = Math.min(canvasW - boxX, boxW);
    boxH = Math.min(canvasH - boxY, boxH);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 450;
    cropCanvas.height = 450;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return null;

    // Clear background to clean white
    cropCtx.fillStyle = '#FFFFFF';
    cropCtx.fillRect(0, 0, 450, 450);

    cropCtx.drawImage(canvas, boxX, boxY, boxW, boxH, 0, 0, 450, 450);
    return cropCanvas.toDataURL('image/jpeg', 0.92);
  };

  // Nudge individual product
  const adjustProductCrop = (
    productId: string, 
    dx: number, 
    dy: number, 
    dZoom: number = 0, 
    reset: boolean = false
  ) => {
    const currentCrop = cropStates[productId];
    if (!currentCrop) return;

    const updatedCrop: ProductCropState = {
      ...currentCrop,
      xOffsetPercent: reset ? 0 : currentCrop.xOffsetPercent + dx,
      yOffsetPercent: reset ? 0 : currentCrop.yOffsetPercent + dy,
      zoom: reset ? 1.0 : Math.max(0.5, Math.min(2.5, currentCrop.zoom + dZoom)),
    };

    const newUrl = renderProductCrop(updatedCrop);
    if (newUrl) {
      setCropStates(prev => ({ ...prev, [productId]: updatedCrop }));
      setExtractedMap(prev => ({ ...prev, [productId]: newUrl }));
    }
  };

  // Set precise crop parameters
  const setProductCropParams = (
    productId: string,
    params: Partial<{ xOffsetPercent: number; yOffsetPercent: number; zoom: number }>
  ) => {
    const currentCrop = cropStates[productId];
    if (!currentCrop) return;

    const updatedCrop: ProductCropState = {
      ...currentCrop,
      ...params,
    };

    const newUrl = renderProductCrop(updatedCrop);
    if (newUrl) {
      setCropStates(prev => ({ ...prev, [productId]: updatedCrop }));
      setExtractedMap(prev => ({ ...prev, [productId]: newUrl }));
    }
  };

  // Process Page Canvas and Segment Products
  const segmentPageCanvas = (
    canvas: HTMLCanvasElement, 
    pageNum: number, 
    newCropStates: { [id: string]: ProductCropState },
    newExtractedMap: { [id: string]: string }
  ) => {
    const pageConfig = PAGE_PRODUCTS_CONFIG[pageNum] || {
      startIdx: (pageNum - 1) * 10,
      count: 10,
      cols: 2,
      rows: 5,
    };

    const { startIdx, count, cols, rows } = pageConfig;
    
    // Page 1 has header banner, others have standard margins
    const topMargin = pageNum === 1 ? canvas.height * 0.125 : canvas.height * 0.038;
    const bottomMargin = canvas.height * 0.035;
    const availableH = canvas.height - topMargin - bottomMargin;
    const cellH = availableH / rows;

    const leftMargin = canvas.width * 0.025;
    const rightMargin = canvas.width * 0.025;
    const availableW = canvas.width - leftMargin - rightMargin;
    const cellW = availableW / cols;

    for (let i = 0; i < count; i++) {
      const targetProd = targetProductsList[startIdx + i];
      if (!targetProd) continue;

      const r = Math.floor(i / cols);
      const c = i % cols;
      const cellX = leftMargin + c * cellW;
      const cellY = topMargin + r * cellH;

      // Product image is situated on the RIGHT half of the catalog cell
      const imgBoxW = cellW * 0.48;
      const imgBoxH = cellH * 0.88;
      const imgBoxX = cellX + cellW * 0.49;
      const imgBoxY = cellY + cellH * 0.06;

      const baseBox = {
        ymin: Math.round((imgBoxY / canvas.height) * 1000),
        xmin: Math.round((imgBoxX / canvas.width) * 1000),
        ymax: Math.round(((imgBoxY + imgBoxH) / canvas.height) * 1000),
        xmax: Math.round(((imgBoxX + imgBoxW) / canvas.width) * 1000),
      };

      const cropState: ProductCropState = {
        productId: targetProd.id,
        pageNum,
        baseBox,
        xOffsetPercent: 0,
        yOffsetPercent: 0,
        zoom: 1.0,
        source: 'geometric',
      };
      newCropStates[targetProd.id] = cropState;
      const croppedUrl = renderProductCrop(cropState);
      if (croppedUrl) {
        newExtractedMap[targetProd.id] = croppedUrl;
      }
    }
  };

  // High-Speed Instant PDF Processor
  const processPdfFile = async (uploadedFile: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(10);
    setProgressText('جاري فتح ملف الـ PDF ورسم الصفحات بدقة عالية...');

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      
      // Ensure worker is set
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      }

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const loadedPages: PageCanvasData[] = [];
      const canvasMap = new Map<number, HTMLCanvasElement>();
      const newCropStates: { [productId: string]: ProductCropState } = {};
      const newExtractedMap: { [productId: string]: string } = {};
      let carBannerDataUrl: string | null = null;

      for (let pageNum = 1; pageNum <= Math.min(numPages, 6); pageNum++) {
        setProgressPercent(Math.round(15 + (pageNum / Math.min(numPages, 6)) * 75));
        setProgressText(`جاري استخراج صور المنتجات الواقعة يمين الباركود من صفحة ${pageNum} من ${numPages}...`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (!context) continue;

        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        canvasMap.set(pageNum, canvas);

        const pageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        loadedPages.push({
          pageNum,
          dataUrl: pageDataUrl,
          width: viewport.width,
          height: viewport.height,
        });

        // 0. Extract Top Car Header Banner from Page 1
        if (pageNum === 1 && !carBannerDataUrl) {
          try {
            const carCropCanvas = document.createElement('canvas');
            carCropCanvas.width = 800;
            carCropCanvas.height = 360;
            const carCtx = carCropCanvas.getContext('2d');
            if (carCtx) {
              const carX = viewport.width * 0.30;
              const carY = viewport.height * 0.015;
              const carW = viewport.width * 0.66;
              const carH = viewport.height * 0.098;
              carCtx.drawImage(canvas, carX, carY, carW, carH, 0, 0, 800, 360);
              carBannerDataUrl = carCropCanvas.toDataURL('image/jpeg', 0.92);
            }
          } catch (e) {
            console.error('Error extracting car header:', e);
          }
        }

        // Segment items on this page
        pageCanvasesRef.current = canvasMap;
        segmentPageCanvas(canvas, pageNum, newCropStates, newExtractedMap);
      }

      setPages(loadedPages);
      setCropStates(newCropStates);
      setExtractedMap(newExtractedMap);
      if (carBannerDataUrl) {
        setExtractedCarImage(carBannerDataUrl);
      }

      const totalCount = Object.keys(newExtractedMap).length;
      setProgressPercent(100);
      setProgressText(`⚡ تم بنجاح استخراج صور ${totalCount} منتجاً! يمكنك الآن ضبط أي صورة أو حفظها مباشرة.`);
      setActiveTab('auto_results');
    } catch (err: any) {
      console.error('Error during auto extraction:', err);
      setErrorMessage(`تعذر قراءة ملف الـ PDF: ${err.message || 'يرجى تجربة رفع صفحات الكتالوج كصور أو التأكد من سلامة ملف الـ PDF'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Catalog Page Images (JPG / PNG / WebP)
  const handlePageImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Reset old state cleanly
    pageCanvasesRef.current.clear();
    setPages([]);
    setCropStates({});
    setExtractedMap({});
    setExtractedCarImage(null);
    setCarImageSaved(false);

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(20);
    setProgressText('جاري قراءة صور صفحات الكتالوج وتقطيع المنتجات...');

    try {
      const fileList: File[] = Array.from(files);
      fileList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      const loadedPages: PageCanvasData[] = [];
      const canvasMap = new Map<number, HTMLCanvasElement>();
      const newCropStates: { [productId: string]: ProductCropState } = {};
      const newExtractedMap: { [productId: string]: string } = {};
      let carBannerDataUrl: string | null = null;

      for (let i = 0; i < fileList.length; i++) {
        const pageNum = i + 1;
        const imgFile = fileList[i];
        
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imgFile);
        });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(img, 0, 0);
        canvasMap.set(pageNum, canvas);

        loadedPages.push({
          pageNum,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
        });

        // Extract Car Header from Page 1
        if (pageNum === 1 && !carBannerDataUrl) {
          const carCropCanvas = document.createElement('canvas');
          carCropCanvas.width = 800;
          carCropCanvas.height = 360;
          const carCtx = carCropCanvas.getContext('2d');
          if (carCtx) {
            const carX = canvas.width * 0.30;
            const carY = canvas.height * 0.015;
            const carW = canvas.width * 0.66;
            const carH = canvas.height * 0.098;
            carCtx.drawImage(canvas, carX, carY, carW, carH, 0, 0, 800, 360);
            carBannerDataUrl = carCropCanvas.toDataURL('image/jpeg', 0.92);
          }
        }

        pageCanvasesRef.current = canvasMap;
        segmentPageCanvas(canvas, pageNum, newCropStates, newExtractedMap);
      }

      setPages(loadedPages);
      setCropStates(newCropStates);
      setExtractedMap(newExtractedMap);
      if (carBannerDataUrl) {
        setExtractedCarImage(carBannerDataUrl);
      }

      const totalCount = Object.keys(newExtractedMap).length;
      setProgressPercent(100);
      setProgressText(`⚡ تم بنجاح استخراج صور ${totalCount} منتجاً من صفحات الصور!`);
      setActiveTab('auto_results');
    } catch (err: any) {
      console.error('Error processing page images:', err);
      setErrorMessage(`حدث خطأ أثناء معالجة صور الصفحات: ${err.message}`);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAutoExtractFromPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.endsWith('.pdf')) {
      alert('يرجى اختيار ملف PDF صالح');
      return;
    }

    // Reset previous cached states completely
    pageCanvasesRef.current.clear();
    setPages([]);
    setCropStates({});
    setExtractedMap({});
    setExtractedCarImage(null);
    setCarImageSaved(false);

    setFile(uploadedFile);
    await processPdfFile(uploadedFile);
    if (e.target) e.target.value = '';
  };

  // Apply Global Fine Tuning to All Products
  const handleApplyGlobalOffset = (dx: number, dy: number) => {
    setGlobalXOffset(dx);
    setGlobalYOffset(dy);

    const updatedCrops = { ...cropStates };
    const updatedExtracted = { ...extractedMap };

    Object.keys(updatedCrops).forEach(prodId => {
      const crop = updatedCrops[prodId];
      const newCrop: ProductCropState = {
        ...crop,
        xOffsetPercent: dx,
        yOffsetPercent: dy,
      };
      updatedCrops[prodId] = newCrop;
      const url = renderProductCrop(newCrop);
      if (url) {
        updatedExtracted[prodId] = url;
      }
    });

    setCropStates(updatedCrops);
    setExtractedMap(updatedExtracted);
  };

  // Apply Extracted Car Image to Category
  const handleApplyCarImageToCategory = async () => {
    if (!extractedCarImage) return;
    try {
      let targetCat = categories.find(c => c.id === targetCategoryId);
      if (!targetCat && categories.length > 0) {
        targetCat = categories[0];
      }
      
      const updatedCat: Partial<CarCategory> = {
        ...(targetCat || { id: targetCategoryId }),
        name: catNameInput.trim() || targetCat?.name || 'قسم مستخرج',
        carModel: catCarModelInput.trim() || targetCat?.carModel || 'سيارة جديدة',
        headerTitle: catHeaderTitleInput.trim() || catNameInput.trim() || 'اكسسوارات السيارة',
        mainCarImageUrl: extractedCarImage,
      };

      if (onSaveCategory) {
        await onSaveCategory(updatedCat);
      }
      setCarImageSaved(true);
      setTimeout(() => setCarImageSaved(false), 3000);
      alert('✅ تم تعيين وحفظ صورة سيارة الكتالوج الرئيسية للقسم بنجاح!');
    } catch (err: any) {
      console.error('Error saving car image:', err);
      alert(`حدث خطأ أثناء حفظ صورة القسم: ${err.message || 'يرجى المحاولة مجدداً'}`);
    }
  };

  // Handle Bulk Image Upload from local folder
  const handleBulkImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newMap = { ...extractedMap };

    Array.from(files as Iterable<File>).forEach((imgFile: File) => {
      const fileName = imgFile.name.toLowerCase();
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const matchedProd = targetProductsList.find(p => 
          fileName.includes(p.barcode) || 
          fileName.includes(p.name.toLowerCase()) ||
          fileName.includes(p.id.toLowerCase())
        );

        if (matchedProd) {
          newMap[matchedProd.id] = dataUrl;
        }
        setExtractedMap({ ...newMap });
      };
      reader.readAsDataURL(imgFile);
    });

    setIsProcessing(false);
    setActiveTab('auto_results');
  };

  // Save all extracted images into Firestore & App State (Category + Products together)
  const handleSaveAllToDatabase = async () => {
    const updatedIds = Object.keys(extractedMap);
    if (updatedIds.length === 0) {
      alert('لم يتم استخراج أي صور بعد.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      // 1. Prepare Category (Existing or Newly Created)
      const existingCat = categories.find(c => c.id === targetCategoryId);
      let finalCategory: CarCategory;

      if (isCreatingNewCategory || !existingCat) {
        const generatedCatId = isCreatingNewCategory ? `cat-${Date.now()}` : targetCategoryId;
        finalCategory = {
          id: generatedCatId,
          name: catNameInput.trim() || 'قسم مستخرج جديد',
          carModel: catCarModelInput.trim() || 'موديل السيارة',
          headerTitle: catHeaderTitleInput.trim() || catNameInput.trim() || 'اكسسوارات السيارة',
          mainCarImageUrl: extractedCarImage || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
          order: categories.length + 1,
        };
      } else {
        finalCategory = {
          ...existingCat,
          name: catNameInput.trim() || existingCat.name,
          carModel: catCarModelInput.trim() || existingCat.carModel,
          headerTitle: catHeaderTitleInput.trim() || existingCat.headerTitle || existingCat.name,
          mainCarImageUrl: extractedCarImage || existingCat.mainCarImageUrl,
        };
      }

      // 2. Map all extracted products to this categoryId
      const finalCatId = finalCategory.id;
      const updatedProductsList = (products.length >= targetProductsList.length ? products : targetProductsList).map(p => {
        if (extractedMap[p.id]) {
          return { 
            ...p, 
            categoryId: finalCatId,
            imageUrl: extractedMap[p.id], 
            updatedAt: new Date().toISOString() 
          };
        }
        return p;
      });

      const changedProducts = updatedProductsList.filter(p => extractedMap[p.id]);

      // 3. Atomically save Category & all Products to Firestore
      await bulkSaveProductsToDb(changedProducts, [finalCategory]);
      if (onSaveCategory) {
        await onSaveCategory(finalCategory);
      }

      // 4. Update UI State in App
      onSuccess(updatedProductsList, finalCategory);
      alert(`🎉 تم بنجاح حفظ وتحديث القسم "${finalCategory.name}" وربط ${changedProducts.length} منتجاً في قاعدة البيانات السحابية والمتجر!`);
      onClose();
    } catch (err: any) {
      console.error('Error saving extracted images and category:', err);
      setErrorMessage(`حدث خطأ أثناء حفظ القسم والمنتجات: ${err.message || 'يرجى المحاولة مجدداً'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const extractedList = targetProductsList.filter(p => !!extractedMap[p.id]);
  const activeTuningProduct = activeTuningProductId 
    ? targetProductsList.find(p => p.id === activeTuningProductId) 
    : null;
  const activeTuningCrop = activeTuningProductId 
    ? cropStates[activeTuningProductId] 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-white">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10 shrink-0">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  استخراج وتخصيص صور الكتالوج (يمين الباركود)
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  فوري &lt; 2 ثانية
                </span>
              </div>
              <p className="text-xs text-slate-400">
                قص واستخراج صور جميع المنتجات الـ 53 الواقعة يمين الباركود فوراً، مع إمكانية تحريك وضبط أي صورة مباشرة.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Tab Bar */}
        <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('auto_results')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'auto_results'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              الصور المستخرجة ({extractedList.length}/{targetProductsList.length})
            </button>

            {pages.length > 0 && (
              <button
                onClick={() => setActiveTab('pdf_pages')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'pdf_pages'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                معاينة الصفحات ({pages.length})
              </button>
            )}

            <button
              onClick={() => setActiveTab('bulk_images')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'bulk_images'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FolderUp className="w-3.5 h-3.5" />
              مجلد صور محلي
            </button>
          </div>

          {/* Controls: PDF Upload & Page Images Upload */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAutoExtractFromPdf}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            <input
              type="file"
              ref={pageImagesInputRef}
              onChange={handlePageImagesUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
              title="رفع ملف كتالوج PDF"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {file ? 'إعادة رفع PDF' : '⚡ اختيار ملف PDF'}
            </button>

            <button
              onClick={() => pageImagesInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              title="إذا كانت لديك صفحات الكتالوج كصور JPG أو PNG أو لقطات شاشة"
            >
              <FileImage className="w-3.5 h-3.5 text-amber-400" />
              رفع صفحات الكتالوج كصور (JPG/PNG)
            </button>

            {extractedList.length > 0 && (
              <button
                onClick={handleSaveAllToDatabase}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                حفظ في المتجر ({extractedList.length})
              </button>
            )}
          </div>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800 px-5 py-3 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress Bar when loading */}
        {isProcessing && (
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800">
            <div className="flex items-center justify-between text-xs text-orange-300 font-bold mb-1.5">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {progressText}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950/40">
          
          {activeTab === 'auto_results' && (
            extractedList.length === 0 ? (
              /* Empty / Upload Prompt State */
              <div className="max-w-xl mx-auto my-10 text-center p-8 bg-slate-900/80 border-2 border-dashed border-orange-500/30 rounded-3xl shadow-2xl">
                <div className="w-20 h-20 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4 border border-orange-500/20 shadow-inner">
                  <Zap className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  الاستخراج الفوري لصور الكتالوج
                </h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  اختر ملف كتالوج الـ PDF أو صور صفحات الكتالوج (JPG/PNG)، وسيقوم النظام فوراً بقص جميع الصور الـ 53 الواقعة يمين الباركود.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4" />
                    اختيار ملف كتالوج PDF
                  </button>

                  <button
                    onClick={() => pageImagesInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 flex items-center justify-center gap-2 transition"
                  >
                    <FileImage className="w-4 h-4 text-amber-400" />
                    رفع صور الصفحات (JPG/PNG)
                  </button>
                </div>
              </div>
            ) : (
              /* Extracted Grid Cards */
              <div className="space-y-4">
                {/* 1. Category & Car Banner Configuration Card */}
                <div className="bg-slate-900/95 p-4 rounded-xl border border-orange-500/30 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          بيانات وقسم الكتالوج المستخرج (السيارة والغلاف)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          اختر القسم لحفظ المنتجات وصورة سيارة الكتالوج أو أنشئ قسماً جديداً
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewCategory(!isCreatingNewCategory)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold border border-slate-700 flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCreatingNewCategory ? 'اختيار من الأقسام الحالية' : '➕ إنشاء قسم جديد'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Selection or New Category Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {!isCreatingNewCategory ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          القسم المستهدف:
                        </label>
                        <select
                          value={targetCategoryId}
                          onChange={(e) => setTargetCategoryId(e.target.value)}
                          className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.carModel})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          اسم القسم الجديد:
                        </label>
                        <input
                          type="text"
                          value={catNameInput}
                          onChange={(e) => setCatNameInput(e.target.value)}
                          placeholder="مثال: قسم لكزس LYK-900"
                          className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        موديل السيارة:
                      </label>
                      <input
                        type="text"
                        value={catCarModelInput}
                        onChange={(e) => setCatCarModelInput(e.target.value)}
                        placeholder="مثال: LYK-900 / 2024"
                        className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        عنوان ترويسة المتجر:
                      </label>
                      <input
                        type="text"
                        value={catHeaderTitleInput}
                        onChange={(e) => setCatHeaderTitleInput(e.target.value)}
                        placeholder="مثال: أكسسوارات حصرية لسيارات LYK-900"
                        className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Extracted Car Banner Preview */}
                  {extractedCarImage && (
                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={extractedCarImage}
                          alt="Car Banner"
                          className="w-36 sm:w-48 h-14 object-cover rounded-md border border-orange-500/40 bg-white"
                        />
                        <div>
                          <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                            صورة سيارة الكتالوج الرئيسية (أعلى PDF)
                          </span>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            سيتم اعتماد هذه الصورة كغلاف رسمي للقسم عند الحفظ.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyCarImageToCategory}
                        disabled={carImageSaved}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                          carImageSaved
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{carImageSaved ? 'تم حفظ صورة القسم ✓' : 'حفظ صورة القسم فقط'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Global Nudge & Controls Toolbar */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-white">
                      تم استخراج صور {extractedList.length} من أصل {targetProductsList.length} منتجاً
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      (استخدم أزرار الأسهم على كل كارد لتحريك وضبط أي صورة)
                    </span>
                  </div>

                  {/* Global X/Y Nudge */}
                  <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-bold text-orange-300 flex items-center gap-1">
                      <Sliders className="w-3 h-3" />
                      ضبط موضع كافة الصور معاً:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">X:</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="1"
                        value={globalXOffset}
                        onChange={(e) => handleApplyGlobalOffset(Number(e.target.value), globalYOffset)}
                        className="w-16 accent-orange-500"
                      />
                      <span className="font-mono text-[10px] text-orange-300 w-5">{globalXOffset}%</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Y:</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="1"
                        value={globalYOffset}
                        onChange={(e) => handleApplyGlobalOffset(globalXOffset, Number(e.target.value))}
                        className="w-16 accent-orange-500"
                      />
                      <span className="font-mono text-[10px] text-orange-300 w-5">{globalYOffset}%</span>
                    </div>

                    {(globalXOffset !== 0 || globalYOffset !== 0) && (
                      <button
                        onClick={() => handleApplyGlobalOffset(0, 0)}
                        className="p-1 text-slate-400 hover:text-white rounded bg-slate-800"
                        title="إعادة التعيين"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Products Grid with Individual Directional Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {targetProductsList.map((prod) => {
                    const img = extractedMap[prod.id];
                    const isExtracted = !!img;

                    return (
                      <div
                        key={prod.id}
                        className={`bg-slate-900 border rounded-xl p-2.5 flex flex-col justify-between transition group relative ${
                          isExtracted 
                            ? 'border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                            : 'border-slate-800 opacity-60'
                        }`}
                      >
                        {/* Image Frame with Dynamic Adaptive Container */}
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-white border border-slate-800 mb-2 flex items-center justify-center p-1">
                          {img ? (
                            <img
                              src={img}
                              alt={prod.name}
                              className="max-w-full max-h-full object-contain rounded transition duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                              <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                              <span className="text-[10px]">بانتظار الصورة</span>
                            </div>
                          )}

                          {/* Quick Interactive Tuner Trigger */}
                          {isExtracted && (
                            <button
                              type="button"
                              onClick={() => setActiveTuningProductId(prod.id)}
                              className="absolute top-1 left-1 bg-slate-900/90 hover:bg-orange-600 text-slate-200 hover:text-white p-1 rounded transition shadow z-10"
                              title="فتح أداة الضبط والتحريك الدقيق"
                            >
                              <Settings2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Direct Nudge Controls (Up, Down, Left, Right, Zoom) */}
                        {isExtracted && (
                          <div className="mb-2 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 font-bold pr-1">تحريك:</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => adjustProductCrop(prod.id, 0, -2)}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                                title="تحريك لأعلى"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustProductCrop(prod.id, 0, 2)}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                                title="تحريك لأسفل"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustProductCrop(prod.id, -2, 0)}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                                title="تحريك لليمين"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustProductCrop(prod.id, 2, 0)}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                                title="تحريك لليسار"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-0.5 border-r border-slate-800 pr-0.5">
                              <button
                                type="button"
                                onClick={() => adjustProductCrop(prod.id, 0, 0, 0.1)}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                                title="تكبير"
                              >
                                <ZoomIn className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustProductCrop(prod.id, 0, 0, -0.1)}
                                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                                title="تصغير"
                              >
                                <ZoomOut className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Product Info */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-200 line-clamp-2 leading-tight mb-1" title={prod.name}>
                            {prod.name}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-mono text-orange-400">{prod.barcode}</span>
                            <span className="font-bold text-slate-300">{prod.price} QAR</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {activeTab === 'pdf_pages' && (
            <div className="space-y-6">
              {pages.map((page) => (
                <div key={page.pageNum} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>صفحة الكتالوج رقم {page.pageNum} من {pages.length}</span>
                  </div>
                  <div className="p-4 flex justify-center bg-slate-950/60">
                    <img
                      src={page.dataUrl}
                      alt={`Page ${page.pageNum}`}
                      className="max-w-full rounded-lg shadow-lg border border-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bulk_images' && (
            <div className="max-w-lg mx-auto my-10 text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
              <input
                type="file"
                ref={imagesInputRef}
                onChange={handleBulkImagesUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <FolderUp className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                رفع مجلد صور مجمع من الجهاز
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                إذا قمت بحفظ صور الـ 53 منتجاً في مجلد مسبقاً، يمكنك تحديد جميع الصور دفعة واحدة وسيتم ربطها تلقائياً بالباركود والاسم.
              </p>
              <button
                onClick={() => imagesInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 mx-auto transition"
              >
                <FolderUp className="w-4 h-4" />
                تحديد جميع الصور دفعة واحدة
              </button>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span>الصور المستخرجة:</span>
            <span className="font-bold text-orange-400">{extractedList.length} من {targetProductsList.length}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              إغلاق
            </button>

            {extractedList.length > 0 && (
              <button
                onClick={handleSaveAllToDatabase}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                حفظ وتطبيق كافة الصور في المتجر السحابي
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Interactive Single Product Fine-Tuning Modal */}
      {activeTuningProduct && activeTuningCrop && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" dir="rtl">
          <div className="bg-slate-900 border border-orange-500/40 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col">
            
            {/* Tuner Header */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-400" />
                  أداة الضبط والتحريك الدقيق للصورة
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {activeTuningProduct.name} ({activeTuningProduct.barcode})
                </p>
              </div>
              <button
                onClick={() => setActiveTuningProductId(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tuner Body */}
            <div className="p-5 space-y-4">
              {/* Large Image Preview with Grid Crosshairs */}
              <div className="relative w-48 h-48 mx-auto bg-white rounded-xl border-2 border-orange-500/50 shadow-inner overflow-hidden flex items-center justify-center p-2">
                {extractedMap[activeTuningProduct.id] ? (
                  <img
                    src={extractedMap[activeTuningProduct.id]}
                    alt={activeTuningProduct.name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <div className="text-xs text-slate-400">لا توجد صورة محددة</div>
                )}
                {/* Center Target Indicator */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
                  <div className="w-full h-px bg-orange-500" />
                  <div className="h-full w-px bg-orange-500 absolute" />
                </div>
              </div>

              {/* AI Quick Enhancers inside Tuner */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!activeTuningProduct) return;
                    const curImg = extractedMap[activeTuningProduct.id];
                    if (!curImg) return;
                    setIsTuningBgRemoving(true);
                    setTuningNotice('');
                    try {
                      const transparent = await removeImageBackground(curImg, {
                        tolerance: 32,
                        edgeFeather: 2,
                        decontaminateFringe: true,
                        protectCenterSubject: true,
                      });
                      setExtractedMap((prev) => ({ ...prev, [activeTuningProduct.id]: transparent }));
                      setTuningNotice('✨ تم تفريغ الخلفية بنجاح!');
                      setTimeout(() => setTuningNotice(''), 3000);
                    } catch (e) {
                      console.error(e);
                      setTuningNotice('⚠️ تعذر تفريغ الخلفية.');
                    } finally {
                      setIsTuningBgRemoving(false);
                    }
                  }}
                  disabled={isTuningBgRemoving || isTuningUpscaling}
                  className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 text-[11px] font-bold rounded-lg border border-indigo-700/60 flex items-center gap-1.5 transition disabled:opacity-50"
                  title="تفريغ وعزل خلفية هذا المنتج"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isTuningBgRemoving ? 'animate-spin' : 'text-indigo-400'}`} />
                  <span>{isTuningBgRemoving ? 'جاري التفريغ...' : 'تفريغ الخلفية'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!activeTuningProduct) return;
                    const curImg = extractedMap[activeTuningProduct.id];
                    if (!curImg) return;
                    setIsTuningUpscaling(true);
                    setTuningNotice('');
                    try {
                      const upscaled = await upscaleAndEnhanceImage(curImg, {
                        upscaleFactor: 2,
                        denoiseStrength: 0.35,
                        sharpness: 0.45,
                        contrast: 1.08,
                        vibrance: 0.12,
                      });
                      setExtractedMap((prev) => ({ ...prev, [activeTuningProduct.id]: upscaled }));
                      setTuningNotice('⚡ تمت مضاعفة الدقة 2x وزيادة الحدة!');
                      setTimeout(() => setTuningNotice(''), 3000);
                    } catch (e) {
                      console.error(e);
                      setTuningNotice('⚠️ تعذر تحسين الدقة.');
                    } finally {
                      setIsTuningUpscaling(false);
                    }
                  }}
                  disabled={isTuningUpscaling || isTuningBgRemoving}
                  className="px-3 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-[11px] font-bold rounded-lg border border-emerald-700/60 flex items-center gap-1.5 transition disabled:opacity-50"
                  title="مضاعفة الدقة والحدة 2x"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isTuningUpscaling ? 'animate-spin' : 'text-emerald-400'}`} />
                  <span>{isTuningUpscaling ? 'جاري المعالجة...' : 'مضاعفة الدقة 2x'}</span>
                </button>
              </div>

              {tuningNotice && (
                <div className="text-center text-[11px] font-bold text-emerald-400 animate-in fade-in">
                  {tuningNotice}
                </div>
              )}

              {/* D-Pad Directional Controller */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold mb-2">لوحة التحكم التوجيهية (D-Pad):</span>
                <div className="grid grid-cols-3 gap-1.5 w-36">
                  <div></div>
                  <button
                    type="button"
                    onClick={() => adjustProductCrop(activeTuningProduct.id, 0, -2)}
                    className="p-2 bg-slate-800 hover:bg-orange-600 rounded-lg flex items-center justify-center transition"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div></div>

                  <button
                    type="button"
                    onClick={() => adjustProductCrop(activeTuningProduct.id, -2, 0)}
                    className="p-2 bg-slate-800 hover:bg-orange-600 rounded-lg flex items-center justify-center transition"
                    title="تحريك لليمين"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustProductCrop(activeTuningProduct.id, 0, 0, 0, true)}
                    className="p-2 bg-slate-800 hover:bg-rose-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-300 hover:text-white transition"
                    title="إعادة التعيين"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustProductCrop(activeTuningProduct.id, 2, 0)}
                    className="p-2 bg-slate-800 hover:bg-orange-600 rounded-lg flex items-center justify-center transition"
                    title="تحريك لليسار"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div></div>
                  <button
                    type="button"
                    onClick={() => adjustProductCrop(activeTuningProduct.id, 0, 2)}
                    className="p-2 bg-slate-800 hover:bg-orange-600 rounded-lg flex items-center justify-center transition"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <div></div>
                </div>
              </div>

              {/* Sliders for Exact Numerical Precision */}
              <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400 text-[11px] w-28">إزاحة أفقية (X):</span>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="1"
                    value={activeTuningCrop.xOffsetPercent}
                    onChange={(e) => setProductCropParams(activeTuningProduct.id, { xOffsetPercent: Number(e.target.value) })}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="font-mono text-orange-300 w-8 text-left">{activeTuningCrop.xOffsetPercent}%</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400 text-[11px] w-28">إزاحة رأسية (Y):</span>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    step="1"
                    value={activeTuningCrop.yOffsetPercent}
                    onChange={(e) => setProductCropParams(activeTuningProduct.id, { yOffsetPercent: Number(e.target.value) })}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="font-mono text-orange-300 w-8 text-left">{activeTuningCrop.yOffsetPercent}%</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400 text-[11px] w-28">مستوى التكبير (Zoom):</span>
                  <input
                    type="range"
                    min="0.6"
                    max="2.0"
                    step="0.05"
                    value={activeTuningCrop.zoom}
                    onChange={(e) => setProductCropParams(activeTuningProduct.id, { zoom: Number(e.target.value) })}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="font-mono text-orange-300 w-8 text-left">{activeTuningCrop.zoom.toFixed(2)}x</span>
                </div>
              </div>
            </div>

            {/* Tuner Footer */}
            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveTuningProductId(null)}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                اعتماد وتثبيت الضبط
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
