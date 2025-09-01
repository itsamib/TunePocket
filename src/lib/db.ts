'use client';
import type { Song, StoredSong, EditableSongData, StoredPlaylist, Playlist } from '@/types';

const DB_NAME = 'MusicDB';
const DB_VERSION = 2; // Incremented version for schema change
const SONGS_STORE_NAME = 'songs';
const PLAYLISTS_STORE_NAME = 'playlists';

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
      if (!tempDb.objectStoreNames.contains(SONGS_STORE_NAME)) {
        tempDb.createObjectStore(SONGS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!tempDb.objectStoreNames.contains(PLAYLISTS_STORE_NAME)) {
        tempDb.createObjectStore(PLAYLISTS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
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

// --- Song Functions ---

export const addSong = (song: Omit<StoredSong, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
        const currentDb = await initDBInternal();
        const transaction = currentDb.transaction([SONGS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(SONGS_STORE_NAME);
        const request = store.add(song);

        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    } catch(error) {
        reject(error);
    }
  });
};

export const getSongs = (): Promise<StoredSong[]> => {
  return new Promise(async (resolve, reject) => {
    try {
        const currentDb = await initDBInternal();
        const transaction = currentDb.transaction([SONGS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(SONGS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as StoredSong[]);
        request.onerror = () => reject(request.error);
    } catch (error) {
        reject(error);
    }
  });
};

export const updateSong = (id: number, dataToUpdate: EditableSongData): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDb = await initDBInternal();
            const transaction = currentDb.transaction([SONGS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(SONGS_STORE_NAME);
            
            const getRequest = store.get(id);

            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => {
                const songData = getRequest.result as StoredSong;
                if (!songData) return reject(new Error(`Song with id ${id} not found.`));

                const updatedSong = { ...songData, ...dataToUpdate };
                const updateRequest = store.put(updatedSong);

                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};


// --- Playlist Functions ---

export const addPlaylist = (name: string): Promise<Playlist> => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDb = await initDBInternal();
            const transaction = currentDb.transaction([PLAYLISTS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PLAYLISTS_STORE_NAME);
            const newPlaylist: Omit<StoredPlaylist, 'id'> = { name, songIds: [] };
            const request = store.add(newPlaylist);

            request.onsuccess = () => {
                const newId = request.result as number;
                resolve({ id: newId, name, songIds: [] });
            };
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
};

export const getPlaylists = (): Promise<Playlist[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDb = await initDBInternal();
            const transaction = currentDb.transaction([PLAYLISTS_STORE_NAME], 'readonly');
            const store = transaction.objectStore(PLAYLISTS_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as Playlist[]);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
};

export const updatePlaylistSongs = (playlistId: number, songId: number): Promise<Playlist | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDb = await initDBInternal();
            const transaction = currentDb.transaction([PLAYLISTS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PLAYLISTS_STORE_NAME);
            const getRequest = store.get(playlistId);

            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => {
                const playlist = getRequest.result as StoredPlaylist;
                if (!playlist) return reject(new Error('Playlist not found'));

                if (playlist.songIds.includes(songId)) {
                    return resolve(null); // Indicate song already exists
                }

                playlist.songIds.push(songId);
                const updateRequest = store.put(playlist);

                updateRequest.onsuccess = () => resolve(playlist);
                updateRequest.onerror = () => reject(updateRequest.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};


export const deletePlaylist = (playlistId: number): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDb = await initDBInternal();
            const transaction = currentDb.transaction([PLAYLISTS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PLAYLISTS_STORE_NAME);
            const request = store.delete(playlistId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
};
