import type * as Iid3 from 'music-metadata-browser';

export interface EditableSongData {
  title: string;
  artist: string;
  album: string;
  genre: string;
}

export interface Song extends EditableSongData {
  id: number;
  fileBlob: Blob; // Used for playback
  localURL: string;
  duration: number;
  artwork?: Iid3.IPicture; 
  contentType: string;
}

export interface StoredSong extends EditableSongData {
  id: number;
  fileBlob: ArrayBuffer; 
  duration: number;
  artwork?: {
    data: ArrayBuffer;
    format: string;
  };
  contentType: string;
}

export type SongGroup = {
  [genre: string]: {
    [artist: string]: {
      [album: string]: Song[];
    }
  };
};


// Playlist Types
export interface Playlist {
    id: number;
    name: string;
    songIds: number[];
}

export interface StoredPlaylist {
    id: number;
    name: string;
    songIds: number[];
}
