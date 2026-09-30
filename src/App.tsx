import React, { useState, useEffect } from 'react';
import { Product, CarCategory, ViewMode, UserSession, ActivityLog, DeletedProduct, UserRole, SortOption } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './data/initialData';
import { 
  seedInitialDatabase, 
  subscribeToCategories, 
  subscribeToProducts, 
  saveProductToDb, 
  deleteProductFromDb, 
  deleteMultipleProductsFromDb,
  saveCategoryToDb, 
  deleteCategoryAndItsProductsFromDb,
  deleteCategoryFromDb, 
  bulkSaveProductsToDb,
  subscribeToActivityLogs,
  logActivityToDb,
  clearActivityLogsInDb,
  moveProductToTrashInDb,
  moveMultipleProductsToTrashInDb,
  subscribeToDeletedProducts,
  restoreProductFromTrashInDb,
  hardDeleteFromTrashInDb,
  emptyTrashInDb,
  getLocalCachedCategories,
  getLocalCachedProducts,
  subscribeToLoadingProgress,
  saveCategoriesOrderToDb
} from './supabase';
import { Navbar } from './components/Navbar';
import { CategoryHeader } from './components/CategoryHeader';
import { ProductCard } from './components/ProductCard';
import { EmployeePanel } from './components/EmployeePanel';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ExplanationGuideModal } from './components/ExplanationGuideModal';
import { PasswordModal } from './components/PasswordModal';
import { PrintCatalogView } from './components/PrintCatalogView';
import { PdfExtractorModal } from './components/PdfExtractorModal';
import { ActivityLogModal } from './components/ActivityLogModal';
import { RecycleBinModal } from './components/RecycleBinModal';
import { DeleteConfirmPasswordModal } from './components/DeleteConfirmPasswordModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { LoadingScreen } from './components/LoadingScreen';
import { WolfLogo } from './components/WolfLogo';
import { ProtectionTintCatalog, ProtectionControls } from './components/ProtectionTintCatalog';
import { CategoryOrderModal } from './components/CategoryOrderModal';
import { 
  PlusCircle, 
  SearchX, 
  HelpCircle, 
  Sparkles, 
  FolderPlus, 
  Tag, 
  LockKeyhole, 
  Database,
  Layers,
  FileSpreadsheet,
  Sliders,
  Maximize2,
  History,
  FileDown,
  Trash2,
  ArrowUpDown,
  Clock,
  GripVertical,
  ShieldCheck,
  Edit2,
  RotateCcw,
  Printer,
  Check
} from 'lucide-react';

