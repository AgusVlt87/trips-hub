import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

// All config comes from Vite env vars (set in .env.local or Vercel dashboard)
const cfg = {
  apiKey:      import.meta.env.VITE_FB_API_KEY,
  authDomain:  import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
  projectId:   import.meta.env.VITE_FB_PROJECT_ID,
  appId:       import.meta.env.VITE_FB_APP_ID,
};

export const isFirebaseConfigured = !!(cfg.apiKey && cfg.databaseURL);

let app: FirebaseApp | null = null;
let db_: Database | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(cfg);
  db_ = getDatabase(app);
}

export const db = db_;
