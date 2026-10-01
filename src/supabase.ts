import { createClient } from '@supabase/supabase-js';
import { CarCategory, Product, CatalogSettings, ActivityLog, DeletedProduct, UserRole } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './data/initialData';
import { optimizeProductMedia } from './utils/imageOptimizer';
import { idbGet, idbSet } from './utils/idbStorage';

// Supabase Configuration provided by the user
export const SUPABASE_URL = 'https://kavbbdjfoldqhbnzegvg.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Hmi673rr_9U1LR-RnQMFSg_x33SfjrC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 5,
    }
  }
});

// Storage keys
const IDB_PRODUCTS_KEY = 'wolf_car_products_v6';
const IDB_CATEGORIES_KEY = 'wolf_car_categories_v6';
const IDB_LOGS_KEY = 'wolf_car_logs_v6';
const IDB_TRASH_KEY = 'wolf_car_trash_v6';
const IDB_LAST_SYNC_KEY = 'wolf_car_last_sync_v6';

// In-memory cache for ultra-fast 0ms sync access initialized with complete 352-product catalog
let memoryCategories: CarCategory[] = INITIAL_CATEGORIES;
let memoryProducts: Product[] = INITIAL_PRODUCTS;
let memoryLogs: ActivityLog[] = [];
let memoryTrash: DeletedProduct[] = [];
let lastSyncTimestamp: string = '';

// Subscribers listeners
const categoryListeners = new Set<(cats: CarCategory[]) => void>();
const productListeners = new Set<(prods: Product[]) => void>();
const logListeners = new Set<(logs: ActivityLog[]) => void>();
const trashListeners = new Set<(trash: DeletedProduct[]) => void>();

// Helper to notify category listeners
const notifyCategories = (cats: CarCategory[]) => {
  memoryCategories = cats;
  categoryListeners.forEach(fn => {
    try { fn(cats); } catch (_) {}
  });
};

// Helper to notify product listeners
const notifyProducts = (prods: Product[]) => {
  memoryProducts = prods;
  productListeners.forEach(fn => {
    try { fn(prods); } catch (_) {}
  });
};

// Helper to notify log listeners
const notifyLogs = (logs: ActivityLog[]) => {
  memoryLogs = logs;
  logListeners.forEach(fn => {
    try { fn(logs); } catch (_) {}
  });
};

// Helper to notify trash listeners
const notifyTrash = (trash: DeletedProduct[]) => {
  memoryTrash = trash;
  trashListeners.forEach(fn => {
    try { fn(trash); } catch (_) {}
  });
};

// Format Category for Supabase
export const formatCategoryForSupabase = (cat: CarCategory) => ({
  id: cat.id,
  name: cat.name,
  car_model: cat.carModel || cat.name,
  header_title: cat.headerTitle || cat.name,
  main_car_image_url: cat.mainCarImageUrl || '',
  description: cat.description || '',
  order: cat.order ?? 0,
  data: {
    id: cat.id,
    name: cat.name,
    carModel: cat.carModel,
    headerTitle: cat.headerTitle,
    order: cat.order,
    layoutType: cat.layoutType || (cat.id === 'cat-protection-tint' ? 'protection_tint' : 'standard')
  }
});

// Helper to parse category from Supabase or Backup
export const parseCategoryFromSupabase = (row: any): CarCategory => {
  if (!row) {
    return {
      id: `cat-${Date.now()}`,
      name: 'بدون اسم',
      carModel: '',
      headerTitle: '',
      mainCarImageUrl: '',
      order: 0,
      layoutType: 'standard'
    };
  }
  const id = row.id || row.data?.id || `cat-${Date.now()}`;
  return {
    id,
    name: row.name || row.data?.name || 'بدون اسم',
    carModel: row.car_model || row.carModel || row.data?.carModel || row.name || '',
    headerTitle: row.header_title || row.headerTitle || row.data?.headerTitle || row.name || '',
    mainCarImageUrl: row.main_car_image_url || row.mainCarImageUrl || row.data?.mainCarImageUrl || '',
    description: row.description || row.data?.description || '',
    order: row.order ?? row.data?.order ?? 0,
    layoutType: row.layout_type || row.layoutType || row.data?.layoutType || (id === 'cat-protection-tint' ? 'protection_tint' : 'standard')
  };
};

