import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  console.log('🚀 Starting Firebase -> Supabase migration...');
  
  const SUPABASE_URL = 'https://kavbbdjfoldqhbnzegvg.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_Hmi673rr_9U1LR-RnQMFSg_x33SfjrC';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let categories: any[] = [];
  let products: any[] = [];

  // 1. Try reading from local backup first if present
  const backupPath = path.resolve(process.cwd(), 'firebase-backup.json');
  if (fs.existsSync(backupPath)) {
    try {
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      if (backup.categories && backup.categories.length > 0) {
        categories = backup.categories;
        console.log(`📂 Loaded ${categories.length} categories from backup file.`);
      }
      if (backup.products && backup.products.length > 0) {
        products = backup.products;
        console.log(`📦 Loaded ${products.length} products from backup file.`);
      }
    } catch (e) {
      console.warn('Backup parse notice:', e);
    }
  }

  // 2. Fetch fresh from Firestore if needed
  if (categories.length === 0 || products.length === 0) {
    try {
      const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);

      console.log('Fetching from Firestore...');
      const catsSnap = await getDocs(collection(db, 'categories'));
      categories = [];
      catsSnap.forEach(d => categories.push(d.data()));

      const prodsSnap = await getDocs(collection(db, 'products'));
      products = [];
      prodsSnap.forEach(d => products.push(d.data()));

      const backup = { categories, products, timestamp: new Date().toISOString() };
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
      console.log('Saved backup to firebase-backup.json');
    } catch (err: any) {
      console.error('Firestore read note:', err.message || err);
    }
  }

  // 3. Upload Categories to Supabase
  if (categories.length > 0) {
    console.log(`Uploading ${categories.length} categories to Supabase...`);
    const catRows = categories.map((cat, idx) => ({
      id: cat.id,
      name: cat.name || '',
      car_model: cat.carModel || cat.name || '',
      header_title: cat.headerTitle || cat.name || '',
      main_car_image_url: cat.mainCarImageUrl || cat.imageUrl || '',
      description: cat.description || '',
      order: cat.order ?? idx,
      data: cat
    }));

    const { error: catErr } = await supabase.from('categories').upsert(catRows, { onConflict: 'id' });
    if (catErr) {
      console.error('❌ Categories upload message:', catErr.message);
    } else {
      console.log(`✅ Successfully uploaded ${catRows.length} categories to Supabase!`);
    }
  }

  // 4. Upload Products to Supabase
  if (products.length > 0) {
    console.log(`Uploading ${products.length} products to Supabase in batches...`);
    const prodRows = products.map(p => ({
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
      data: p
    }));

    let uploadedCount = 0;
    for (let i = 0; i < prodRows.length; i += 20) {
      const chunk = prodRows.slice(i, i + 20);
      const { error: prodErr } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
      if (prodErr) {
        console.error(`❌ Batch ${i}-${i + chunk.length} message:`, prodErr.message);
      } else {
        uploadedCount += chunk.length;
        console.log(`✅ Uploaded ${uploadedCount}/${prodRows.length} products to Supabase...`);
      }
    }
    console.log(`🎉 Finished uploading ${uploadedCount} products to Supabase!`);
  }

  // 5. Check Supabase counts
  const { count: finalCatCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: finalProdCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log(`\n========================================`);
  console.log(`🚀 STATUS IN SUPABASE:`);
  console.log(`📁 Categories: ${finalCatCount ?? 'Table not yet created in Supabase'}`);
  console.log(`📦 Products: ${finalProdCount ?? 'Table not yet created in Supabase'}`);
  console.log(`========================================\n`);
}

run();
