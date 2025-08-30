'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { addSong, getSongs, initDB } from '@/lib/db';
import { categorizeSongsByGenre } from '@/ai/flows/categorize-songs-by-genre';
import { getTelegramFile } from '@/ai/flows/get-telegram-file';
import { sendTelegramMessage } from '@/ai/flows/send-telegram-message';
import type { Song, SongGroup } from '@/types';
import Player from './Player';
import { SongList } from './SongList';
import { FileUpload } from './FileUpload';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const getMmb = (): Promise<typeof window.musicMetadataBrowser> => {
  return new Promise((resolve, reject) => {
    if (typeof window.musicMetadataBrowser !== 'undefined') {
      return resolve(window.musicMetadataBrowser);
    }
    const script = document.querySelector('script[src*="music-metadata-browser"]');
    if (script) {
        script.addEventListener('load', () => resolve(window.musicMetadataBrowser));
        script.addEventListener('error', () => reject(new Error("Metadata library failed to load.")));
    } else {
        reject(new Error("Metadata script not found."));
    }
  });
};


export default function TunePocketApp() {
  const { tg, user } = useTelegram();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingMessage, setProcessingMessage] = useState('Initializing...');
  const { toast } = useToast();

  const loadSongsFromDB = useCallback(async () => {
    try {
      await initDB();
      const storedSongs = await getSongs();
      setSongs(storedSongs);
    } catch (error) {
      console.error('Failed to load songs from DB', error);
      toast({ title: "Error", description: "Could not load song library.", variant: "destructive" });
    }
  }, [toast]);
  
  const processAndSaveSong = useCallback(async (file: File | Blob, defaultTitle: string): Promise<Song> => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
          throw new Error("File is larger than 50MB limit.");
      }
      
      setProcessingMessage('Reading metadata...');
      const mmb = await getMmb();
      const metadata = await mmb.parseBlob(file);
      
      const title = metadata.common.title || defaultTitle;
      const artist = metadata.common.artist || 'Unknown Artist';
      const genre = metadata.common.genre?.[0] || 'Unknown';
      
      setProcessingMessage('Categorizing song...');
      const { category, subCategory } = await categorizeSongsByGenre({ title, artist, genre });
      
      const newSongData: Omit<Song, 'id'> = {
        title,
        artist,
        genre,
        category,
        subCategory,
        fileBlob: file,
        localURL: URL.createObjectURL(file),
        duration: metadata.format.duration || 0,
        artwork: metadata.common.picture?.[0],
      };
      
      setProcessingMessage('Saving to library...');
      const newId = await addSong(newSongData);
      
      const finalSong = { ...newSongData, id: newId };
      setSongs(prevSongs => [...prevSongs, finalSong]);

      return finalSong;

  }, []);

  const handleManualUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
        const savedSong = await processAndSaveSong(file, file.name);
        toast({ title: "Song Added!", description: `\'\'\'${savedSong.title}\'\'\' has been added.` });
    } catch (error: any) {
        console.error('Failed to process file', error);
        toast({ title: "Processing Failed", description: error.message || "Could not process the audio file.", variant: "destructive" });
    } finally {
        setIsLoading(false);
        setProcessingMessage('');
    }
  }, [processAndSaveSong, toast]);


  const handleTelegramFile = useCallback(async (param: string) => {
    setIsLoading(true);
    let chatId: string | undefined;

    try {
        const parts = param.split('_');
        const fileId = parts[0];
        chatId = parts[1];

        if (!fileId || !chatId) {
            throw new Error('Invalid start parameter from Telegram.');
        }

        setProcessingMessage('Downloading from Telegram...');
        const response = await getTelegramFile({ fileId });

        if (!response.ok) {
            throw new Error(`Failed to download file from Telegram. Status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        let fileName = 'telegram-song.mp3';
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch?.[1]) {
                fileName = filenameMatch[1];
            }
        }
      
        const savedSong = await processAndSaveSong(blob, fileName);
      
        toast({ title: "Song Added!", description: `\'\'\'${savedSong.title}\'\'\' by ${savedSong.artist} has been added.` });
        
        setProcessingMessage('Sending confirmation...');
        await sendTelegramMessage({
          chatId: chatId,
          text: `✅ Song "\'\'\'${savedSong.title}\'\'\'" was successfully added to your TunePocket library!`,
        });

    } catch (error: any) {
        console.error("Error handling Telegram file:", error);
        toast({ title: "Processing Failed", description: error.message || "Could not process the song from Telegram.", variant: "destructive" });
        if (chatId) {
            await sendTelegramMessage({
                chatId: chatId,
                text: `❌ Failed to add song to your library. Error: ${error.message}`,
            });
        }
    } finally {
        setIsLoading(false);
        setProcessingMessage('');
        // Clean the hash to prevent re-processing on refresh
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.hash = '';
            window.history.replaceState({}, document.title, url.toString());
        }
    }
  }, [processAndSaveSong, toast]);
  
  useEffect(() => {
    const initializeApp = async () => {
      setProcessingMessage('Loading library...');
      await loadSongsFromDB();
      
      const urlParams = new URLSearchParams(window.location.hash.slice(1));
      const startParam = urlParams.get('tgWebAppStartParam') || tg?.initDataUnsafe?.start_param;

      if (startParam) {
        await handleTelegramFile(startParam);
      }
      setIsLoading(false);
      setProcessingMessage('');
    };
    initializeApp();
  }, [loadSongsFromDB, handleTelegramFile, tg]);


  useEffect(() => {
      const handleHashChange = () => {
        const urlParams = new URLSearchParams(window.location.hash.slice(1));
        const newParam = urlParams.get('tgWebAppStartParam');
        if (newParam) {
            handleTelegramFile(newParam);
        }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleTelegramFile]);


  const handlePlayPause = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSelectSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };
  
  const playNext = useCallback(() => {
    if (!currentSong) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  }, [currentSong, songs]);

  const playPrev = useCallback(() => {
    if (!currentSong) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  }, [currentSong, songs]);

  const groupedSongs = useMemo(() => {
    return songs.reduce<SongGroup>((acc, song) => {
      const { category, artist } = song;
      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][artist]) {
        acc[category][artist] = [];
      }
      acc[category][artist].push(song);
      return acc;
    }, {});
  }, [songs]);
  
  useEffect(() => {
    const applyTheme = (theme: 'dark' | 'light') => {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
    if (tg?.colorScheme) {
      applyTheme(tg.colorScheme);
    }
    const themeChangedHandler = () => {
      if (tg.colorScheme) {
        applyTheme(tg.colorScheme);
      }
    };
    tg?.onEvent('themeChanged', themeChangedHandler);
    
    return () => {
        tg?.offEvent('themeChanged', themeChangedHandler);
    }
  }, [tg]);

  if (isLoading && !songs.length) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
            <h1 className="text-5xl font-headline text-primary mb-4">TunePocket</h1>
            <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
            <p>{processingMessage}</p>
        </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
       <header className="p-4 border-b">
         <h1 className="text-2xl font-headline text-primary text-center">TunePocket</h1>
       </header>
       <main className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
                <SongList groupedSongs={groupedSongs} onSelectSong={handleSelectSong} currentSong={currentSong} />
                <Separator />
                <FileUpload onFileSelect={handleManualUpload} isLoading={isLoading} />
            </div>
        </ScrollArea>
       </main>
      <div className="pb-36" /> {/* Spacer for player */}
      <Player 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onPlayPause={handlePlayPause}
        onNext={playNext}
        onPrev={playPrev}
        isLoading={isLoading}
        telegramUser={user}
      />
    </div>
  );
}