// Format Product for Supabase (optimized without bloating JSONB data)
export const formatProductForSupabase = (p: Product) => ({
  id: p.id,
  category_id: p.categoryId,
  name: p.name,
  barcode: p.barcode,
  price: Number(p.price) || 0,
  old_price: (p.oldPrice !== undefined && p.oldPrice !== null) ? Number(p.oldPrice) : null,
  currency: p.currency || 'QAR',
  image_url: p.imageUrl || '',
  description: p.description || '',
  image_transform: p.imageTransform || null,
  created_at: p.createdAt || new Date().toISOString(),
  updated_at: p.updatedAt || new Date().toISOString(),
  data: {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    price: p.price,
    oldPrice: p.oldPrice,
    currency: p.currency,
    categoryId: p.categoryId
  }
});

// Helper to parse product from Supabase or Backup
export const parseProductFromSupabase = (row: any): Product => {
  if (!row) {
    return {
      id: `prod-${Date.now()}`,
      categoryId: '',
      name: '',
      barcode: '',
      price: 0,
      imageUrl: '',
      currency: 'QAR'
    };
  }
  
  // Safely extract image URL (prioritize column, fallback to data blob if needed)
  const img = row.image_url || row.imageUrl || row.data?.imageUrl || row.data?.image_url || '';
  
  return {
    id: row.id || row.data?.id || `prod-${Date.now()}`,
    categoryId: row.category_id || row.categoryId || row.data?.categoryId || row.data?.category_id || '',
    name: row.name || row.data?.name || '',
    barcode: row.barcode || row.data?.barcode || '',
    price: Number(row.price ?? row.data?.price ?? 0),
    oldPrice: (row.old_price !== undefined && row.old_price !== null) 
      ? Number(row.old_price) 
      : ((row.oldPrice !== undefined && row.oldPrice !== null) 
          ? Number(row.oldPrice) 
          : (row.data?.oldPrice ? Number(row.data.oldPrice) : undefined)),
    currency: row.currency || row.data?.currency || 'QAR',
    imageUrl: img,
    description: row.description || row.data?.description || '',
    imageTransform: row.image_transform || row.imageTransform || row.data?.imageTransform || undefined,
    createdAt: row.created_at || row.createdAt || row.data?.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || row.data?.updatedAt || new Date().toISOString()
  };
};

// Unified async cache update
export const updateLocalCache = (products?: Product[], categories?: CarCategory[]) => {
  if (products !== undefined) {
    memoryProducts = products;
    notifyProducts(products);
    idbSet(IDB_PRODUCTS_KEY, products).catch(() => {});
  }
  if (categories !== undefined) {
    memoryCategories = categories;
    notifyCategories(categories);
    idbSet(IDB_CATEGORIES_KEY, categories).catch(() => {});
  }
};

// Incremental Delta update: update only changed/inserted/deleted products
export const applyProductDelta = (deltaProduct: Product, isDelete: boolean = false) => {
  const current = memoryProducts ? [...memoryProducts] : [...INITIAL_PRODUCTS];
  let updated: Product[];

  if (isDelete) {
    updated = current.filter(p => p.id !== deltaProduct.id);
  } else {
    const idx = current.findIndex(p => p.id === deltaProduct.id);
    if (idx >= 0) {
      current[idx] = deltaProduct;
      updated = current;
    } else {
      updated = [deltaProduct, ...current];
    }
  }

  updateLocalCache(updated, undefined);
};

export const applyCategoryDelta = (deltaCat: CarCategory, isDelete: boolean = false) => {
  const current = memoryCategories ? [...memoryCategories] : [...INITIAL_CATEGORIES];
  let updated: CarCategory[];

  if (isDelete) {
    updated = current.filter(c => c.id !== deltaCat.id);
  } else {
    const idx = current.findIndex(c => c.id === deltaCat.id);
    if (idx >= 0) {
      current[idx] = deltaCat;
      updated = current;
    } else {
      updated = [...current, deltaCat];
    }
  }

  updateLocalCache(undefined, updated);
};

// Synchronous getters (returns in-memory or fallback)
export const getLocalCachedProducts = (): Product[] | null => memoryProducts;
export const getLocalCachedCategories = (): CarCategory[] | null => memoryCategories;
export const getLocalCachedLogs = (): ActivityLog[] => memoryLogs;
export const getLocalCachedTrash = (): DeletedProduct[] => memoryTrash;

