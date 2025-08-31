import type * as Iid3 from 'music-metadata-browser';

export interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  category: string;
  subCategory: string;
  fileBlob: Blob | ArrayBuffer; // Allow both for easier handling
  localURL: string;
  duration: number;
  artwork?: Iid3.IPicture;
}

export type SongGroup = {
  [genre: string]: {
    [artist: string]: Song[];
  };
};
