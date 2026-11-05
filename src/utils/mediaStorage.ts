/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistent Media Storage Utility (IndexedDB + Firebase Storage)
 * Enables real, reliable uploading of large videos and images:
 * 1. Stores original video & image Blobs in client IndexedDB (no 1MB document size limit).
 * 2. Concurrently uploads to Cloud Firebase Storage if available.
 * 3. Restores blob URLs on app load so uploaded media plays seamlessly across reloads.
 */

import { uploadFileToStorage } from '../lib/firebase';

const DB_NAME = 'boniphace_portfolio_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

// Open or initialize IndexedDB
function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a real video or image Blob to IndexedDB
 */
export async function saveMediaToIndexedDB(id: string, fileOrBlob: Blob | File): Promise<string> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        id,
        blob: fileOrBlob,
        name: fileOrBlob instanceof File ? fileOrBlob.name : 'media_file',
        type: fileOrBlob.type,
        size: fileOrBlob.size,
        updatedAt: Date.now()
      };
      const req = store.put(record);
      req.onsuccess = () => {
        const objectUrl = URL.createObjectURL(fileOrBlob);
        resolve(objectUrl);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save notice (using memory blob URL):', err);
    return URL.createObjectURL(fileOrBlob);
  }
}

/**
 * Get media blob URL from IndexedDB by id
 */
export async function getMediaBlobUrl(id: string): Promise<string | null> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(URL.createObjectURL(req.result.blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Upload real media with automatic cloud sync and local IndexedDB fallback
 */
export async function uploadMediaWithFallback(
  file: File,
  cloudPath: string,
  mediaId: string,
  onProgress?: (status: string) => void
): Promise<{ url: string; isCloud: boolean }> {
  // 1. Save to IndexedDB immediately for instant availability
  onProgress?.('Processing file locally...');
  const localBlobUrl = await saveMediaToIndexedDB(mediaId, file);

  // 2. Try uploading to Firebase Storage
  onProgress?.('Uploading to Cloud Storage...');
  try {
    const cloudUrl = await uploadFileToStorage(file, cloudPath, file.type);
    if (cloudUrl && cloudUrl.startsWith('http')) {
      onProgress?.('Cloud upload complete!');
      return { url: cloudUrl, isCloud: true };
    }
  } catch (cloudErr) {
    console.warn('Cloud storage fallback to local media store:', cloudErr);
  }

  // 3. Fallback to local persistent media URL
  onProgress?.('Saved locally to browser storage!');
  return { url: localBlobUrl, isCloud: false };
}