export const saveLocalCachedLogs = (logs: ActivityLog[]) => {
  notifyLogs(logs);
  idbSet(IDB_LOGS_KEY, logs).catch(() => {});
};

export const saveLocalCachedTrash = (items: DeletedProduct[]) => {
  notifyTrash(items);
  idbSet(IDB_TRASH_KEY, items).catch(() => {});
};

// Real-time Delta Listener (Listens ONLY for new/changed items pushed by IT or other users)
let isRealtimeSubscribed = false;

function setupRealtimeDeltaListener() {
  if (isRealtimeSubscribed || typeof window === 'undefined') return;
  isRealtimeSubscribed = true;

  try {
    // 1. Listen for instant changes on 'products' table (INSERT, UPDATE, DELETE)
    supabase
      .channel('public:products_delta')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              applyProductDelta({ id: oldId } as Product, true);
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const parsed = parseProductFromSupabase(payload.new);
            applyProductDelta(parsed, false);
          }
        }
      )
      .subscribe();

    // 2. Listen for instant changes on 'categories' table
    supabase
      .channel('public:categories_delta')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              applyCategoryDelta({ id: oldId } as CarCategory, true);
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const parsed = parseCategoryFromSupabase(payload.new);
            applyCategoryDelta(parsed, false);
          }
        }
      )
      .subscribe();
  } catch (e) {
    console.warn('Realtime delta setup note:', e);
  }
}

// Single-flight Catalog Fetcher (Prevents duplicate requests & ensures live Supabase data is loaded)
let catalogFetchPromise: Promise<void> | null = null;

// Progress listener for loading screen
type LoadingProgressCallback = (percent: number, status: string) => void;
const loadingListeners = new Set<LoadingProgressCallback>();

export const subscribeToLoadingProgress = (cb: LoadingProgressCallback) => {
  loadingListeners.add(cb);
  return () => { loadingListeners.delete(cb); };
};

const notifyProgress = (percent: number, status: string) => {
  loadingListeners.forEach(cb => {
    try { cb(percent, status); } catch (_) {}
  });
};

