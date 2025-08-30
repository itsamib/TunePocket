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
import { Loader2, Music, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

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
  const { tg, user, startParam } = useTelegram();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingMessage, setProcessingMessage] = useState('Initializing...');
  const { toast } = useToast();

  const loadSongs = useCallback(async () => {
    try {
      const storedSongs = await getSongs();
      setSongs(storedSongs);
    } catch (error) {
      console.error('Failed to load songs from DB', error);
      toast({ title: "Error", description: "Could not load song library.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setProcessingMessage('Initializing...');
      await initDB();
      await loadSongs();
      setIsLoading(false);
      setProcessingMessage('');
    };
    initialize();
  }, [loadSongs]);

  const processFile = useCallback(async (file: File | Blob, fileName?: string, chatId?: string) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 50MB.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    setProcessingMessage('Reading metadata...');
    
    try {
      const mmb = await getMmb();
      const metadata = await mmb.parseBlob(file);
      
      const title = metadata.common.title || fileName || 'Unknown Title';
      const artist = metadata.common.artist || 'Unknown Artist';
      const genre = metadata.common.genre?.[0] || 'Unknown';
      
      setProcessingMessage('Categorizing song...');
      const { category, subCategory } = await categorizeSongsByGenre({ title, artist, genre });
      
      const newSong: Omit<Song, 'id'> = {
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
      await addSong(newSong);
      await loadSongs();
      
      toast({ title: "Song Added!", description: `${title} by ${artist} has been added to your library.` });
      
      if (chatId) {
        setProcessingMessage('Sending confirmation...');
        await sendTelegramMessage({
          chatId: chatId,
          text: `✅ Song "${title}" by ${artist} was successfully added to your TunePocket library!`,
        });
      }

    } catch (error: any) {
      console.error('Failed to process file', error);
      toast({ title: "Processing Failed", description: error.message || "Could not process the audio file. Please try again.", variant: "destructive" });
      if (chatId) {
        await sendTelegramMessage({
          chatId: chatId,
          text: `❌ Failed to add song to your library. Error: ${error.message}`,
        });
      }
    } finally {
      setIsLoading(false);
      setProcessingMessage('');
    }
  }, [loadSongs, toast]);
  
  useEffect(() => {
    const downloadAndProcess = async (param: string) => {
        setIsLoading(true);
        setProcessingMessage('Downloading from Telegram...');
        try {
          const [fileId, chatId] = param.split('_');
          if (!fileId || !chatId) {
            throw new Error('Invalid start parameter from Telegram.');
          }

          const response = await getTelegramFile({ fileId });
          if (!response.ok) throw new Error('Failed to download file from Telegram');
          
          const blob = await response.blob();
          
          let fileName = 'telegram-song.mp3';
          const contentDisposition = response.headers.get('content-disposition');
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch && filenameMatch[1]) {
                fileName = filenameMatch[1];
            }
          }
          
          await processFile(blob, fileName, chatId);
          
          // Clear startParam from URL only on success
          if (window.history.pushState) {
            const url = new URL(window.location.href);
            const params = new URLSearchParams(url.hash.slice(1));
            params.delete('tgWebAppStartParam');
            url.hash = params.toString();
            window.history.pushState({}, document.title, url.toString());
          }

        } catch (error) {
          console.error("Error fetching from Telegram via flow:", error);
          toast({ title: "Download Failed", description: "Could not download the song from Telegram.", variant: "destructive" });
        } finally {
            setIsLoading(false);
            setProcessingMessage('');
        }
    };

    if (startParam) {
      downloadAndProcess(startParam);
    }
    
  }, [startParam, processFile, toast]);

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
    tg?.onEvent('themeChanged', () => {
      if (tg.colorScheme) {
        applyTheme(tg.colorScheme);
      }
    });
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
    <div className="flex h-full w-full bg-background text-foreground">
      <aside className="w-1/3 h-full border-r border-border overflow-hidden relative">
        <SongList groupedSongs={groupedSongs} onSelectSong={handleSelectSong} currentSong={currentSong} />
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t bg-background/80 backdrop-blur-sm">
            {user ? (
                <Badge variant="secondary" className="flex items-center gap-2">
                    <Wifi className="text-green-500" />
                    Connected as {user.username || `${user.first_name} ${user.last_name || ''}`}
                </Badge>
            ): (
                <Badge variant="destructive" className="flex items-center gap-2">
                    <WifiOff />
                    Not connected to Telegram
                </Badge>
            )}
        </div>
      </aside>
      <main className="w-2/3 h-full overflow-y-auto">
        {currentSong?.artwork ? (
            <div className="relative w-full h-full flex items-center justify-center">
                <Image 
                    src={URL.createObjectURL(new Blob([currentSong.artwork.data], {type: currentSong.artwork.format}))}
                    alt="Current song artwork"
                    fill
                    className="object-cover opacity-20 blur-xl"
                />
                <Card className="z-10 w-2/3 max-w-sm shadow-2xl">
                    <CardContent className="p-4">
                       <FileUpload onFileSelect={(file) => processFile(file)} isLoading={isLoading} />
                    </CardContent>
                </Card>
            </div>
        ) : (
            <FileUpload onFileSelect={(file) => processFile(file)} isLoading={isLoading} />
        )}
      </main>
      <div className="pb-28" /> {/* Spacer for player */}
      <Player 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onPlayPause={handlePlayPause}
        onNext={playNext}
        onPrev={playPrev}
        isLoading={isLoading}
      />
    </div>
  );
}
