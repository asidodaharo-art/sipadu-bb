import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDocFromServer
} from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export let isFirestoreAvailable = false;
export let authErrorMsg: string | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Low-level helper to write a document securely
export async function dbSaveDoc(collectionName: string, id: string, data: any) {
  if (!isFirestoreAvailable) return;
  try {
    const cleanData = JSON.parse(JSON.stringify(data)); // Clean any potential undefined values for Firestore
    await setDoc(doc(db, collectionName, id), cleanData);
  } catch (err: any) {
    const errorStr = String(err?.message || err).toLowerCase();
    if (errorStr.includes('permission-denied') || errorStr.includes('permission') || errorStr.includes('insufficient')) {
      console.warn(`Firestore permission denied on save. Gracefully disabling cloud sync to safeguard runtime behavior.`);
      isFirestoreAvailable = false;
    }
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${id}`);
  }
}

// Low-level helper to delete a document securely
export async function dbDeleteDoc(collectionName: string, id: string) {
  if (!isFirestoreAvailable) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err: any) {
    const errorStr = String(err?.message || err).toLowerCase();
    if (errorStr.includes('permission-denied') || errorStr.includes('permission') || errorStr.includes('insufficient')) {
      console.warn(`Firestore permission denied on delete. Gracefully disabling cloud sync to safeguard runtime behavior.`);
      isFirestoreAvailable = false;
    }
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// Low-level helper to retrieve all documents of a collection securely
export async function dbGetCollection(collectionName: string): Promise<any[]> {
  if (!isFirestoreAvailable) return [];
  try {
    const qSnapshot = await getDocs(collection(db, collectionName));
    const list: any[] = [];
    qSnapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    return list;
  } catch (err: any) {
    const errorStr = String(err?.message || err).toLowerCase();
    if (errorStr.includes('permission-denied') || errorStr.includes('permission') || errorStr.includes('insufficient')) {
      console.warn(`Firestore permission denied on retrieve for collection "${collectionName}". Gracefully disabling cloud sync to safeguard runtime behavior.`);
      isFirestoreAvailable = false;
    }
    handleFirestoreError(err, OperationType.LIST, collectionName);
    return [];
  }
}

// Mapping from localStorage keys to Firestore collections
export const STORAGE_SYNC_MAP: { [key: string]: { type: 'array' | 'object', collection: string } } = {
  'uptd_users': { type: 'array', collection: 'users' },
  'uptd_v3_mails': { type: 'array', collection: 'mails' },
  'uptd_v3_staff': { type: 'array', collection: 'staff' },
  'uptd_v3_projects': { type: 'array', collection: 'projects' },
  'uptd_v3_projects_operasional': { type: 'array', collection: 'projects_operasional' },
  'uptd_v3_water_logs': { type: 'array', collection: 'water_logs' },
  'uptd_v3_damage_reports': { type: 'array', collection: 'damage_reports' },
  'uptd_v3_assets': { type: 'array', collection: 'assets' },
  'uptd_v3_finances': { type: 'array', collection: 'finances' },
  'uptd_v3_daerah_irigasi': { type: 'array', collection: 'daerah_irigasi' },
  'uptd_v3_river_stations': { type: 'array', collection: 'river_stations' },
  'uptd_v3_asset_distributions': { type: 'array', collection: 'asset_distributions' },
  'uptd_v3_consumables': { type: 'array', collection: 'consumables' },
  'uptd_v3_activity_accounts': { type: 'array', collection: 'activity_accounts' },
  'uptd_v3_spj': { type: 'array', collection: 'spj' },
  'uptd_v3_bapp': { type: 'array', collection: 'bapp' },
  'uptd_v3_contracts': { type: 'array', collection: 'contracts' },
  'uptd_v3_bank_accounts': { type: 'array', collection: 'bank_accounts' },
  'uptd_v3_job_proposals_operasional': { type: 'array', collection: 'job_proposals_operasional' },
  'uptd_v3_job_proposals_pembangunan': { type: 'array', collection: 'job_proposals_pembangunan' },
  'uptd_v3_inspection_logs': { type: 'array', collection: 'inspection_logs' },
  'uptd_profile': { type: 'object', collection: 'profile_metadata' },
  'uptd_footer': { type: 'object', collection: 'footer_metadata' },
};

// Test if the app runs in background to prevent multiple sync loops
let isSyncingActive = false;

// Trigger Firestore update for a specific localStorage key changes
export async function syncLocalStorageToCloud(key: string, rawVal: string | null) {
  if (!isFirestoreAvailable) return;
  if (isSyncingActive) return; // Prevent loop cycle
  const mapping = STORAGE_SYNC_MAP[key];
  if (!mapping) return;

  try {
    if (!rawVal) {
      // Clear all items on Firestore for this mapped collection
      const existingItems = await dbGetCollection(mapping.collection);
      for (const item of existingItems) {
        const id = item.id || 'default';
        await dbDeleteDoc(mapping.collection, id);
      }
      return;
    }

    const data = JSON.parse(rawVal);
    if (mapping.type === 'array' && Array.isArray(data)) {
      const existingServerDocs = await dbGetCollection(mapping.collection);
      const serverIds = existingServerDocs.map(srv => srv.id).filter(Boolean);
      const targetIds = data.map(item => item.id).filter(Boolean);

      // 1. Delete orphaned keys
      for (const srvId of serverIds) {
        if (!targetIds.includes(srvId)) {
          await dbDeleteDoc(mapping.collection, srvId);
        }
      }

      // 2. Set active keys
      for (const item of data) {
        const docId = item.id || 'doc_' + Math.random().toString(36).substr(2, 9);
        if (!item.id) item.id = docId;
        await dbSaveDoc(mapping.collection, docId, item);
      }
    } else if (mapping.type === 'object' && data) {
      // Write object single document
      await dbSaveDoc(mapping.collection, 'default', data);
    }
  } catch (err) {
    console.error(`Error syncing key "${key}" to Firestore:`, err);
  }
}

// Setup a hook to automatically capture all subsequent localStorage changes
export function setupLocalStorageInterceptor() {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key: string, value: string) {
    originalSetItem.call(localStorage, key, value);
    if (STORAGE_SYNC_MAP[key]) {
      // Dispatch background save to Firestore
      syncLocalStorageToCloud(key, value).catch(console.error);
    }
  };
}

// Extract bidirectional sync layer so it can be re-run at any time (e.g. after Google sign-in)
export async function performBidirectionalSync(): Promise<void> {
  if (!isFirestoreAvailable) return;
  if (isSyncingActive) return;
  
  isSyncingActive = true;
  try {
    const entries = Object.entries(STORAGE_SYNC_MAP);
    await Promise.all(
      entries.map(async ([localStorageKey, mapping]) => {
        try {
          const serverDocs = await dbGetCollection(mapping.collection);
          const localRaw = localStorage.getItem(localStorageKey);

          if (serverDocs.length === 0) {
            // No remote data -> Seed from local storage if local data exists
            if (localRaw) {
              const localData = JSON.parse(localRaw);
              if (mapping.type === 'array' && Array.isArray(localData) && localData.length > 0) {
                console.log(`Seeding Firestore collection "${mapping.collection}" with ${localData.length} records...`);
                // Parallelize seeding individual documents for optimal performance
                await Promise.all(
                  localData.map(async (item) => {
                    const docId = item.id || 'doc_' + Math.random().toString(36).substr(2, 9);
                    if (!item.id) item.id = docId;
                    await dbSaveDoc(mapping.collection, docId, item);
                  })
                );
              } else if (mapping.type === 'object' && localData && Object.keys(localData).length > 0) {
                console.log(`Seeding Firestore metadata "${mapping.collection}"...`);
                await dbSaveDoc(mapping.collection, 'default', localData);
              }
            }
          } else {
            // Remote data exists -> Load to local storage & overwrite
            if (mapping.type === 'array') {
              localStorage.setItem(localStorageKey, JSON.stringify(serverDocs));
            } else if (mapping.type === 'object') {
              // Find 'default' doc
              const defaultDoc = serverDocs.find(() => true) || serverDocs[0] || {};
              localStorage.setItem(localStorageKey, JSON.stringify(defaultDoc));
            }
          }
        } catch (syncErr) {
          console.warn(`Sync error on key "${localStorageKey}":`, syncErr);
        }
      })
    );
  } finally {
    isSyncingActive = false;
  }
}

// Sign-in tool with Google
export async function signInWithGoogle(): Promise<any> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    authErrorMsg = null;
    isFirestoreAvailable = true;
    console.log("Firebase Auth signed in with Google successfully.");
    
    // Attempt triggering sync immediately
    await performBidirectionalSync();
    return result.user;
  } catch (error: any) {
    console.error("Firebase Google Auth Sign-in failed:", error);
    authErrorMsg = error?.message || String(error);
    throw error;
  }
}

// Sign-out tool
export async function signOutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
    isFirestoreAvailable = false;
    authErrorMsg = null;
    console.log("Firebase Auth logged out successfully.");
  } catch (err) {
    console.error("Firebase logout error:", err);
  }
}

// Main initializer & full Bidirectional Synchronizer
export async function initAndSyncData(): Promise<void> {
  authErrorMsg = null;
  
  // 1. Wait for Firebase Auth to restore the active user session (resolves async IDB session)
  const restoredUser = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  // 1b. If no user is authenticated, attempt anonymous login in background
  if (!restoredUser) {
    try {
      await signInAnonymously(auth);
      console.log("Firebase Auth signed in anonymously successfully.");
      authErrorMsg = null;
    } catch (error: any) {
      console.warn("Firebase Auth signin failed (operating in sandbox mode):", error);
      authErrorMsg = error?.message || String(error);
    }
  } else {
    console.log("Firebase Auth active session restored.");
    authErrorMsg = null;
  }

  // 2. Test Firestore connection first using getDocFromServer
  try {
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
    console.log("Passed Firestore database server connection check. Cloud database sync is active.");
    isFirestoreAvailable = true;
  } catch (error: any) {
    const errorStr = String(error?.message || error).toLowerCase();
    if (errorStr.includes('permission-denied') || errorStr.includes('permission') || errorStr.includes('insufficient')) {
      console.warn("Firestore database sync is inactive (restricted permissions or rules not deployed). Operating in local sandbox fallback mode.");
      isFirestoreAvailable = false;
    } else if (errorStr.includes('offline') || errorStr.includes('network') || errorStr.includes('the client is offline')) {
      console.warn("Firestore client is offline. Operating in local sandbox fallback mode.");
      isFirestoreAvailable = false;
    } else {
      console.log("Firestore database connection query returned unexpected result, operating in local sandbox fallback mode:", error?.message || error);
      isFirestoreAvailable = false;
    }
  }

  // 3. Bidirectional Sync Layer (Only if cloud database is online and accessible)
  if (isFirestoreAvailable) {
    // Run bidirectional sync in the background asynchronously so the startup remains instant
    performBidirectionalSync().catch((err) => {
      console.warn("Background bidirectional sync error:", err);
    });
  }

  // 4. Overwrite setItem for future writes synchronization
  setupLocalStorageInterceptor();
}