export default function App() {
  // State for Categories and Products (initialized from local cache or initial data)
  const [categories, setCategories] = useState<CarCategory[]>(() => {
    const cached = getLocalCachedCategories();
    return cached && cached.length > 0 ? cached : INITIAL_CATEGORIES;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = getLocalCachedProducts();
    return cached && cached.length > 0 ? cached : INITIAL_PRODUCTS;
  });
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [isDbSynced, setIsDbSynced] = useState(false);

  // App Initial Loading Screen with dynamic counter
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(15);
  const [loadingStatusText, setLoadingStatusText] = useState('جاري الاتصال بقاعدة البيانات السحابية...');

  // Protection Catalog registered controls (to power CategoryHeader actions seamlessly)
  const [protectionControls, setProtectionControls] = useState<ProtectionControls | null>(null);

  // Category Order Modal state
  const [isCategoryOrderModalOpen, setIsCategoryOrderModalOpen] = useState(false);

  // User Session & Role
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Highlighted product animation (when clicked from Activity Log)
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  // Global Frame customizer
  const [globalFrameHeight, setGlobalFrameHeight] = useState<number>(105);
  const [globalFrameRatio, setGlobalFrameRatio] = useState<'50-50' | '60-40' | '40-60'>('50-50');

  // Product Sorting & Custom Drag-and-Drop Order State (persisted in browser/device localStorage)
  const [sortMode, setSortMode] = useState<SortOption>(() => {
    const saved = localStorage.getItem('wolfcar_product_sort_mode');
    return (saved as SortOption) || 'date_desc';
  });

  const [customOrderIds, setCustomOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wolfcar_custom_product_order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [draggingProductId, setDraggingProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);
  const [isDragEditing, setIsDragEditing] = useState<boolean>(false);

  const handleSetSortMode = (mode: SortOption) => {
    setSortMode(mode);
    localStorage.setItem('wolfcar_product_sort_mode', mode);
    setIsDragEditing(false);
  };

  const handleToggleCustomDrag = () => {
    if (sortMode !== 'custom') {
      setSortMode('custom');
      localStorage.setItem('wolfcar_product_sort_mode', 'custom');
      setIsDragEditing(true);
    } else {
      setIsDragEditing((prev) => !prev);
    }
  };

  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => {
    const cached = getLocalCachedCategories();
    return (cached && cached.length > 0 && cached[0].id) || INITIAL_CATEGORIES[0]?.id || '';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI Modals & Views State
  const [isEmployeeUnlocked, setIsEmployeeUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmployeePanelOpen, setIsEmployeePanelOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPdfExtractorOpen, setIsPdfExtractorOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);

  // Image Viewer Lightbox Modal State
  const [viewerImageData, setViewerImageData] = useState<{ url: string; title?: string } | null>(null);

  // Password-Protected Deletion Pending State
  const [pendingDeleteAction, setPendingDeleteAction] = useState<{
    type: 'single_product' | 'multiple_products' | 'category' | 'hard_delete' | 'empty_trash';
    item?: any;
    ids?: string[];
    deleteProductsToo?: boolean;
    title: string;
    description: string;
    count?: number;
  } | null>(null);

  // Edit Selection State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<CarCategory | null>(null);

  // Initialize database listeners and loading progress
  useEffect(() => {
    // 0. Listen to real progress from the catalog loader
    const unsubProgress = subscribeToLoadingProgress((percent, status) => {
      setLoadingProgress(percent);
      setLoadingStatusText(status);
      if (percent >= 100) {
        setTimeout(() => {
          setIsAppLoading(false);
        }, 400);
      }
    });

    // Fallback timer to guarantee screen clears even on slow connections
    const fallbackTimer = setTimeout(() => {
      setIsAppLoading(false);
    }, 4000);

    // 1. Seed initial data / trigger single catalog fetch
    seedInitialDatabase().catch((err) => {
      console.warn('Database seeding notice:', err);
    });

    // 2. Listen to real-time category updates from Database
    const unsubCategories = subscribeToCategories((updatedCategories) => {
      if (updatedCategories && updatedCategories.length > 0) {
        setCategories(updatedCategories);
        setIsDbSynced(true);
        setActiveCategoryId((prev) => {
          if (!prev || prev === 'all' || !updatedCategories.some((c) => c.id === prev)) {
            return updatedCategories[0].id;
          }
          return prev;
        });
      }
    });

    // 3. Listen to real-time product updates from Database
    const unsubProducts = subscribeToProducts((updatedProducts) => {
      if (updatedProducts && updatedProducts.length > 0) {
        setProducts(updatedProducts);
        setIsDbSynced(true);
      }
    });

    // 4. Listen to real-time activity logs from Database
    const unsubLogs = subscribeToActivityLogs((logs) => {
      if (logs) {
        setActivityLogs(logs);
      }
    });

    // 5. Listen to real-time Deleted Products (Recycle Bin with 30-day retention)
    const unsubTrash = subscribeToDeletedProducts((items) => {
      if (items) {
        setDeletedProducts(items);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubProgress();
      unsubCategories();
      unsubProducts();
      unsubLogs();
      unsubTrash();
    };
  }, []);

  // Function to request staff access
  const handleOpenEmployeePanelWithAuth = () => {
    setEditingProduct(null);
    setEditingCategory(null);
    if (isEmployeeUnlocked) {
      setIsEmployeePanelOpen(true);
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const handleOpenPdfExtractorWithAuth = () => {
    if (isEmployeeUnlocked) {
      setIsPdfExtractorOpen(true);
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  // Function to request editing a specific product (from Barcode Scanner, Card, etc.)
  const handleRequestEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditingCategory(null);
    setIsBarcodeScannerOpen(false);

    if (isEmployeeUnlocked) {
      setIsEmployeePanelOpen(true);
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  // Handle Add/Edit Product in Firestore
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const currentRole = userSession?.role || 'admin';
      const currentUserName = userSession?.displayName || 'المسؤول';

      if (productData.id) {
        // Update Existing Product
        const oldProd = products.find(p => p.id === productData.id);
        const updatedProd: Product = {
          ...(oldProd || {}),
          ...productData,
          updatedAt: new Date().toISOString(),
        } as Product;

        setProducts((prev) => prev.map((p) => p.id === updatedProd.id ? updatedProd : p));
        await saveProductToDb(updatedProd);

        if (oldProd) {
          const changes: string[] = [];
          let primaryAction: ActivityLog['actionType'] = 'product_edit';
          let oldVal: string | number | undefined = undefined;
          let newVal: string | number | undefined = undefined;

          // 1. Price Change
          if (oldProd.price !== updatedProd.price) {
            changes.push(`تعديل السعر من ${oldProd.price} إلى ${updatedProd.price} QAR`);
            primaryAction = 'price_change';
            oldVal = oldProd.price;
            newVal = updatedProd.price;
          }

          // 2. Name / Title Change
          if (oldProd.name !== updatedProd.name) {
            changes.push(`تعديل الاسم من "${oldProd.name}" إلى "${updatedProd.name}"`);
            if (primaryAction !== 'price_change') {
              oldVal = oldProd.name;
              newVal = updatedProd.name;
            }
          }

          // 3. Barcode Change
          if (oldProd.barcode !== updatedProd.barcode) {
            changes.push(`تعديل الباركود من (${oldProd.barcode}) إلى (${updatedProd.barcode})`);
            if (primaryAction !== 'price_change') {
              oldVal = oldProd.barcode;
              newVal = updatedProd.barcode;
            }
          }

          // 4. Category Movement
          if (oldProd.categoryId !== updatedProd.categoryId) {
            const oldCatName = categories.find(c => c.id === oldProd.categoryId)?.name || oldProd.categoryId;
            const newCatName = categories.find(c => c.id === updatedProd.categoryId)?.name || updatedProd.categoryId;
            changes.push(`نقل المنتج من قسم (${oldCatName}) إلى قسم (${newCatName})`);
          }

          // 5. Image URL Change
          if (oldProd.imageUrl !== updatedProd.imageUrl) {
            changes.push(`تحديث وتغيير صورة المنتج`);
            if (primaryAction !== 'price_change') {
              primaryAction = 'image_transform';
            }
          }

          // 6. Image Transform / Alignment / Frame Adjustment
          const oldT = oldProd.imageTransform;
          const newT = updatedProd.imageTransform;
          if (
            oldT?.xOffset !== newT?.xOffset ||
            oldT?.yOffset !== newT?.yOffset ||
            oldT?.zoom !== newT?.zoom ||
            oldT?.fit !== newT?.fit ||
            oldT?.frameHeight !== newT?.frameHeight
          ) {
            changes.push(`ضبط موضع وزووم الصورة (X: ${newT?.xOffset || 0}%, Y: ${newT?.yOffset || 0}%, زووم: ${newT?.zoom || 1}x)`);
            if (primaryAction !== 'price_change' && primaryAction !== 'product_edit') {
              primaryAction = 'image_transform';
            }
          }

          const catName = categories.find(c => c.id === updatedProd.categoryId)?.name;
          const details = changes.length > 0
            ? `تم ${changes.join(' | ')} لمنتج (${updatedProd.name}) بواسطة ${currentUserName}`
            : `تحديث وحفظ بيانات منتج (${updatedProd.name}) بواسطة ${currentUserName}`;

          await logActivityToDb({
            actionType: primaryAction,
            userRole: currentRole,
            userName: currentUserName,
            productId: updatedProd.id,
            productName: updatedProd.name,
            categoryId: updatedProd.categoryId,
            categoryName: catName,
            oldValue: oldVal,
            newValue: newVal,
            details,
          });
        }
      } else {
        // Create New Product
        const newProd: Product = {
          id: 'prod-' + Date.now(),
          categoryId: productData.categoryId || categories[0]?.id || 'cat-haval-v7',
          name: productData.name || 'منتج جديد',
          barcode: productData.barcode || '1001' + Math.floor(100000 + Math.random() * 900000),
          price: productData.price || 99,
          oldPrice: productData.oldPrice,
          currency: productData.currency || 'QAR',
          imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80',
          imageTransform: productData.imageTransform,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setProducts((prev) => [newProd, ...prev]);
        await saveProductToDb(newProd);

        const catName = categories.find(c => c.id === newProd.categoryId)?.name;
        await logActivityToDb({
          actionType: 'product_add',
          userRole: currentRole,
          userName: currentUserName,
          productId: newProd.id,
          productName: newProd.name,
          categoryId: newProd.categoryId,
          categoryName: catName,
          newValue: newProd.price,
          details: `إضافة منتج جديد: (${newProd.name}) بباركود (${newProd.barcode}) وسعر ${newProd.price} QAR في قسم (${catName || 'عام'}) بواسطة ${currentUserName}`,
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setEditingProduct(null);
    }
  };

  // State for image lightbox modal
  const [activeViewingProduct, setActiveViewingProduct] = useState<Product | null>(null);

  // Handle Delete Single Product (Moves to Recycle Bin with 30-day retention)
  const handleDeleteProduct = (productId: string) => {
    const prodToDelete = products.find(p => p.id === productId);
    if (!prodToDelete) return;

    setPendingDeleteAction({
      type: 'single_product',
      item: prodToDelete,
      title: `حذف المنتج: ${prodToDelete.name}`,
      description: `سيتم نقل هذا المنتج إلى "سلة المحذوفات" مع الاحتفاظ به لمدة 30 يوماً بحيث يمكنك استعادته في أي وقت. يتطلب الإجراء إدخال كلمة المرور للتأكيد.`,
    });
  };

  // Handle Bulk Delete Multiple Products (Moves to Recycle Bin with 30-day retention)
  const handleDeleteMultipleProducts = (productIds: string[]) => {
    if (productIds.length === 0) return;
    const prodsToDelete = products.filter(p => productIds.includes(p.id));

    setPendingDeleteAction({
      type: 'multiple_products',
      ids: productIds,
      item: prodsToDelete,
      count: productIds.length,
      title: `حذف جماعي (${productIds.length} منتج)`,
      description: `سيتم نقل ${productIds.length} منتج محدد إلى "سلة المحذوفات" مع الاحتفاظ بها لمدة 30 يوماً. يتطلب الإجراء إدخال كلمة المرور للتأكيد.`,
    });
  };

  // Handle Category Deletion Prompt
  const handleRequestDeleteCategory = (categoryId: string, deleteProductsToo: boolean = true) => {
    const catToDelete = categories.find(c => c.id === categoryId);
    if (!catToDelete) return;
    const affectedProductsCount = products.filter(p => p.categoryId === categoryId).length;

    setPendingDeleteAction({
      type: 'category',
      item: catToDelete,
      deleteProductsToo,
      count: affectedProductsCount,
      title: `حذف قسم: ${catToDelete.name}`,
      description: `هل أنت متأكد من رغبتك في حذف هذا القسم${deleteProductsToo ? ` ونقل كافة منتجاته التابعة (${affectedProductsCount} منتج) إلى سلة المحذوفات؟` : '؟'}`,
    });
  };

  // Execute Confirmed Delete Action after password validation
  const handleExecuteConfirmedDelete = async (authRole: UserRole, authName: string) => {
    if (!pendingDeleteAction) return;

    try {
      if (pendingDeleteAction.type === 'single_product') {
        const prod = pendingDeleteAction.item as Product;
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        await moveProductToTrashInDb(prod, { name: authName, role: authRole });

        const catName = categories.find(c => c.id === prod.categoryId)?.name;
        await logActivityToDb({
          actionType: 'product_delete',
          userRole: authRole,
          userName: authName,
          productId: prod.id,
          productName: prod.name,
          categoryId: prod.categoryId,
          categoryName: catName,
          details: `نقل منتج إلى سلة المحذوفات: (${prod.name}) بباركود (${prod.barcode}) من قسم (${catName || 'عام'}) بواسطة ${authName}`,
        });
      } else if (pendingDeleteAction.type === 'multiple_products') {
        const prods = (pendingDeleteAction.item as Product[]) || [];
        const idsSet = new Set(prods.map(p => p.id));
        setProducts((prev) => prev.filter((p) => !idsSet.has(p.id)));
        await moveMultipleProductsToTrashInDb(prods, { name: authName, role: authRole });

        await logActivityToDb({
          actionType: 'product_delete',
          userRole: authRole,
          userName: authName,
          details: `حذف جماعي ونقل ${prods.length} منتجات إلى سلة المحذوفات بواسطة ${authName}`,
        });
      } else if (pendingDeleteAction.type === 'category') {
        const cat = pendingDeleteAction.item as CarCategory;
        const deleteProductsToo = pendingDeleteAction.deleteProductsToo;

        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        if (deleteProductsToo) {
          const prodsToTrash = products.filter((p) => p.categoryId === cat.id);
          setProducts((prev) => prev.filter((p) => p.categoryId !== cat.id));
          if (prodsToTrash.length > 0) {
            await moveMultipleProductsToTrashInDb(prodsToTrash, { name: authName, role: authRole });
          }
          await deleteCategoryFromDb(cat.id);
        } else {
          await deleteCategoryFromDb(cat.id);
        }

        if (activeCategoryId === cat.id) {
          setActiveCategoryId('all');
        }

        await logActivityToDb({
          actionType: 'category_delete',
          userRole: authRole,
          userName: authName,
          categoryId: cat.id,
          categoryName: cat.name,
          details: `حذف قسم: (${cat.name}) ونقل منتجاته التابعة لسلة المحذوفات بواسطة ${authName}`,
        });
      } else if (pendingDeleteAction.type === 'hard_delete') {
        const item = pendingDeleteAction.item as DeletedProduct;
        await hardDeleteFromTrashInDb(item.id);
        await logActivityToDb({
          actionType: 'hard_delete',
          userRole: authRole,
          userName: authName,
          productId: item.originalProduct.id,
          productName: item.originalProduct.name,
          details: `حذف نهائي للمنتج (${item.originalProduct.name}) من سلة المحذوفات وقاعدة البيانات بواسطة ${authName}`,
        });
      } else if (pendingDeleteAction.type === 'empty_trash') {
        await emptyTrashInDb();
        await logActivityToDb({
          actionType: 'trash_empty',
          userRole: authRole,
          userName: authName,
          details: `إفراغ سلة المحذوفات بالكامل وحذف جميع السجلات نهائياً بواسطة ${authName}`,
        });
      }
    } catch (err) {
      console.error('Error executing delete action:', err);
    } finally {
      setPendingDeleteAction(null);
    }
  };

  // Restore product from Recycle Bin back to active products
  const handleRestoreProduct = async (deletedItem: DeletedProduct) => {
    try {
      await restoreProductFromTrashInDb(deletedItem);
      const prod = deletedItem.originalProduct;
      const catName = categories.find(c => c.id === prod.categoryId)?.name;

      await logActivityToDb({
        actionType: 'product_restore',
        userRole: userSession?.role || 'admin',
        userName: userSession?.displayName || 'المسؤول',
        productId: prod.id,
        productName: prod.name,
        categoryId: prod.categoryId,
        categoryName: catName,
        details: `استعادة منتج من سلة المحذوفات: (${prod.name}) إلى قسم (${catName || 'عام'}) بواسطة ${userSession?.displayName || 'المسؤول'}`,
      });
    } catch (err) {
      console.error('Error restoring product:', err);
    }
  };

  // Save Reordered Categories
  const handleSaveCategoryOrder = async (reordered: CarCategory[]) => {
    setCategories(reordered);
    await saveCategoriesOrderToDb(reordered);
    await logActivityToDb({
      actionType: 'category_edit',
      userRole: userSession?.role || 'admin',
      userName: userSession?.displayName || 'المسؤول',
      details: `إعادة ترتيب وتثبيت أولويات أقسام السيارات في الهيدر الرئيسي بواسطة ${userSession?.displayName || 'المسؤول'}`
    });
  };

  // Prompt hard delete for an item in trash
  const handleRequestHardDelete = (deletedItem: DeletedProduct) => {
    setPendingDeleteAction({
      type: 'hard_delete',
      item: deletedItem,
      title: `حذف نهائي للمنتج: ${deletedItem.originalProduct.name}`,
      description: `سيتم مسح هذا المنتج نهائياً من قاعدة البيانات ولن يمكن استرجاعه مجدداً. يتطلب الإجراء كلمة مرور.`,
    });
  };

  // Prompt empty entire trash
  const handleRequestEmptyTrash = () => {
    setPendingDeleteAction({
      type: 'empty_trash',
      count: deletedProducts.length,
      title: `إفراغ سلة المحذوفات بالكامل`,
      description: `هل أنت متأكد من رغبتك في حذف كافة المنتجات المحذوفة (${deletedProducts.length} منتج) نهائياً من قاعدة البيانات السحابية؟ هذا الإجراء لا يمكن التراجع عنه.`,
    });
  };

  // Handle Save Category in Firestore
  const handleSaveCategory = async (categoryData: Partial<CarCategory>) => {
    try {
      const currentRole = userSession?.role || 'admin';
      const currentUserName = userSession?.displayName || 'المسؤول';

      if (categoryData.id) {
        const oldCat = categories.find(c => c.id === categoryData.id);
        const updatedCat: CarCategory = {
          ...(oldCat || {}),
          ...categoryData,
        } as CarCategory;

        setCategories((prev) => prev.map((c) => c.id === updatedCat.id ? updatedCat : c));
        await saveCategoryToDb(updatedCat);

        const changes: string[] = [];
        if (oldCat) {
          if (oldCat.name !== updatedCat.name) changes.push(`تعديل الاسم من "${oldCat.name}" إلى "${updatedCat.name}"`);
          if (oldCat.carModel !== updatedCat.carModel) changes.push(`تعديل طراز السيارة إلى "${updatedCat.carModel}"`);
          if (oldCat.headerTitle !== updatedCat.headerTitle) changes.push(`تعديل العنوان الترويجي إلى "${updatedCat.headerTitle}"`);
          if (oldCat.mainCarImageUrl !== updatedCat.mainCarImageUrl) changes.push(`تحديث صورة القسم`);
        }

        const details = changes.length > 0
          ? `تعديل بيانات قسم (${updatedCat.name}): ${changes.join(' | ')} بواسطة ${currentUserName}`
          : `تحديث بيانات قسم (${updatedCat.name}) بواسطة ${currentUserName}`;

        await logActivityToDb({
          actionType: 'category_edit',
          userRole: currentRole,
          userName: currentUserName,
          categoryId: updatedCat.id,
          categoryName: updatedCat.name,
          details,
        });
      } else {
        const newCat: CarCategory = {
          id: 'cat-' + Date.now(),
          name: categoryData.name || 'قسم جديد',
          carModel: categoryData.carModel || 'سيارة جديدة',
          headerTitle: categoryData.headerTitle || categoryData.name || 'اكسسوارات سيارة',
          mainCarImageUrl: categoryData.mainCarImageUrl || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
          description: categoryData.description,
          order: categories.length + 1,
        };

        setCategories((prev) => [...prev, newCat]);
        setActiveCategoryId(newCat.id);
        await saveCategoryToDb(newCat);

        await logActivityToDb({
          actionType: 'category_add',
          userRole: currentRole,
          userName: currentUserName,
          categoryId: newCat.id,
          categoryName: newCat.name,
          details: `إنشاء وإضافة قسم جديد: (${newCat.name}) لطراز (${newCat.carModel}) بواسطة ${currentUserName}`,
        });
      }
    } catch (err) {
      console.error('Error saving category to Firestore:', err);
    } finally {
      setEditingCategory(null);
    }
  };

  // Handle Delete Entire Category and all its products in Firestore
  const handleDeleteCategory = async (categoryId: string, deleteProductsToo: boolean = true) => {
    const catToDelete = categories.find(c => c.id === categoryId);
    const remainingCats = categories.filter((c) => c.id !== categoryId);
    setCategories(remainingCats);
    if (deleteProductsToo) {
      setProducts((prev) => prev.filter((p) => p.categoryId !== categoryId));
    }
    if (activeCategoryId === categoryId) {
      setActiveCategoryId(remainingCats[0]?.id || '');
    }
    try {
      if (deleteProductsToo) {
        await deleteCategoryAndItsProductsFromDb(categoryId);
      } else {
        await deleteCategoryFromDb(categoryId);
      }

      if (catToDelete) {
        await logActivityToDb({
          actionType: 'category_delete',
          userRole: userSession?.role || 'admin',
          userName: userSession?.displayName || 'المسؤول',
          categoryId,
          categoryName: catToDelete.name,
          details: `حذف قسم: (${catToDelete.name}) مع إزالة منتجاته التابعة بواسطة ${userSession?.displayName || 'المسؤول'}`,
        });
      }
    } catch (err) {
      console.error('Error deleting category from Firestore:', err);
    }
  };

  // Handle Bulk Import from CSV / Excel
  const handleBulkImportProducts = async (newProducts: Product[], newCats?: CarCategory[]) => {
    try {
      await bulkSaveProductsToDb(newProducts, newCats);
      
      // Merge unique products by ID
      setProducts((prev) => {
        const map = new Map<string, Product>();
        prev.forEach((p) => map.set(p.id, p));
        newProducts.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      });

      // Merge unique categories by ID
      if (newCats && newCats.length > 0) {
        setCategories((prev) => {
          const map = new Map<string, CarCategory>();
          prev.forEach((c) => map.set(c.id, c));
          newCats.forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });
      }

      await logActivityToDb({
        actionType: 'bulk_import',
        userRole: userSession?.role || 'admin',
        userName: userSession?.displayName || 'المسؤول',
        details: `استيراد جماعي لقاعدة البيانات: ${newProducts.length} منتج${newCats && newCats.length > 0 ? ` و ${newCats.length} قسم` : ''} بواسطة ${userSession?.displayName || 'المسؤول'}`,
      });
    } catch (err) {
      console.error('Error bulk importing products:', err);
      throw err;
    }
  };

  // Handle Export / Import Backup (JSON)
  const handleExportData = () => {
    const backupObj = {
      categories,
      products,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wolf_car_catalog_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.categories && json.products) {
          await bulkSaveProductsToDb(json.products, json.categories);
          setCategories(json.categories);
          setProducts(json.products);
          alert('تم استيراد وحفظ الكتالوج في قاعدة البيانات السحابية بنجاح!');
        } else {
          alert('تنسيق الملف غير صحيح');
        }
      } catch (err) {
        alert('فشل قراءة الملف المرفق');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    await bulkSaveProductsToDb(INITIAL_PRODUCTS, INITIAL_CATEGORIES);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setActiveCategoryId(INITIAL_CATEGORIES[0]?.id || '');
  };

  // Jump and highlight product from Activity Log
  const handleNavigateToProductFromLog = (productId: string, categoryId?: string) => {
    if (categoryId) {
      setActiveCategoryId(categoryId);
    } else {
      const prod = products.find(p => p.id === productId);
      if (prod && prod.categoryId) {
        setActiveCategoryId(prod.categoryId);
      }
    }
    setHighlightedProductId(productId);

    setTimeout(() => {
      const cardEl = document.getElementById(`product-card-${productId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedProductId(null);
    }, 5000);
  };

  // Helper to match product to category flexibly (by ID, Name, or carModel)
  const matchesProductCategory = (p: Product, targetCatId: string) => {
    if (targetCatId === 'all') return true;
    if (p.categoryId === targetCatId) return true;
    const targetCat = categories.find((c) => c.id === targetCatId);
    if (targetCat) {
      if (p.categoryId === targetCat.name || p.categoryId === targetCat.carModel) return true;
      if (targetCat.name && p.categoryId?.toLowerCase().trim() === targetCat.name.toLowerCase().trim()) return true;
      if (targetCat.id && p.categoryId?.toLowerCase().trim() === targetCat.id.toLowerCase().trim()) return true;
    }
    return false;
  };

  // Filter Products based on active Category and Search Query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = matchesProductCategory(p, activeCategoryId);
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      p.barcode.includes(searchQuery.trim());
    return matchesCategory && matchesSearch;
  });

  // Sort Products array based on selected Sort Option
  const sortProductsList = (items: Product[]) => {
    const sorted = [...items];
    if (sortMode === 'date_desc') {
      sorted.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sortMode === 'date_asc') {
      sorted.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
    } else if (sortMode === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortMode === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortMode === 'custom') {
      if (customOrderIds.length > 0) {
        const orderMap = new Map<string, number>();
        customOrderIds.forEach((id, index) => orderMap.set(id, index));
        sorted.sort((a, b) => {
          const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
          const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
          return idxA - idxB;
        });
      }
    }
    return sorted;
  };

  // Drag & Drop event handlers for custom product order persistence
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, productId: string) => {
    setDraggingProductId(productId);
    e.dataTransfer.setData('text/plain', productId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, productId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProductId !== productId) {
      setDragOverProductId(productId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, productId: string) => {
    if (dragOverProductId === productId) {
      setDragOverProductId(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetProductId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain') || draggingProductId;
    setDraggingProductId(null);
    setDragOverProductId(null);

    if (!draggedId || draggedId === targetProductId) return;

    setCustomOrderIds((prevOrder) => {
      let currentIds = prevOrder.length > 0
        ? [...prevOrder]
        : products.map(p => p.id);

      products.forEach(p => {
        if (!currentIds.includes(p.id)) currentIds.push(p.id);
      });

      const fromIdx = currentIds.indexOf(draggedId);
      const toIdx = currentIds.indexOf(targetProductId);

      if (fromIdx !== -1 && toIdx !== -1) {
        currentIds.splice(fromIdx, 1);
        currentIds.splice(toIdx, 0, draggedId);
      }

      localStorage.setItem('wolfcar_custom_product_order', JSON.stringify(currentIds));
      return currentIds;
    });
  };

  const handleDragEnd = () => {
    setDraggingProductId(null);
    setDragOverProductId(null);
  };

  // Filter categories to display headers
  const categoriesToDisplay = activeCategoryId === 'all'
    ? categories
    : categories.filter((c) => c.id === activeCategoryId);

  // If app is currently loading on initial launch, display branded luxury loading counter
  if (isAppLoading) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        statusText={loadingStatusText}
        productCount={products.length}
        categoryCount={categories.length}
        isReady={!isAppLoading}
      />
    );
  }

  // If in PDF Print Mode, render the specialized Print View
  if (isPrintView) {
    return (
      <PrintCatalogView
        categories={categories}
        products={products}
        activeCategoryId={activeCategoryId}
        onExitPrint={() => setIsPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-orange-500 selection:text-white" dir="rtl">
      
      {/* 1. Main Navigation & Quick Action Header */}
      <Navbar
        categories={categories}
        activeCategoryId={activeCategoryId}
        searchQuery={searchQuery}
        onSelectCategory={setActiveCategoryId}
        onSearchChange={setSearchQuery}
        onOpenEmployeePanel={handleOpenEmployeePanelWithAuth}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenPdfExtractor={handleOpenPdfExtractorWithAuth}
        onTogglePrintView={() => setIsPrintView(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        isDbSynced={isDbSynced}
        totalProductsCount={products.length}
        isEmployeeUnlocked={isEmployeeUnlocked}
        onRequireAuth={() => setIsPasswordModalOpen(true)}
        onLockEmployee={() => {
          setIsEmployeeUnlocked(false);
          setUserSession(null);
        }}
        onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
        activityLogsCount={activityLogs.length}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
        deletedProductsCount={deletedProducts.length}
        userSession={userSession}
        onExportCategoryPdf={(catId) => {
          setActiveCategoryId(catId);
          setIsPrintView(true);
        }}
        onExportAllPdf={() => {
          setActiveCategoryId('all');
          setIsPrintView(true);
        }}
        onOpenCategoryOrderModal={() => setIsCategoryOrderModalOpen(true)}
      />

      {/* Global Product Sorting & Custom Order Controller Bar */}
      <div className="no-print bg-white border-b border-slate-200 px-4 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2 text-slate-700">
            <ArrowUpDown className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="font-bold text-slate-900">فرز وتنسيق عرض المنتجات:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Date Sorting */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/80">
              <button
                onClick={() => handleSetSortMode('date_desc')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  sortMode === 'date_desc' 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="عرض المنتجات الأحدث إضافة أولاً"
              >
                <Clock className="w-3 h-3" />
                <span>الأحدث أولاً</span>
              </button>
              <button
                onClick={() => handleSetSortMode('date_asc')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  sortMode === 'date_asc' 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="عرض المنتجات الأقدم إضافة أولاً"
              >
                <History className="w-3 h-3" />
                <span>الأقدم أولاً</span>
              </button>
            </div>

            {/* Price Sorting */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/80">
              <button
                onClick={() => handleSetSortMode('price_asc')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  sortMode === 'price_asc' 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="فرز الأسعار من الأرخص للأغلى"
              >
                <span>السعر: الأرخص للأغلى</span>
              </button>
              <button
                onClick={() => handleSetSortMode('price_desc')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  sortMode === 'price_desc' 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="فرز الأسعار من الأغلى للأرخص"
              >
                <span>السعر: الأغلى للأرخص</span>
              </button>
            </div>

            {/* Custom Drag & Drop Order Toggle Button - ONLY for authenticated employees */}
            {isEmployeeUnlocked && (
              <button
                onClick={handleToggleCustomDrag}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold transition-all shadow-2xs ${
                  sortMode === 'custom' && isDragEditing
                    ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-500/40 shadow-sm animate-pulse'
                    : sortMode === 'custom'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-orange-500 hover:text-orange-600'
                }`}
                title="اضغط لتفعيل/إيقاف وضع تعديل الترتيب بالسحب والإفلات"
              >
                <GripVertical className="w-3.5 h-3.5 text-orange-400" />
                <span>
                  {sortMode === 'custom' && isDragEditing
                    ? 'تعديل الترتيب (نشط ✔️ - اضغط للقفل)'
                    : 'ترتيب مخصص (سحب وإفلات 🖐️)'}
                </span>
              </button>
            )}

            {/* Quick Switch to Protection & Tinting Catalog */}
            {activeCategoryId !== 'cat-protection-tint' ? (
              <button
                onClick={() => {
                  setActiveCategoryId('cat-protection-tint');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-950 text-[11px] font-bold transition-all shadow-2xs"
                title="الانتقال المباشر لكتالوج خدمات الحماية والعازل الحراري والبولش"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>خدمات الحماية والعازل الحراري 🔥</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const firstCar = categories.find(c => c.id !== 'cat-protection-tint');
                  if (firstCar) setActiveCategoryId(firstCar.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold transition-all shadow-2xs"
                title="الرجوع لكتالوج أكسسوارات السيارات"
              >
                <span>← العودة لأكسسوارات السيارات</span>
              </button>
            )}

          </div>

        </div>

        {/* Info Banner when Custom Drag Editing is Active */}
        {sortMode === 'custom' && isDragEditing && isEmployeeUnlocked && (
          <div className="max-w-7xl mx-auto mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200/80 w-full sm:w-auto shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-orange-500" />
              <span>وضع تعديل الترتيب مفعّل حالياً: اسحب المنتجات لترتيب أماكنها، وعند الانتهاء اضغط زر التعديل أعلاه مرة أخرى للقفل والحفظ بنفس الترتيب.</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        
        {categoriesToDisplay.length > 0 ? (
          <>
            {categoriesToDisplay.map((cat) => {
              if (cat.id === 'cat-protection-tint') {
                return (
                  <section key={cat.id} className="space-y-4">
                    <CategoryHeader
                      category={cat}
                      productCount={protectionControls?.servicesCount || 37}
                      isEmployeeUnlocked={isEmployeeUnlocked}
                      onEditCategory={() => {
                        setEditingCategory(cat);
                        setIsEmployeePanelOpen(true);
                      }}
                      onDeleteCategory={(catId) => {
                        handleRequestDeleteCategory(catId, true);
                      }}
                      extraActions={
                        <div className="no-print inline-flex items-center gap-2 flex-wrap">
                          {/* Editing actions ONLY visible when employee is logged in */}
                          {isEmployeeUnlocked && (
                            <>
                              <button
                                onClick={protectionControls?.toggleEditing}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-bold text-xs transition-all shadow-xs cursor-pointer ${
                                  protectionControls?.isEditing
                                    ? 'bg-orange-600 text-white ring-2 ring-orange-400 animate-pulse'
                                    : 'bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700'
                                }`}
                                title="تفعيل وضع التعديل لكافة الأسعار والمسميات والملاحظات"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{protectionControls?.isEditing ? 'إنهاء التعديل' : 'تعديل الأسعار والخدمات'}</span>
                              </button>

                              {protectionControls?.isEditing && (
                                <>
                                  <button
                                    onClick={protectionControls?.openAddModal}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    title="إضافة خدمة أو باقة جديدة"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>إضافة بند جديد</span>
                                  </button>

                                  <button
                                    onClick={protectionControls?.openReorderModal}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    title="إعادة ترتيب التبويبات والأقسام"
                                  >
                                    <ArrowUpDown className="w-3.5 h-3.5 text-orange-400" />
                                    <span>ترتيب التبويبات</span>
                                  </button>

                                  <button
                                    onClick={protectionControls?.resetDefaults}
                                    className="p-1 text-slate-400 hover:text-rose-400 bg-slate-800 rounded border border-slate-700 transition-colors cursor-pointer"
                                    title="إعادة التعيين للأسعار الافتراضية"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          <button
                            onClick={protectionControls?.printCatalog}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors shadow-xs cursor-pointer"
                            title="طباعة كتالوج وعروض أسعار الحماية"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-400" />
                            <span className="hidden sm:inline">طباعة الكتالوج</span>
                          </button>

                          {protectionControls?.isDbSynced && isEmployeeUnlocked && (
                            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[11px] font-semibold">
                              <Check className="w-3 h-3" />
                              <span>متصل بالسحابة</span>
                            </span>
                          )}
                        </div>
                      }
                    />
                    <ProtectionTintCatalog 
                      isEmployeeUnlocked={isEmployeeUnlocked} 
                      onRegisterControls={setProtectionControls}
                      onLogActivity={(action, details) => {
                        logActivityToDb({
                          userName: userSession?.displayName || 'الموظف',
                          userRole: userSession?.role || 'admin',
                          actionType: 'product_edit',
                          details
                        });
                      }} 
                    />
                  </section>
                );
              }

              const rawCatProducts = filteredProducts.filter((p) => matchesProductCategory(p, cat.id));

              const catProducts = sortProductsList(rawCatProducts);

              // Hide empty category in search if no items match
              if (catProducts.length === 0 && searchQuery.trim() !== '') {
                return null;
              }

              return (
                <section key={cat.id} className="space-y-4">
                  
                  {/* Category Header Card */}
                  <CategoryHeader
                    category={cat}
                    productCount={catProducts.length}
                    isEmployeeUnlocked={isEmployeeUnlocked}
                    onEditCategory={() => {
                      setEditingCategory(cat);
                      setIsEmployeePanelOpen(true);
                    }}
                    onDeleteCategory={(catId) => {
                      handleRequestDeleteCategory(catId, true);
                    }}
                    onAddNewProduct={() => {
                      setActiveCategoryId(cat.id);
                      setEditingProduct(null);
                      setIsEmployeePanelOpen(true);
                    }}
                  />

                  {/* Products Grid in High Density Layout */}
                  {catProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5">
                      {catProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          frameHeight={globalFrameHeight}
                          frameRatio={globalFrameRatio}
                          isEmployeeUnlocked={isEmployeeUnlocked}
                          isHighlighted={highlightedProductId === product.id}
                          isDraggable={sortMode === 'custom' && isDragEditing}
                          isBeingDragged={draggingProductId === product.id}
                          isDragTarget={dragOverProductId === product.id}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                          onEditProduct={handleRequestEditProduct}
                          onDeleteProduct={handleDeleteProduct}
                          onViewImage={(prod) => setActiveViewingProduct(prod)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                      <p className="text-slate-500 text-sm font-medium">
                        لا توجد منتجات مضافة لهذا القسم حتى الآن.
                      </p>
                      {isEmployeeUnlocked && (
                        <button
                          onClick={() => {
                            setActiveCategoryId(cat.id);
                            setEditingProduct(null);
                            setIsEmployeePanelOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold shadow-xs transition-all"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>إضافة أول منتج لهذا القسم</span>
                        </button>
                      )}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Extra Products Section (if any product has an unassigned category) */}
            {activeCategoryId === 'all' && (() => {
              const matchedIds = new Set(
                categories.flatMap(c => filteredProducts.filter(p => matchesProductCategory(p, c.id)).map(p => p.id))
              );
              const rawExtraProducts = filteredProducts.filter(p => !matchedIds.has(p.id));
              const extraProducts = sortProductsList(rawExtraProducts);

              if (extraProducts.length === 0) return null;

              return (
                <section className="space-y-4">
                  <div className="bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold">منتجات إضافية / عامة</h2>
                      <p className="text-xs text-slate-300">منتجات غير مخصصة لقسم محدد ({extraProducts.length} منتج)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5">
                    {extraProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        frameHeight={globalFrameHeight}
                        frameRatio={globalFrameRatio}
                        isEmployeeUnlocked={isEmployeeUnlocked}
                        isHighlighted={highlightedProductId === product.id}
                        isDraggable={sortMode === 'custom' && isDragEditing}
                        isBeingDragged={draggingProductId === product.id}
                        isDragTarget={dragOverProductId === product.id}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        onEditProduct={handleRequestEditProduct}
                        onDeleteProduct={handleDeleteProduct}
                        onViewImage={(prod) => setActiveViewingProduct(prod)}
                      />
                    ))}
                  </div>
                </section>
              );
            })()}
          </>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-4 shadow-sm">
            <SearchX className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">لا توجد أقسام متطابقة</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              لم يتم العثور على أقسام أو منتجات مطابقة لعملية البحث الحالية.
            </p>
            <button
              onClick={() => {
                setActiveCategoryId('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold"
            >
              عرض كافة الأقسام
            </button>
          </div>
        )}

      </main>

      {/* 3. Footer Bar */}
      <footer className="no-print bg-white border-t border-slate-200 mt-12 py-5 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WolfLogo size="sm" />
            <span className="font-bold text-slate-800">وولف كار - Wolf Car Qatar</span>
            <span>• نظام كتالوج المعرض الرقمي وقاعدة البيانات السحابية الرسمية</span>
          </div>

          <div className="flex items-center gap-2">
            {!isEmployeeUnlocked ? (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-orange-600 font-bold transition-colors"
              >
                <LockKeyhole className="w-3.5 h-3.5" />
                <span>دخول الموظفين</span>
              </button>
            ) : (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                لوحة الإدارة نشطة ({userSession?.displayName || 'المسؤول'})
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* MODAL 0: Staff Password Authentication Modal */}
      {isPasswordModalOpen && (
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onAuthenticated={(session) => {
            setUserSession(session);
            setIsEmployeeUnlocked(true);
            setIsPasswordModalOpen(false);
            setIsEmployeePanelOpen(true);
          }}
          onSuccess={() => {
            setIsEmployeeUnlocked(true);
            setIsPasswordModalOpen(false);
            setIsEmployeePanelOpen(true);
          }}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}

      {/* MODAL 1: Employee Management & Add/Edit/Bulk Delete Panel */}
      {isEmployeePanelOpen && (
        <EmployeePanel
          categories={categories}
          products={products}
          activeCategoryId={activeCategoryId}
          editingProduct={editingProduct}
          editingCategory={editingCategory}
          onSaveProduct={handleSaveProduct}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={(catId) => handleRequestDeleteCategory(catId, true)}
          onDeleteMultipleProducts={handleDeleteMultipleProducts}
          onBulkImportProducts={handleBulkImportProducts}
          onOpenPdfExtractor={handleOpenPdfExtractorWithAuth}
          onOpenCategoryOrderModal={() => setIsCategoryOrderModalOpen(true)}
          onSaveCategoryOrder={handleSaveCategoryOrder}
          onClose={() => {
            setIsEmployeePanelOpen(false);
            setEditingProduct(null);
            setEditingCategory(null);
          }}
        />
      )}

      {/* MODAL 2: Barcode Scanner / POS Search Modal */}
      {isBarcodeScannerOpen && (
        <BarcodeScannerModal
          products={products}
          categories={categories}
          isEmployeeUnlocked={isEmployeeUnlocked}
          onEditProduct={handleRequestEditProduct}
          onSelectProduct={(product) => {
            setIsBarcodeScannerOpen(false);
            setActiveCategoryId(product.categoryId);
            setSearchQuery(product.name);
          }}
          onClose={() => setIsBarcodeScannerOpen(false)}
        />
      )}

      {/* MODAL 3: Explanation & Architecture Guide Modal */}
      {isGuideModalOpen && (
        <ExplanationGuideModal onClose={() => setIsGuideModalOpen(false)} />
      )}

      {/* MODAL 4: PDF Image Extractor & Bulk Image Sync Modal */}
      {isPdfExtractorOpen && (
        <PdfExtractorModal
          isOpen={isPdfExtractorOpen}
          products={products}
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSaveCategory={handleSaveCategory}
          onSuccess={async (updatedProducts, updatedCategory) => {
            setProducts(updatedProducts);
            if (updatedCategory) {
              setCategories((prev) => {
                const idx = prev.findIndex(c => c.id === updatedCategory.id);
                if (idx >= 0) {
                  return prev.map(c => c.id === updatedCategory.id ? updatedCategory : c);
                } else {
                  return [...prev, updatedCategory];
                }
              });
              setActiveCategoryId(updatedCategory.id);
            }
            await logActivityToDb({
              actionType: 'pdf_extract',
              userRole: userSession?.role || 'it',
              userName: userSession?.displayName || 'المسؤول',
              categoryId: updatedCategory?.id,
              categoryName: updatedCategory?.name,
              details: `استخراج وقص صور ${updatedProducts.length} منتج من كتالوج PDF وربطها بقسم (${updatedCategory?.name || 'السيارات'}) بواسطة ${userSession?.displayName || 'المسؤول'}`,
            });
          }}
          onClose={() => setIsPdfExtractorOpen(false)}
        />
      )}

      {/* MODAL 5: Activity Log & Price Change Tracker Modal */}
      <ActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
        logs={activityLogs}
        currentUserRole={userSession?.role}
        onNavigateToProduct={handleNavigateToProductFromLog}
      />

      {/* MODAL 6: Recycle Bin (30-day retention with instant restore) */}
      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        deletedProducts={deletedProducts}
        categories={categories}
        onRestoreProduct={handleRestoreProduct}
        onHardDeleteProduct={handleRequestHardDelete}
        onEmptyTrash={handleRequestEmptyTrash}
        onViewImage={(url, title) => {
          const matchedProd = products.find(p => p.imageUrl === url) || deletedProducts.find(d => d.originalProduct.imageUrl === url)?.originalProduct;
          if (matchedProd) {
            setActiveViewingProduct(matchedProd);
          }
        }}
      />

      {/* MODAL 7: Password-Protected Deletion Verification */}
      {pendingDeleteAction && (
        <DeleteConfirmPasswordModal
          isOpen={!!pendingDeleteAction}
          title={pendingDeleteAction.title}
          description={pendingDeleteAction.description}
          itemCount={pendingDeleteAction.count}
          onConfirm={handleExecuteConfirmedDelete}
          onClose={() => setPendingDeleteAction(null)}
        />
      )}

      {/* MODAL 8: High-Resolution Product Lightbox Image Viewer */}
      {activeViewingProduct && (
        <ImageViewerModal
          product={activeViewingProduct}
          category={categories.find(c => c.id === activeViewingProduct.categoryId)}
          onClose={() => setActiveViewingProduct(null)}
          onPrevProduct={() => {
            const idx = filteredProducts.findIndex(p => p.id === activeViewingProduct.id);
            if (idx > 0) {
              setActiveViewingProduct(filteredProducts[idx - 1]);
            } else if (filteredProducts.length > 0) {
              setActiveViewingProduct(filteredProducts[filteredProducts.length - 1]);
            }
          }}
          onNextProduct={() => {
            const idx = filteredProducts.findIndex(p => p.id === activeViewingProduct.id);
            if (idx >= 0 && idx < filteredProducts.length - 1) {
              setActiveViewingProduct(filteredProducts[idx + 1]);
            } else if (filteredProducts.length > 0) {
              setActiveViewingProduct(filteredProducts[0]);
            }
          }}
        />
      )}

      {/* MODAL 9: Category Order Modal (Reordering Main Header Categories) */}
      <CategoryOrderModal
        categories={categories}
        isOpen={isCategoryOrderModalOpen}
        onClose={() => setIsCategoryOrderModalOpen(false)}
        onSaveOrder={handleSaveCategoryOrder}
        onResetDefaultOrder={() => {
          handleSaveCategoryOrder(INITIAL_CATEGORIES);
        }}
      />

    </div>
  );
}
