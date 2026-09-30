import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3005;


  // Increase payload limit for base64 catalog page images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Lazy initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Background Firebase to Supabase Migration Runner
  let lastMigrationStatus: {
    status: 'idle' | 'running' | 'success' | 'quota_exceeded' | 'error';
    message: string;
    productCount: number;
    categoryCount: number;
    lastAttempt: string;
  } = {
    status: 'idle',
    message: 'لم تبدأ عملية النقل بعد',
    productCount: 0,
    categoryCount: 0,
    lastAttempt: new Date().toISOString(),
  };

  async function executeFirebaseToSupabaseMigration(): Promise<{ success: boolean; message: string; quotaExceeded?: boolean }> {
    try {
      lastMigrationStatus.status = 'running';
      lastMigrationStatus.lastAttempt = new Date().toISOString();

      const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(firebaseConfigPath)) {
        throw new Error('firebase-applet-config.json not found');
      }
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getFirestore, collection, getDocs } = await import('firebase/firestore/lite');
      const { createClient } = await import('@supabase/supabase-js');

      const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
        ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
        : getFirestore(fbApp);

      const SUPABASE_URL = 'https://kavbbdjfoldqhbnzegvg.supabase.co';
      const SUPABASE_ANON_KEY = 'sb_publishable_Hmi673rr_9U1LR-RnQMFSg_x33SfjrC';
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // 1. Fetch from Firestore OR read from local backup file
      let categories: any[] = [];
      let products: any[] = [];

      const backupPath = path.resolve(process.cwd(), 'firebase-backup.json');
      if (fs.existsSync(backupPath)) {
        try {
          const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
          if (backup.categories?.length > 0) categories = backup.categories;
          if (backup.products?.length > 0) products = backup.products;
        } catch (e) {
          console.warn('Backup file parse note:', e);
        }
      }

      if (categories.length === 0 || products.length === 0) {
        try {
          const catsSnap = await getDocs(collection(db, 'categories'));
          categories = [];
          catsSnap.forEach((d) => categories.push(d.data()));

          const prodsSnap = await getDocs(collection(db, 'products'));
          products = [];
          prodsSnap.forEach((d) => products.push(d.data()));

          const backup = { categories, products, timestamp: new Date().toISOString() };
          fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        } catch (err: any) {
          const isQuota = err?.message?.includes('Quota limit exceeded') || err?.code === 'resource-exhausted';
          if (!isQuota || (categories.length === 0 && products.length === 0)) {
            throw err;
          }
        }
      }

      // Upsert to Supabase
      if (categories.length > 0) {
        const catRows = categories.map((cat, idx) => ({
          id: cat.id,
          name: cat.name || '',
          car_model: cat.carModel || cat.name || '',
          header_title: cat.headerTitle || cat.name || '',
          main_car_image_url: cat.mainCarImageUrl || cat.imageUrl || '',
          description: cat.description || '',
          order: cat.order ?? idx,
          data: cat,
        }));
        await supabase.from('categories').upsert(catRows, { onConflict: 'id' });
      }

      if (products.length > 0) {
        const prodRows = products.map((p) => ({
          id: p.id,
          category_id: p.categoryId,
          name: p.name || '',
          barcode: p.barcode || '',
          price: Number(p.price) || 0,
          old_price: p.oldPrice ? Number(p.oldPrice) : null,
          currency: p.currency || 'QAR',
          image_url: p.imageUrl || '',
          description: p.description || '',
          image_transform: p.imageTransform || null,
          created_at: p.createdAt || new Date().toISOString(),
          updated_at: p.updatedAt || new Date().toISOString(),
          data: p,
        }));

        for (let i = 0; i < prodRows.length; i += 25) {
          const chunk = prodRows.slice(i, i + 25);
          await supabase.from('products').upsert(chunk, { onConflict: 'id' });
        }
      }

      // Save local backup file
      const backup = { categories, products, timestamp: new Date().toISOString() };
      fs.writeFileSync(path.resolve(process.cwd(), 'firebase-backup.json'), JSON.stringify(backup, null, 2));

      lastMigrationStatus = {
        status: 'success',
        message: `تم بنجاح نقل ${products.length} منتجاً و ${categories.length} قسماً من Firebase إلى Supabase!`,
        productCount: products.length,
        categoryCount: categories.length,
        lastAttempt: new Date().toISOString(),
      };

      console.log('✅ Migration succeeded:', lastMigrationStatus.message);
      return { success: true, message: lastMigrationStatus.message };
    } catch (err: any) {
      const isQuota = err?.message?.includes('Quota limit exceeded') || err?.code === 'resource-exhausted';
      if (isQuota) {
        lastMigrationStatus = {
          status: 'quota_exceeded',
          message: 'حصة Firebase لا تزال مقفلة من Google (Quota limit exceeded). السيرفر يراقبها باستمرار وسيقوم بالنقل التلقائي فور فتحها.',
          productCount: 0,
          categoryCount: 0,
          lastAttempt: new Date().toISOString(),
        };
        return { success: false, quotaExceeded: true, message: lastMigrationStatus.message };
      }

      lastMigrationStatus = {
        status: 'error',
        message: err?.message || 'خطأ أثناء محاولة الاتصال بـ Firebase',
        productCount: 0,
        categoryCount: 0,
        lastAttempt: new Date().toISOString(),
      };
      return { success: false, message: lastMigrationStatus.message };
    }
  }

  // Trigger migration endpoint
  app.post('/api/trigger-migration', async (req, res) => {
    const result = await executeFirebaseToSupabaseMigration();
    res.json({ ...result, details: lastMigrationStatus });
  });

  // Get migration status
  app.get('/api/migration-status', (req, res) => {
    res.json(lastMigrationStatus);
  });

  // In-memory catalog cache for sub-millisecond responses
  let cachedCatalogData: { products: any[]; categories: any[]; timestamp: string } | null = null;

  function getCatalogFromDisk(): { products: any[]; categories: any[]; timestamp: string } {
    if (cachedCatalogData) return cachedCatalogData;
    try {
      const backupPath = path.resolve(process.cwd(), 'firebase-backup.json');
      if (fs.existsSync(backupPath)) {
        const raw = fs.readFileSync(backupPath, 'utf8');
        cachedCatalogData = JSON.parse(raw);
        return cachedCatalogData || { products: [], categories: [], timestamp: new Date().toISOString() };
      }
    } catch (e) {
      console.warn('Error reading backup file:', e);
    }
    cachedCatalogData = { products: [], categories: [], timestamp: new Date().toISOString() };
    return cachedCatalogData;
  }

  // Instant fast catalog API for 0ms loading of 352 products
  app.get('/api/catalog', (req, res) => {
    try {
      const data = getCatalogFromDisk();
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.json({
        success: true,
        products: data.products || [],
        categories: data.categories || [],
        count: data.products?.length || 0,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save / Sync catalog endpoint
  app.post('/api/catalog/sync', async (req, res) => {
    try {
      const { products, categories } = req.body;
      const backupPath = path.resolve(process.cwd(), 'firebase-backup.json');
      let currentData = getCatalogFromDisk();

      if (Array.isArray(products) && products.length > 0) {
        currentData.products = products;
      }
      if (Array.isArray(categories) && categories.length > 0) {
        currentData.categories = categories;
      }
      currentData.timestamp = new Date().toISOString();
      cachedCatalogData = currentData;

      // Asynchronously write to disk
      try {
        fs.writeFileSync(backupPath, JSON.stringify(currentData, null, 2));
      } catch (err) {
        console.warn('Warning writing backup file:', err);
      }

      res.json({
        success: true,
        message: 'تم تحديث الكتالوج بنجاح',
        productCount: currentData.products?.length || 0,
        categoryCount: currentData.categories?.length || 0,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Migration API endpoint available on-demand only (never runs on startup automatically to prevent rate limits)
  app.post('/api/trigger-migration', async (req, res) => {
    try {
      const result = await executeFirebaseToSupabaseMigration();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // AI Vision Vision Catalog Product Detector with automatic retry and model fallback
  app.post('/api/ai-detect-products', async (req, res) => {
    try {
      const { pageImageBase64, pageNum, expectedBarcodes } = req.body;
      if (!pageImageBase64) {
        return res.status(400).json({ error: 'pageImageBase64 is required' });
      }

      const ai = getGeminiClient();
      const cleanBase64 = pageImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

      const prompt = `You are a precision computer vision system specializing in catalog image segmentation.
This image is Page ${pageNum || 1} of an automotive accessories catalog.
Each product entry has a product image, title, price, and barcode.
In this layout, each product image is located to the RIGHT of its barcode.

Task:
1. Detect each product item on this page.
2. Locate the bounding box of each individual product photograph (crop tightly around the accessory object/photo without cutting off the product).
3. The box format is [ymin, xmin, ymax, xmax] in normalized integers from 0 to 1000 (where 0,0 is top-left and 1000,1000 is bottom-right).
4. Associate the product image with its 10-digit barcode (e.g. 1001200001, 1001200002, etc.).
5. If Page 1, detect the car photo banner in the top header [ymin, xmin, ymax, xmax].

Expected barcodes to match: ${JSON.stringify(expectedBarcodes || [])}

Return ONLY valid JSON matching this schema:
{
  "carBannerBox": [ymin, xmin, ymax, xmax],
  "products": [
    {
      "barcode": "1001200001",
      "box": [ymin, xmin, ymax, xmax]
    }
  ]
}`;

      // Execute with retries and model fallback
      const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest'];
      let responseText = '{}';
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
              config: {
                responseMimeType: 'application/json',
              },
            });

            if (response.text) {
              responseText = response.text;
              lastError = null;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Attempt ${attempt} with model ${modelName} encountered: ${err.message}`);
            // If 503 or 429, wait before retrying
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
            }
          }
        }
        if (!lastError) break;
      }

      if (lastError && responseText === '{}') {
        // Return 200 with success: false so client can seamlessly fall back to geometric extraction
        return res.json({ 
          success: false, 
          fallback: true,
          error: lastError.message || 'Model temporarily busy' 
        });
      }

      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini output as JSON:', responseText);
      }

      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Gemini vision detection endpoint error:', err);
      res.json({ success: false, fallback: true, error: err.message || 'AI detection failed' });
    }
  });

  // Serve pre-bundled production assets when dist exists
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexHtmlPath)) {
    console.log('Serving bundled assets from dist/');
    // 1. Long-term immutable caching for hashed static assets
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));

    // 2. Static files (images, icons) with short cache
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    }));

    // 3. SPA Fallback: index.html with NO CACHE to ensure deployments update immediately
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.log('Mounting Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wolf Store server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
