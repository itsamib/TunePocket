'use client';
import type { Song } from '@/types';

const DB_NAME = 'MusicDB';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening DB', request.error);
      reject(false);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('Database opened successfully');
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const addSong = (song: Omit<Song, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!db) {
        reject('DB not initialized');
        return;
    }
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(song);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      console.error('Error adding song', request.error);
      reject(request.error);
    };
  });
};

export const getSongs = (): Promise<Song[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
        reject('DB not initialized');
        return;
    }
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as Song[]);
    };

    request.onerror = () => {
      console.error('Error getting songs', request.error);
      reject(request.error);
    };
  });
};
