'use client';
import type { Song, StoredSong, EditableSongData } from '@/types';

const DB_NAME = 'MusicDB';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let db: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

const initDBInternal = (): Promise<IDBDatabase> => {
  if (db) {
    return Promise.resolve(db);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    // IndexedDB is a browser-only API
    if (typeof window === 'undefined') {
        return reject(new Error("IndexedDB can only be used in a browser environment."));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening DB', request.error);
      dbPromise = null;
      reject(new Error('Error opening DB'));
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('Database opened successfully');
      dbPromise = null;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        tempDb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
  return dbPromise;
};

export const initDB = async (): Promise<boolean> => {
    try {
        await initDBInternal();
        return true;
    } catch {
        return false;
    }
}


export const addSong = (song: Omit<StoredSong, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
        const currentDb = await initDBInternal();
        const transaction = currentDb.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.add(song);

        request.onsuccess = () => {
            resolve(request.result as number);
        };

        request.onerror = () => {
            console.error('Error adding song', request.error);
            reject(request.error);
        };
    } catch(error) {
        reject(error);
    }
  });
};

export const getSongs = (): Promise<StoredSong[]> => {
  return new Promise(async (resolve, reject) => {
    try {
        const currentDb = await initDBInternal();
        const transaction = currentDb.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const songsFromDb = request.result as StoredSong[];
            resolve(songsFromDb);
        };

        request.onerror = () => {
            console.error('Error getting songs', request.error);
            reject(request.error);
        };
    } catch (error) {
        reject(error);
    }
  });
};

export const updateSong = (id: number, dataToUpdate: EditableSongData): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDb = await initDBInternal();
            const transaction = currentDb.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const getRequest = store.get(id);

            getRequest.onerror = () => {
                reject(getRequest.error);
            };

            getRequest.onsuccess = () => {
                const songData = getRequest.result as StoredSong;
                if (!songData) {
                    return reject(new Error(`Song with id ${id} not found.`));
                }

                // Update the fields
                songData.title = dataToUpdate.title;
                songData.artist = dataToUpdate.artist;
                songData.album = dataToUpdate.album;
                songData.genre = dataToUpdate.genre;
                
                const updateRequest = store.put(songData);

                updateRequest.onerror = () => {
                    reject(updateRequest.error);
                };
                
                updateRequest.onsuccess = () => {
                    resolve();
                };
            };

        } catch (error) {
            reject(error);
        }
    });
};