async function fetchFullCatalogOnce(): Promise<void> {
  if (catalogFetchPromise) return catalogFetchPromise;

  catalogFetchPromise = (async () => {
    // 0. Ensure initial memory has data immediately so UI never flickers or appears blank
    if (!memoryCategories || memoryCategories.length === 0) {
      notifyCategories(INITIAL_CATEGORIES);
    }
    if (!memoryProducts || memoryProducts.length === 0) {
      notifyProducts(INITIAL_PRODUCTS);
    }

    notifyProgress(20, 'جاري قراءة الذاكرة المؤقتة...');

    // 1. Try loading from IndexedDB first for instant startup (<50ms)
    try {
      const [savedProds, savedCats, savedLogs, savedTrash, savedSync] = await Promise.all([
        idbGet<Product[]>(IDB_PRODUCTS_KEY),
        idbGet<CarCategory[]>(IDB_CATEGORIES_KEY),
        idbGet<ActivityLog[]>(IDB_LOGS_KEY),
        idbGet<DeletedProduct[]>(IDB_TRASH_KEY),
        idbGet<string>(IDB_LAST_SYNC_KEY),
      ]);

      if (savedSync) {
        lastSyncTimestamp = savedSync;
      }

      if (savedCats && savedCats.length > 0) {
        if (!savedCats.some(c => c.id === 'cat-protection-tint')) {
          const defaultProtectionCat = INITIAL_CATEGORIES.find(c => c.id === 'cat-protection-tint');
          if (defaultProtectionCat) savedCats.push(defaultProtectionCat);
        }
        memoryCategories = savedCats;
        notifyCategories(savedCats);
      }
      if (savedProds && savedProds.length > 0) {
        memoryProducts = savedProds;
        notifyProducts(savedProds);
      }
      if (savedLogs && savedLogs.length > 0) {
        memoryLogs = savedLogs;
        notifyLogs(savedLogs);
      }
      if (savedTrash && savedTrash.length > 0) {
        memoryTrash = savedTrash;
        notifyTrash(savedTrash);
      }
    } catch (err) {
      console.warn('IDB load notice:', err);
    }

    // Set up Realtime Delta stream so live updates are pushed immediately
    setupRealtimeDeltaListener();

    notifyProgress(40, 'جاري مزامنة أقسام السيارات من السحابة...');

    // 2. Fetch live Categories directly from Supabase
    let fetchedCategories: CarCategory[] = [];
    try {
      let sbCats: any[] | null = null;
      const queryWithOrder = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

      if (!queryWithOrder.error && queryWithOrder.data && queryWithOrder.data.length > 0) {
        sbCats = queryWithOrder.data;
      } else {
        const fallbackQuery = await supabase.from('categories').select('*');
        if (!fallbackQuery.error && fallbackQuery.data) {
          sbCats = fallbackQuery.data;
        }
      }

      // Check saved custom category order from settings or local storage
      let savedCustomOrder: string[] = [];
      try {
        const { data: orderRow } = await supabase
          .from('settings')
          .select('id, data')
          .eq('id', 'category_order')
          .maybeSingle();

        if (orderRow?.data && Array.isArray(orderRow.data)) {
          savedCustomOrder = orderRow.data;
        } else if (orderRow?.data?.order && Array.isArray(orderRow.data.order)) {
          savedCustomOrder = orderRow.data.order;
        }
      } catch (_) {}

      if (!savedCustomOrder.length) {
        try {
          const localOrder = localStorage.getItem('wolfcar_categories_order');
          if (localOrder) {
            savedCustomOrder = JSON.parse(localOrder);
          }
        } catch (_) {}
      }

      if (sbCats && sbCats.length > 0) {
        fetchedCategories = sbCats.map(parseCategoryFromSupabase);
        if (!fetchedCategories.some(c => c.id === 'cat-protection-tint')) {
          const defaultProtectionCat = INITIAL_CATEGORIES.find(c => c.id === 'cat-protection-tint');
          if (defaultProtectionCat) fetchedCategories.push(defaultProtectionCat);
        }

        if (savedCustomOrder.length > 0) {
          fetchedCategories.sort((a, b) => {
            const idxA = savedCustomOrder.indexOf(a.id);
            const idxB = savedCustomOrder.indexOf(b.id);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return (a.order ?? 0) - (b.order ?? 0);
          });
        } else {
          fetchedCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }

        updateLocalCache(undefined, fetchedCategories);
      }

      // Fetch protection catalog from Supabase settings
      try {
        const { data: settingRow } = await supabase
          .from('settings')
          .select('id, data')
          .eq('id', 'protection_tint_catalog')
          .maybeSingle();

        if (settingRow && settingRow.data) {
          notifyProtectionCatalog(settingRow.data);
          try {
            localStorage.setItem('wolfcar_protection_tint_data', JSON.stringify(settingRow.data));
          } catch (_) {}
        }
      } catch (settingErr) {
        console.warn('Protection catalog settings sync note:', settingErr);
      }
    } catch (catErr) {
      console.warn('Categories sync note:', catErr);
    }

    notifyProgress(60, 'جاري استدعاء قائمة المنتجات والصور...');

    // 3. Fetch Products from Supabase in safe, fast batches (e.g. 50 items per batch to avoid statement timeout)
    try {
      const pageSize = 50;
      let allFetchedProducts: Product[] = [];
      let from = 0;
      let hasMore = true;
      let consecutiveErrors = 0;

      while (hasMore && consecutiveErrors < 3) {
        const to = from + pageSize - 1;
        const { data: pageRows, error: pageErr } = await supabase
          .from('products')
          .select('id, category_id, name, barcode, price, old_price, currency, image_url, description, image_transform, created_at, updated_at')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (pageErr) {
          console.warn(`Supabase products fetch range ${from}-${to} notice:`, pageErr.message);
          consecutiveErrors++;
          from += pageSize;
          continue;
        }

        if (pageRows && pageRows.length > 0) {
          const parsedBatch = pageRows.map(parseProductFromSupabase);
          allFetchedProducts.push(...parsedBatch);
          
          const progressVal = Math.min(95, 60 + Math.round((allFetchedProducts.length / 400) * 35));
          notifyProgress(progressVal, `تم تحميل ${allFetchedProducts.length} منتجاً بصورها...`);

          // Progressive UI update
          if (allFetchedProducts.length > 0) {
            updateLocalCache(allFetchedProducts, undefined);
          }

          if (pageRows.length < pageSize) {
            hasMore = false;
          } else {
            from += pageSize;
          }
        } else {
          hasMore = false;
        }
      }

      if (allFetchedProducts.length > 0) {
        // Merge with existing memory products to preserve any offline/local images
        const currentProdsMap = new Map<string, Product>();
        (memoryProducts || []).forEach(p => currentProdsMap.set(p.id, p));

        allFetchedProducts.forEach(p => {
          const existing = currentProdsMap.get(p.id);
          if (existing && !p.imageUrl && existing.imageUrl) {
            p.imageUrl = existing.imageUrl;
          }
          currentProdsMap.set(p.id, p);
        });

        const merged = Array.from(currentProdsMap.values());
        updateLocalCache(merged, undefined);
      }
    } catch (prodErr) {
      console.warn('Products sync note (using local cache):', prodErr);
    }

    notifyProgress(100, 'اكتملت المزامنة بنجاح!');

    // 4. Update sync timestamp
    const now = new Date().toISOString();
    lastSyncTimestamp = now;
    idbSet(IDB_LAST_SYNC_KEY, now).catch(() => {});
  })();

  return catalogFetchPromise;
}

