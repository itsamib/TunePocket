import type * as Iid3 from 'music-metadata-browser';

// This interface is for the data being passed around in the client-side state (React state).
// It uses a Blob for easy creation of object URLs for the audio player.
export interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  category: string;
  subCategory: string;
  fileBlob: Blob; // Used for playback
  localURL: string;
  duration: number;
  artwork?: Iid3.IPicture; // This is a complex object, suitable for client-side only
}

// This interface represents the actual data structure stored in IndexedDB.
// It only contains serializable data types.
// This is also the shape of the data that is safe to pass from server to client.
export interface StoredSong {
  id: number;
  title: string;
  artist: string;
  genre: string;
  category: string;
  subCategory: string;
  fileBlob: ArrayBuffer; // Stored as ArrayBuffer
  duration: number;
  artwork?: { // Artwork is stored as a plain object
    data: ArrayBuffer;
    format: string;
  };
}

export type SongGroup = {
  [genre: string]: {
    [artist:string]: Song[];
  };
};
