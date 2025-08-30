import type * as MMB from 'music-metadata-browser';

declare global {
  interface Window {
    musicMetadataBrowser: typeof MMB;
    Telegram: {
      WebApp: any;
    };
  }
}

export {};