// 1. Subscribe to Categories
export const subscribeToCategories = (callback: (categories: CarCategory[]) => void) => {
  categoryListeners.add(callback);

  if (memoryCategories && memoryCategories.length > 0) {
    callback(memoryCategories);
  }

  fetchFullCatalogOnce().catch(() => {});

  return () => {
    categoryListeners.delete(callback);
  };
};

// 2. Subscribe to Products
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  productListeners.add(callback);

  if (memoryProducts && memoryProducts.length > 0) {
    callback(memoryProducts);
  }

  fetchFullCatalogOnce().catch(() => {});

  return () => {
    productListeners.delete(callback);
  };
};

// Helper to sync local state to backend storage in background (optional on static hosts like Vercel)
const syncToBackend = (products?: Product[], categories?: CarCategory[]) => {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/catalog/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, categories }),
    }).catch(() => {});
  } catch (_) {}
};

// 3. Save single product
export const saveProductToDb = async (product: Product): Promise<boolean> => {
  // 1. Instant state update (0ms UI latency)
  const current = memoryProducts ? [...memoryProducts] : [...INITIAL_PRODUCTS];
  const index = current.findIndex(p => p.id === product.id);
  if (index >= 0) {
    current[index] = product;
  } else {
    current.unshift(product);
  }
  updateLocalCache(current, undefined);
  syncToBackend(current, undefined);

  // 2. Background persist to Supabase
  try {
    const optimized = await optimizeProductMedia(product);
    const formatted = formatProductForSupabase(optimized);
    await supabase.from('products').upsert(formatted, { onConflict: 'id' });
    return true;
  } catch (err) {
    console.warn('Supabase write error (safely cached locally):', err);
    return true;
  }
};

// 4. Delete single product
export const deleteProductFromDb = async (productId: string): Promise<boolean> => {
  const current = memoryProducts ? [...memoryProducts] : [...INITIAL_PRODUCTS];
  const updated = current.filter(p => p.id !== productId);
  updateLocalCache(updated, undefined);
  syncToBackend(updated, undefined);

  try {
    await supabase.from('products').delete().eq('id', productId);
    return true;
  } catch (err) {
    console.warn('Supabase delete error:', err);
    return true;
  }
};

// 5. Delete multiple products
export const deleteMultipleProductsFromDb = async (productIds: string[]): Promise<boolean> => {
  if (productIds.length === 0) return true;

  const current = memoryProducts ? [...memoryProducts] : [...INITIAL_PRODUCTS];
  const set = new Set(productIds);
  const updated = current.filter(p => !set.has(p.id));
  updateLocalCache(updated, undefined);
  syncToBackend(updated, undefined);

  try {
    await supabase.from('products').delete().in('id', productIds);
    return true;
  } catch (err) {
    console.warn('Supabase bulk delete error:', err);
    return true;
  }
};

// 6. Save Category
export const saveCategoryToDb = async (category: CarCategory): Promise<boolean> => {
  const current = memoryCategories ? [...memoryCategories] : [...INITIAL_CATEGORIES];
  const index = current.findIndex(c => c.id === category.id);
  if (index >= 0) {
    current[index] = category;
  } else {
    current.push(category);
  }
  updateLocalCache(undefined, current);
  syncToBackend(undefined, current);

  try {
    const formatted = formatCategoryForSupabase(category);
    await supabase.from('categories').upsert(formatted, { onConflict: 'id' });
    return true;
  } catch (err) {
    console.warn('Supabase save category error:', err);
    return true;
  }
};

