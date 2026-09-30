import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { CarCategory, Product, CatalogSettings, ActivityLog, DeletedProduct, UserRole } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS } from './data/initialData';
import { optimizeProductMedia } from './utils/imageOptimizer';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collections
export const categoriesCol = collection(db, 'categories');
export const productsCol = collection(db, 'products');
export const settingsCol = collection(db, 'settings');
export const activityLogsCol = collection(db, 'activity_logs');
export const deletedProductsCol = collection(db, 'deleted_products');

// Helper function to sanitize objects before sending to Firestore (removes undefined values)
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean as T;
}

// LocalStorage backup keys
const LOCAL_STORAGE_PRODUCTS_KEY = 'wolf_car_products_cache_v3';
const LOCAL_STORAGE_CATEGORIES_KEY = 'wolf_car_categories_cache_v3';

export const getLocalCachedProducts = (): Product[] | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getLocalCachedCategories = (): CarCategory[] | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const updateLocalCache = (products?: Product[], categories?: CarCategory[]) => {
  try {
    if (products !== undefined) {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    }
    if (categories !== undefined) {
      localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
    }
  } catch (err) {
    console.warn('LocalStorage cache update notice:', err);
  }
};

// Helper to check if error is quota exceeded
export const isQuotaOrNetworkError = (err: any): boolean => {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err.message || err.code || JSON.stringify(err));
  return (
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('client is offline') ||
    msg.includes('network')
  );
};

// Subscribe to categories in real-time
export const subscribeToCategories = (callback: (categories: CarCategory[]) => void) => {
  try {
    return onSnapshot(categoriesCol, (snapshot) => {
      const list: CarCategory[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CarCategory);
      });
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      updateLocalCache(undefined, list);
      callback(list);
    }, (error) => {
      console.warn('Firestore categories subscription error, using local/initial fallback:', error);
      const cached = getLocalCachedCategories();
      callback(cached && cached.length > 0 ? cached : INITIAL_CATEGORIES);
    });
  } catch (err) {
    console.warn('Could not initialize categories listener, using local/initial fallback:', err);
    const cached = getLocalCachedCategories();
    callback(cached && cached.length > 0 ? cached : INITIAL_CATEGORIES);
    return () => {};
  }
};

// Subscribe to products in real-time
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  try {
    return onSnapshot(productsCol, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Product);
      });
      updateLocalCache(list, undefined);
      callback(list);
    }, (error) => {
      console.warn('Firestore products subscription error, using local/initial fallback:', error);
      const cached = getLocalCachedProducts();
      callback(cached && cached.length > 0 ? cached : INITIAL_PRODUCTS);
    });
  } catch (err) {
    console.warn('Could not initialize products listener, using local/initial fallback:', err);
    const cached = getLocalCachedProducts();
    callback(cached && cached.length > 0 ? cached : INITIAL_PRODUCTS);
    return () => {};
  }
};

