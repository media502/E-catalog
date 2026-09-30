import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const dbDefault = getFirestore(app);

  try {
    console.log('Testing (default) database...');
    const snap = await getDocs(collection(dbDefault, 'products'));
    console.log(`(default) database products size: ${snap.size}`);
  } catch (e: any) {
    console.log('(default) error:', e.message);
  }
}
run();