// 6.b Save Categories Order
export const saveCategoriesOrderToDb = async (orderedCategories: CarCategory[]): Promise<boolean> => {
  const updatedCategories = orderedCategories.map((cat, idx) => ({
    ...cat,
    order: idx
  }));

  updateLocalCache(undefined, updatedCategories);
  syncToBackend(undefined, updatedCategories);

  const orderedIds = orderedCategories.map(c => c.id);

  // 1. Cache ordered IDs to localStorage
  try {
    localStorage.setItem('wolfcar_categories_order', JSON.stringify(orderedIds));
  } catch (_) {}

  // 2. Persist to Supabase settings table
  try {
    await supabase.from('settings').upsert({
      id: 'category_order',
      data: orderedIds,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase save category_order settings warning:', err);
  }

  // 3. Upsert formatted categories with their order attribute
  try {
    const formatted = updatedCategories.map(formatCategoryForSupabase);
    await supabase.from('categories').upsert(formatted, { onConflict: 'id' });
    return true;
  } catch (err) {
    console.warn('Supabase save categories order error:', err);
    return true;
  }
};

// 7. Delete Category
export const deleteCategoryFromDb = async (categoryId: string): Promise<boolean> => {
  const current = memoryCategories ? [...memoryCategories] : [...INITIAL_CATEGORIES];
  const updated = current.filter(c => c.id !== categoryId);
  updateLocalCache(undefined, updated);
  syncToBackend(undefined, updated);

  try {
    await supabase.from('categories').delete().eq('id', categoryId);
    return true;
  } catch (err) {
    console.warn('Supabase delete category error:', err);
    return true;
  }
};

// 8. Delete Category and its products
export const deleteCategoryAndItsProductsFromDb = async (categoryId: string): Promise<boolean> => {
  const currentCats = memoryCategories ? [...memoryCategories] : [...INITIAL_CATEGORIES];
  const updatedCats = currentCats.filter(c => c.id !== categoryId);
  updateLocalCache(undefined, updatedCats);

  const currentProds = memoryProducts ? [...memoryProducts] : [...INITIAL_PRODUCTS];
  const updatedProds = currentProds.filter(p => p.categoryId !== categoryId);
  updateLocalCache(updatedProds, undefined);
  syncToBackend(updatedProds, updatedCats);

  try {
    await supabase.from('products').delete().eq('category_id', categoryId);
    await supabase.from('categories').delete().eq('id', categoryId);
    return true;
  } catch (err) {
    console.warn('Supabase delete category+products error:', err);
    return true;
  }
};

// 9. Bulk Save Products & Categories
export const bulkSaveProductsToDb = async (newProducts: Product[], newCategories?: CarCategory[]): Promise<boolean> => {
  const existingProducts = memoryProducts ? [...memoryProducts] : [...INITIAL_PRODUCTS];
  const updatedProductsMap = new Map<string, Product>();
  existingProducts.forEach(p => updatedProductsMap.set(p.id, p));
  newProducts.forEach(p => updatedProductsMap.set(p.id, p));
  const mergedProducts = Array.from(updatedProductsMap.values());

  let mergedCategories: CarCategory[] | undefined = undefined;
  if (newCategories && newCategories.length > 0) {
    const existingCats = memoryCategories ? [...memoryCategories] : [...INITIAL_CATEGORIES];
    const catMap = new Map<string, CarCategory>();
    existingCats.forEach(c => catMap.set(c.id, c));
    newCategories.forEach(c => catMap.set(c.id, c));
    mergedCategories = Array.from(catMap.values());
  }

  updateLocalCache(mergedProducts, mergedCategories);
  syncToBackend(mergedProducts, mergedCategories);

  // Background persist to Supabase in chunks
  try {
    if (newCategories && newCategories.length > 0) {
      const formattedCats = newCategories.map(formatCategoryForSupabase);
      await supabase.from('categories').upsert(formattedCats, { onConflict: 'id' });
    }

    const chunkSize = 200;
    for (let i = 0; i < newProducts.length; i += chunkSize) {
      const chunk = newProducts.slice(i, i + chunkSize).map(formatProductForSupabase);
      await supabase.from('products').upsert(chunk, { onConflict: 'id' });
    }
    return true;
  } catch (err) {
    console.warn('Supabase bulk save warning (cached locally):', err);
    return true;
  }
};

// 10. Activity Logs
export const subscribeToActivityLogs = (callback: (logs: ActivityLog[]) => void) => {
  logListeners.add(callback);
  if (memoryLogs.length > 0) {
    callback(memoryLogs);
  } else {
    idbGet<ActivityLog[]>(IDB_LOGS_KEY).then(saved => {
      if (saved && saved.length > 0) {
        notifyLogs(saved);
      }
    }).catch(() => {});
  }

  return () => {
    logListeners.delete(callback);
  };
};

export const logActivityToDb = async (
  logData: Omit<ActivityLog, 'id' | 'timestamp'> & Partial<Pick<ActivityLog, 'id' | 'timestamp'>>
): Promise<boolean> => {
  const fullLog: ActivityLog = {
    ...logData,
    id: logData.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: logData.timestamp || new Date().toISOString(),
  };

  const updated = [fullLog, ...memoryLogs.filter(l => l.id !== fullLog.id)].slice(0, 100);
  saveLocalCachedLogs(updated);

  try {
    await supabase.from('activity_logs').upsert({
      id: fullLog.id,
      timestamp: fullLog.timestamp,
      user_name: fullLog.userName,
      user_role: fullLog.userRole,
      action_type: fullLog.actionType,
      details: fullLog.details,
      data: fullLog
    }, { onConflict: 'id' });
    return true;
  } catch {
    return true;
  }
};

export const clearActivityLogsInDb = async (): Promise<boolean> => {
  saveLocalCachedLogs([]);
  try {
    await supabase.from('activity_logs').delete().neq('id', 'dummy_id');
    return true;
  } catch {
    return true;
  }
};

// 11. Recycle Bin (Trash)
export const moveProductToTrashInDb = async (
  product: Product,
  user: { name: string; role: UserRole }
): Promise<boolean> => {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const deletedItem: DeletedProduct = {
    id: product.id,
    originalProduct: product,
    deletedAt: now.toISOString(),
    deletedBy: user.name,
    deletedRole: user.role,
    expiresAt: expires.toISOString(),
  };

  const currentProducts = memoryProducts ? [...memoryProducts] : [];
  updateLocalCache(currentProducts.filter(p => p.id !== product.id), undefined);

  const currentTrash = [...memoryTrash];
  saveLocalCachedTrash([deletedItem, ...currentTrash.filter(t => t.id !== product.id)]);

  try {
    await supabase.from('products').delete().eq('id', product.id);
    await supabase.from('deleted_products').upsert({
      id: deletedItem.id,
      deleted_at: deletedItem.deletedAt,
      expires_at: deletedItem.expiresAt,
      data: deletedItem
    }, { onConflict: 'id' });
    return true;
  } catch {
    return true;
  }
};

export const moveMultipleProductsToTrashInDb = async (
  productsToTrash: Product[],
  user: { name: string; role: UserRole }
): Promise<boolean> => {
  if (productsToTrash.length === 0) return true;

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const trashItems: DeletedProduct[] = productsToTrash.map(p => ({
    id: p.id,
    originalProduct: p,
    deletedAt: now.toISOString(),
    deletedBy: user.name,
    deletedRole: user.role,
    expiresAt: expires.toISOString(),
  }));

  const pIds = new Set(productsToTrash.map(p => p.id));
  const currentProducts = memoryProducts ? [...memoryProducts] : [];
  updateLocalCache(currentProducts.filter(p => !pIds.has(p.id)), undefined);

  const currentTrash = [...memoryTrash];
  saveLocalCachedTrash([...trashItems, ...currentTrash.filter(t => !pIds.has(t.id))]);

  try {
    await supabase.from('products').delete().in('id', Array.from(pIds));
    const rows = trashItems.map(item => ({
      id: item.id,
      deleted_at: item.deletedAt,
      expires_at: item.expiresAt,
      data: item
    }));
    await supabase.from('deleted_products').upsert(rows, { onConflict: 'id' });
    return true;
  } catch {
    return true;
  }
};

export const subscribeToDeletedProducts = (callback: (items: DeletedProduct[]) => void) => {
  trashListeners.add(callback);
  if (memoryTrash.length > 0) {
    callback(memoryTrash);
  } else {
    idbGet<DeletedProduct[]>(IDB_TRASH_KEY).then(saved => {
      if (saved && saved.length > 0) {
        notifyTrash(saved);
      }
    }).catch(() => {});
  }

  return () => {
    trashListeners.delete(callback);
  };
};

export const restoreProductFromTrashInDb = async (deletedItem: DeletedProduct): Promise<boolean> => {
  const prod = deletedItem.originalProduct;

  saveLocalCachedTrash(memoryTrash.filter(t => t.id !== deletedItem.id));

  const currentProducts = memoryProducts ? [...memoryProducts] : [];
  updateLocalCache([prod, ...currentProducts.filter(p => p.id !== prod.id)], undefined);

  try {
    await supabase.from('deleted_products').delete().eq('id', deletedItem.id);
    await saveProductToDb({ ...prod, updatedAt: new Date().toISOString() });
    return true;
  } catch {
    return true;
  }
};

export const hardDeleteFromTrashInDb = async (trashId: string): Promise<boolean> => {
  saveLocalCachedTrash(memoryTrash.filter(t => t.id !== trashId));

  try {
    await supabase.from('deleted_products').delete().eq('id', trashId);
    return true;
  } catch {
    return true;
  }
};

export const emptyTrashInDb = async (): Promise<boolean> => {
  saveLocalCachedTrash([]);
  try {
    await supabase.from('deleted_products').delete().neq('id', 'dummy_id');
    return true;
  } catch {
    return true;
  }
};

// 12. Protection & Tinting Catalog Persistence (Supabase + LocalCache)
let memoryProtectionCatalog: any = null;
const protectionCatalogListeners: ((data: any) => void)[] = [];

export const notifyProtectionCatalog = (data: any) => {
  if (!data) return;
  memoryProtectionCatalog = data;
  protectionCatalogListeners.forEach(fn => {
    try { fn(data); } catch (_) {}
  });
};

export const subscribeToProtectionCatalog = (callback: (data: any) => void) => {
  protectionCatalogListeners.push(callback);
  if (memoryProtectionCatalog) {
    callback(memoryProtectionCatalog);
  } else {
    try {
      const saved = localStorage.getItem('wolfcar_protection_tint_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        memoryProtectionCatalog = parsed;
        callback(parsed);
      }
    } catch (_) {}
  }
  return () => {
    const idx = protectionCatalogListeners.indexOf(callback);
    if (idx >= 0) protectionCatalogListeners.splice(idx, 1);
  };
};

export const getProtectionCatalogData = (): any | null => {
  if (memoryProtectionCatalog) return memoryProtectionCatalog;
  try {
    const saved = localStorage.getItem('wolfcar_protection_tint_data');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const saveProtectionCatalogToDb = async (data: any): Promise<boolean> => {
  if (!data) return false;
  memoryProtectionCatalog = data;
  try {
    localStorage.setItem('wolfcar_protection_tint_data', JSON.stringify(data));
  } catch (_) {}
  notifyProtectionCatalog(data);

  // 1. Sync to Supabase settings table
  try {
    await supabase.from('settings').upsert({
      id: 'protection_tint_catalog',
      data: data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('Supabase settings save notice:', err);
  }

  // 2. Also update Supabase categories row for cat-protection-tint
  try {
    await supabase.from('categories').update({
      data: { protectionCatalog: data }
    }).eq('id', 'cat-protection-tint');
  } catch (err) {
    console.warn('Supabase category update notice:', err);
  }

  return true;
};

// 13. Migration & Seeding tool
export const seedInitialDatabase = async () => {
  // Trigger single catalog load
  await fetchFullCatalogOnce();
};

// SQL Schema for Supabase SQL Editor if user wants to create clean tables:
export const SUPABASE_SQL_SCHEMA = `
-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  car_model TEXT,
  header_title TEXT,
  main_car_image_url TEXT,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  data JSONB
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  barcode TEXT,
  price NUMERIC DEFAULT 0,
  old_price NUMERIC,
  currency TEXT DEFAULT 'QAR',
  image_url TEXT,
  description TEXT,
  image_transform JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- 3. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT,
  user_role TEXT,
  action_type TEXT,
  details TEXT,
  data JSONB
);

-- 4. Create deleted_products table
CREATE TABLE IF NOT EXISTS public.deleted_products (
  id TEXT PRIMARY KEY,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  data JSONB
);

-- 5. Enable Public Access (Allow Read/Write for Catalog App)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all public on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public on activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public on deleted_products" ON public.deleted_products FOR ALL USING (true) WITH CHECK (true);
`;