// Save single product to Firestore & Local Storage
export const saveProductToDb = async (product: Product): Promise<boolean> => {
  const cleanProduct = sanitizeForFirestore(product);
  
  // 1. Update local storage cache immediately
  const current = getLocalCachedProducts() || INITIAL_PRODUCTS;
  const index = current.findIndex(p => p.id === cleanProduct.id);
  if (index >= 0) {
    current[index] = cleanProduct;
  } else {
    current.unshift(cleanProduct);
  }
  updateLocalCache(current, undefined);

  // 2. Persist to Firestore with media optimization to reduce Quota
  try {
    const optimized = await optimizeProductMedia(cleanProduct);
    const docRef = doc(productsCol, optimized.id);
    await setDoc(docRef, optimized, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore write warning (saved to local cache):', error);
    return true;
  }
};

// Delete single product
export const deleteProductFromDb = async (productId: string): Promise<boolean> => {
  // 1. Update local storage cache immediately
  const current = getLocalCachedProducts() || INITIAL_PRODUCTS;
  const filtered = current.filter(p => p.id !== productId);
  updateLocalCache(filtered, undefined);

  // 2. Persist to Firestore
  try {
    const docRef = doc(productsCol, productId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Firestore delete warning (deleted from local cache):', err);
    return true;
  }
};

// Save single category
export const saveCategoryToDb = async (category: CarCategory): Promise<boolean> => {
  const cleanCategory = sanitizeForFirestore(category);
  
  // 1. Update local cache immediately
  const current = getLocalCachedCategories() || INITIAL_CATEGORIES;
  const index = current.findIndex(c => c.id === cleanCategory.id);
  if (index >= 0) {
    current[index] = cleanCategory;
  } else {
    current.push(cleanCategory);
  }
  updateLocalCache(undefined, current);

  // 2. Persist to Firestore
  try {
    const docRef = doc(categoriesCol, cleanCategory.id);
    await setDoc(docRef, cleanCategory, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore save category warning (saved to local cache):', err);
    return true;
  }
};

// Delete single category
export const deleteCategoryFromDb = async (categoryId: string): Promise<boolean> => {
  // 1. Update local cache immediately
  const current = getLocalCachedCategories() || INITIAL_CATEGORIES;
  const filtered = current.filter(c => c.id !== categoryId);
  updateLocalCache(undefined, filtered);

  // 2. Persist to Firestore
  try {
    const docRef = doc(categoriesCol, categoryId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Firestore delete category warning (deleted from local cache):', err);
    return true;
  }
};

// Delete multiple products at once (Bulk Delete)
export const deleteMultipleProductsFromDb = async (productIds: string[]): Promise<boolean> => {
  if (productIds.length === 0) return true;

  // 1. Update local storage cache immediately
  const current = getLocalCachedProducts() || INITIAL_PRODUCTS;
  const idsSet = new Set(productIds);
  const filtered = current.filter(p => !idsSet.has(p.id));
  updateLocalCache(filtered, undefined);

  // 2. Persist to Firestore in batches
  try {
    const chunkSize = 400;
    for (let i = 0; i < productIds.length; i += chunkSize) {
      const chunk = productIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((pId) => {
        const ref = doc(productsCol, pId);
        batch.delete(ref);
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.warn('Firestore bulk delete warning (applied to local cache):', err);
    return true;
  }
};

// Delete an entire category along with all its associated products
export const deleteCategoryAndItsProductsFromDb = async (categoryId: string): Promise<boolean> => {
  try {
    const catRef = doc(categoriesCol, categoryId);
    await deleteDoc(catRef);

    const q = query(productsCol, where('categoryId', '==', categoryId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

    const currentCats = getLocalCachedCategories() || [];
    const filteredCats = currentCats.filter(c => c.id !== categoryId);

    const currentProds = getLocalCachedProducts() || [];
    const filteredProds = currentProds.filter(p => p.categoryId !== categoryId);

    updateLocalCache(filteredProds, filteredCats);
    return true;
  } catch (err) {
    console.error('Failed to delete category and products from Firestore:', err);
    throw err;
  }
};

// Bulk import / seed initial items into Firestore
export const seedInitialDatabase = async () => {
  try {
    const statusDocRef = doc(settingsCol, 'init_status_v3');
    const statusDoc = await getDoc(statusDocRef);

    if (statusDoc.exists() && statusDoc.data()?.isInitialized) {
      return;
    }

    // Check if the collection already has existing user products
    const existingSnap = await getDocs(query(productsCol, limit(1)));
    if (!existingSnap.empty) {
      await setDoc(statusDocRef, { 
        isInitialized: true, 
        initializedAt: new Date().toISOString() 
      }, { merge: true });
      return;
    }

    console.log('Seeding LYK-900 Catalog into Firestore...');
    const chunkSize = 400;

    // Seed Categories
    const catBatch = writeBatch(db);
    INITIAL_CATEGORIES.forEach((cat) => {
      const ref = doc(categoriesCol, cat.id);
      catBatch.set(ref, sanitizeForFirestore(cat), { merge: true });
    });
    await catBatch.commit();

    // Seed Products
    for (let i = 0; i < INITIAL_PRODUCTS.length; i += chunkSize) {
      const chunk = INITIAL_PRODUCTS.slice(i, i + chunkSize);
      const prodBatch = writeBatch(db);
      chunk.forEach((prod) => {
        const ref = doc(productsCol, prod.id);
        prodBatch.set(ref, sanitizeForFirestore(prod), { merge: true });
      });
      await prodBatch.commit();
    }

    await setDoc(statusDocRef, { 
      isInitialized: true, 
      version: 'v3_lyk_900_complete',
      totalProducts: INITIAL_PRODUCTS.length,
      initializedAt: new Date().toISOString() 
    }, { merge: true });

  } catch (err) {
    console.warn('Firestore seeding notice (catalog loaded from local data):', err);
  }
};

// Bulk save multiple products (for CSV / Excel import)
export const bulkSaveProductsToDb = async (newProducts: Product[], newCategories?: CarCategory[]): Promise<boolean> => {
  // 1. Update Local Cache immediately
  const existingProducts = getLocalCachedProducts() || INITIAL_PRODUCTS;
  const updatedProductsMap = new Map<string, Product>();
  existingProducts.forEach(p => updatedProductsMap.set(p.id, p));
  newProducts.forEach(p => updatedProductsMap.set(p.id, p));
  const mergedProducts = Array.from(updatedProductsMap.values());

  let mergedCategories: CarCategory[] | undefined = undefined;
  if (newCategories && newCategories.length > 0) {
    const existingCats = getLocalCachedCategories() || INITIAL_CATEGORIES;
    const catMap = new Map<string, CarCategory>();
    existingCats.forEach(c => catMap.set(c.id, c));
    newCategories.forEach(c => catMap.set(c.id, c));
    mergedCategories = Array.from(catMap.values());
  }

  updateLocalCache(mergedProducts, mergedCategories);

  // 2. Persist to Firestore in Chunks
  try {
    const chunkSize = 400;
    
    // Process Categories
    if (newCategories && newCategories.length > 0) {
      const catBatch = writeBatch(db);
      newCategories.forEach((cat) => {
        const ref = doc(categoriesCol, cat.id);
        catBatch.set(ref, sanitizeForFirestore(cat), { merge: true });
      });
      await catBatch.commit();
    }

    // Process Products in Chunks
    for (let i = 0; i < newProducts.length; i += chunkSize) {
      const chunk = newProducts.slice(i, i + chunkSize);
      const prodBatch = writeBatch(db);
      chunk.forEach((prod) => {
        const ref = doc(productsCol, prod.id);
        prodBatch.set(ref, sanitizeForFirestore(prod), { merge: true });
      });
      await prodBatch.commit();
    }

    return true;
  } catch (err) {
    console.warn('Firestore bulk save warning (data saved to local cache):', err);
    return true;
  }
};

// Activity Logs Storage Key
const LOCAL_STORAGE_LOGS_KEY = 'wolf_car_activity_logs_cache_v3';

const INITIAL_DEMO_LOGS: ActivityLog[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    userName: 'قسم المحاسبة',
    userRole: 'accounting',
    actionType: 'price_change',
    productId: 'h6-prod-01',
    productName: 'حزام قفل غطاء المحرك هافال H6',
    categoryId: 'cat-haval-h6',
    categoryName: 'هافال H6',
    oldValue: 60,
    newValue: 70,
    details: 'تم تعديل سعر (حزام قفل غطاء المحرك هافال H6) من 60 إلى 70 QAR بواسطة قسم المحاسبة',
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userName: 'تقنية المعلومات IT',
    userRole: 'it',
    actionType: 'image_transform',
    productId: 'dargo-prod-01',
    productName: 'شبك أمامي رياضي هافال دارغو',
    categoryId: 'cat-haval-dargo',
    categoryName: 'هافال دارغو',
    details: 'تحديث ومحاذاة إطار صورة المنتج (شبك أمامي رياضي هافال دارغو) وضبط الإزاحة والزووم',
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    userName: 'قسم المعرض',
    userRole: 'showroom',
    actionType: 'product_add',
    productId: 'tank300-prod-01',
    productName: 'دعاسات جانبية كهربائية تانك 300',
    categoryId: 'cat-tank-300',
    categoryName: 'تانك 300',
    newValue: 3500,
    details: 'إضافة منتج جديد: (دعاسات جانبية كهربائية تانك 300) بسعر 3500 QAR بواسطة قسم المعرض',
  }
];

export const getLocalCachedLogs = (): ActivityLog[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return INITIAL_DEMO_LOGS;
  } catch (e) {
    return INITIAL_DEMO_LOGS;
  }
};

export const saveLocalCachedLogs = (logs: ActivityLog[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving local logs:', e);
  }
};

// Subscribe to real-time activity logs
export const subscribeToActivityLogs = (callback: (logs: ActivityLog[]) => void) => {
  try {
    const q = query(activityLogsCol, orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
        });
        saveLocalCachedLogs(logs);
        callback(logs);
      },
      (error) => {
        console.warn('Firestore Activity Logs listener error, fallback to local cache:', error);
        callback(getLocalCachedLogs());
      }
    );
  } catch (err) {
    console.warn('Could not initialize activity logs listener:', err);
    callback(getLocalCachedLogs());
    return () => {};
  }
};

// Record an activity log
export const logActivityToDb = async (logInput: Omit<ActivityLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<boolean> => {
  try {
    const log: ActivityLog = {
      id: logInput.id || 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: logInput.timestamp || new Date().toISOString(),
      ...logInput,
    };

    // 1. Update local cache immediately
    const existing = getLocalCachedLogs();
    const updated = [log, ...existing.filter(l => l.id !== log.id)].slice(0, 100);
    saveLocalCachedLogs(updated);

    // 2. Persist to Firestore
    const logRef = doc(activityLogsCol, log.id);
    await setDoc(logRef, sanitizeForFirestore(log));
    return true;
  } catch (err) {
    console.error('Error recording activity log in Firestore:', err);
    return false;
  }
};

// Clear all activity logs
export const clearActivityLogsInDb = async (): Promise<boolean> => {
  try {
    saveLocalCachedLogs([]);
    const snapshot = await getDocs(query(activityLogsCol, limit(100)));
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error clearing activity logs:', err);
    return false;
  }
};

// ==================== RECYCLE BIN (TRASH) 30-DAY RETENTION ====================

const LOCAL_STORAGE_TRASH_KEY = 'wolf_car_trash_cache_v3';

export const getLocalCachedTrash = (): DeletedProduct[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRASH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalCachedTrash = (items: DeletedProduct[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_TRASH_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local trash cache:', e);
  }
};

// Move single product to Trash
export const moveProductToTrashInDb = async (
  product: Product,
  user: { name: string; role: UserRole }
): Promise<boolean> => {
  try {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const deletedItem: DeletedProduct = {
      id: product.id,
      originalProduct: product,
      deletedAt: now.toISOString(),
      deletedBy: user.name,
      deletedRole: user.role,
      expiresAt: expires.toISOString(),
    };

    // 1. Delete from active products
    const prodRef = doc(productsCol, product.id);
    await deleteDoc(prodRef);

    // 2. Add to deleted_products collection
    const trashRef = doc(deletedProductsCol, product.id);
    await setDoc(trashRef, sanitizeForFirestore(deletedItem));

    // 3. Update local caches
    const cachedProducts = getLocalCachedProducts() || [];
    updateLocalCache(cachedProducts.filter(p => p.id !== product.id), undefined);

    const cachedTrash = getLocalCachedTrash();
    saveLocalCachedTrash([deletedItem, ...cachedTrash.filter(t => t.id !== product.id)]);

    return true;
  } catch (err) {
    console.error('Failed to move product to trash:', err);
    throw err;
  }
};

// Move multiple products to Trash
export const moveMultipleProductsToTrashInDb = async (
  productsToTrash: Product[],
  user: { name: string; role: UserRole }
): Promise<boolean> => {
  try {
    if (productsToTrash.length === 0) return true;

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const chunkSize = 400;
    for (let i = 0; i < productsToTrash.length; i += chunkSize) {
      const chunk = productsToTrash.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((prod) => {
        const prodRef = doc(productsCol, prod.id);
        batch.delete(prodRef);

        const deletedItem: DeletedProduct = {
          id: prod.id,
          originalProduct: prod,
          deletedAt: now.toISOString(),
          deletedBy: user.name,
          deletedRole: user.role,
          expiresAt: expires.toISOString(),
        };
        const trashRef = doc(deletedProductsCol, prod.id);
        batch.set(trashRef, sanitizeForFirestore(deletedItem));
      });
      await batch.commit();
    }

    const trashItems: DeletedProduct[] = productsToTrash.map(p => ({
      id: p.id,
      originalProduct: p,
      deletedAt: now.toISOString(),
      deletedBy: user.name,
      deletedRole: user.role,
      expiresAt: expires.toISOString(),
    }));

    const cachedProducts = getLocalCachedProducts() || [];
    const pIds = new Set(productsToTrash.map(p => p.id));
    updateLocalCache(cachedProducts.filter(p => !pIds.has(p.id)), undefined);

    const cachedTrash = getLocalCachedTrash();
    saveLocalCachedTrash([...trashItems, ...cachedTrash.filter(t => !pIds.has(t.id))]);

    return true;
  } catch (err) {
    console.error('Failed to move multiple products to trash:', err);
    throw err;
  }
};

// Subscribe to Deleted Products (Recycle Bin)
export const subscribeToDeletedProducts = (callback: (items: DeletedProduct[]) => void) => {
  try {
    const q = query(deletedProductsCol, orderBy('deletedAt', 'desc'), limit(500));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: DeletedProduct[] = [];
        const now = new Date().getTime();
        const expiredIds: string[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DeletedProduct;
          // Check 30-day expiration
          if (data.expiresAt && new Date(data.expiresAt).getTime() < now) {
            expiredIds.push(docSnap.id);
          } else {
            items.push({ id: docSnap.id, ...data });
          }
        });

        // Clean up expired items (>30 days) in background
        if (expiredIds.length > 0) {
          const batch = writeBatch(db);
          expiredIds.forEach(id => batch.delete(doc(deletedProductsCol, id)));
          batch.commit().catch(e => console.warn('Error clearing expired trash:', e));
        }

        saveLocalCachedTrash(items);
        callback(items);
      },
      (error) => {
        console.warn('Firestore Trash listener error, using local fallback:', error);
        callback(getLocalCachedTrash());
      }
    );
  } catch (err) {
    console.warn('Could not setup trash listener:', err);
    callback(getLocalCachedTrash());
    return () => {};
  }
};

// Restore a product from Trash back to active products and its original category
export const restoreProductFromTrashInDb = async (deletedItem: DeletedProduct): Promise<boolean> => {
  try {
    const prod = deletedItem.originalProduct;
    const batch = writeBatch(db);

    // 1. Remove from deleted_products
    const trashRef = doc(deletedProductsCol, deletedItem.id);
    batch.delete(trashRef);

    // 2. Re-insert to products collection
    const prodRef = doc(productsCol, prod.id);
    batch.set(prodRef, sanitizeForFirestore({ ...prod, updatedAt: new Date().toISOString() }));

    await batch.commit();

    // 3. Update local caches
    const cachedTrash = getLocalCachedTrash();
    saveLocalCachedTrash(cachedTrash.filter(t => t.id !== deletedItem.id));

    const cachedProducts = getLocalCachedProducts() || [];
    updateLocalCache([prod, ...cachedProducts.filter(p => p.id !== prod.id)], undefined);

    return true;
  } catch (err) {
    console.error('Failed to restore product from trash:', err);
    throw err;
  }
};

// Permanently delete a single item from Trash (Hard Delete)
export const hardDeleteFromTrashInDb = async (trashId: string): Promise<boolean> => {
  try {
    const trashRef = doc(deletedProductsCol, trashId);
    await deleteDoc(trashRef);

    const cachedTrash = getLocalCachedTrash();
    saveLocalCachedTrash(cachedTrash.filter(t => t.id !== trashId));
    return true;
  } catch (err) {
    console.error('Failed to hard delete item from trash:', err);
    throw err;
  }
};

// Permanently empty entire Trash
export const emptyTrashInDb = async (): Promise<boolean> => {
  try {
    const snapshot = await getDocs(query(deletedProductsCol, limit(500)));
    if (snapshot.empty) return true;

    const batch = writeBatch(db);
    snapshot.forEach(docSnap => batch.delete(docSnap.ref));
    await batch.commit();

    saveLocalCachedTrash([]);
    return true;
  } catch (err) {
    console.error('Failed to empty trash:', err);
    throw err;
  }
};

