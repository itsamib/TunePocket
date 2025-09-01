'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { addSong, getSongs, initDB, updateSong, getPlaylists, addPlaylist, updatePlaylistSongs, deletePlaylist } from '@/lib/db';
import { getTelegramFile } from '@/ai/flows/get-telegram-file';
import { sendTelegramMessage } from '@/ai/flows/send-telegram-message';
import type { Song, SongGroup, StoredSong, EditableSongData, Playlist } from '@/types';
import Player from './Player';
import { SongList } from './SongList';
import { FileUpload } from './FileUpload';
import { EditSongDialog } from './EditSongDialog';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Buffer } from 'buffer';
import * as mmb from 'music-metadata-browser';
import { AddSongsToPlaylistDialog } from './AddSongsToPlaylistDialog';


export default function TunePocketApp() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingMessage, setProcessingMessage] = useState('Initializing...');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const { toast } = useToast();

  const processAndSaveSong = useCallback(async (file: Blob, defaultTitle: string): Promise<Song | null> => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error("File is larger than 50MB limit.");
    }
    
    setProcessingMessage('Reading metadata...');
    
    if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
        (window as any).Buffer = Buffer;
    }

    try {
        const fileArrayBuffer = await file.arrayBuffer();
        const metadata = await mmb.parseBuffer(Buffer.from(fileArrayBuffer), file.type, { duration: true });
        
        const title = metadata.common.title || defaultTitle;
        const artist = metadata.common.artist || 'Unknown Artist';
        const album = metadata.common.album || 'Unknown Album';
        const genre = metadata.common.genre?.[0] || 'Unknown Genre';
        const duration = metadata.format.duration || 0;
        const picture = metadata.common.picture?.[0];
        
        setProcessingMessage('Saving to library...');
        const artworkData = picture ? { data: picture.data.buffer as ArrayBuffer, format: picture.format } : undefined;

        const newSongData: Omit<StoredSong, 'id'> = {
          title,
          artist,
          album,
          genre,
          fileBlob: fileArrayBuffer,
          duration,
          artwork: artworkData,
          contentType: file.type || 'audio/mpeg',
        };
        
        const newId = await addSong(newSongData);
        
        const playableBlob = new Blob([fileArrayBuffer], { type: newSongData.contentType });
        
        const finalSong: Song = { 
            id: newId,
            title,
            artist,
            album,
            genre,
            fileBlob: playableBlob,
            localURL: URL.createObjectURL(playableBlob),
            artwork: picture ? { data: new Uint8Array(artworkData!.data), format: artworkData!.format } : undefined,
            duration,
            contentType: newSongData.contentType,
        };
        
        setSongs(prevSongs => [...prevSongs, finalSong].sort((a, b) => a.title.localeCompare(b.title)));

        return finalSong;

    } catch (error) {
        console.error("Failed to process and save song:", error);
        throw error;
    }
  }, []);

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
        const { fileBuffer, contentType, fileName } = await getTelegramFile({ fileId });

        const buffer = Buffer.from(fileBuffer, 'base64');
        const blob = new Blob([buffer], { type: contentType });
      
        const savedSong = await processAndSaveSong(blob, fileName);
      
        if (savedSong) {
            toast({ title: "Song Added!", description: `\'\'\'${savedSong.title}\'\'\' by ${savedSong.artist} has been added.` });
            
            setProcessingMessage('Sending confirmation...');
            await sendTelegramMessage({
              chatId: chatId,
              text: `✅ Song "\'\'\'${savedSong.title}\'\'\'" was successfully added to your TunePocket library!`,
            });
        }

    } catch (error: any) {
        console.error("Error handling Telegram file:", error);
        toast({ title: "Processing Failed", description: error.message || "Could not process the song from Telegram.", variant: "destructive" });
        if (chatId) {
            try {
                await sendTelegramMessage({
                    chatId: chatId,
                    text: `❌ Failed to add song to your library. Error: ${error.message}`,
                });
            } catch (sendError) {
                console.error("Failed to send error confirmation:", sendError);
            }
        }
    } finally {
        setIsLoading(false);
        setProcessingMessage('');
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.hash = '';
            window.history.replaceState({}, document.title, url.toString());
        }
    }
  }, [processAndSaveSong, toast]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setProcessingMessage('Initializing database...');
      
      try {
        await initDB();
        setProcessingMessage('Loading library...');
        const storedSongs: StoredSong[] = await getSongs();
        
        const playableSongs: Song[] = storedSongs.map(song => {
           const blob = new Blob([song.fileBlob], { type: song.contentType });
           const localURL = URL.createObjectURL(blob);
           const artwork = song.artwork ? { data: new Uint8Array(song.artwork.data), format: song.artwork.format } : undefined;
           
           return {
             ...song,
             id: song.id,
             fileBlob: blob,
             localURL,
             artwork,
           }
        }).sort((a, b) => a.title.localeCompare(b.title));
        setSongs(playableSongs);

        setProcessingMessage('Loading playlists...');
        const storedPlaylists = await getPlaylists();
        setPlaylists(storedPlaylists);


      } catch (error) {
        console.error('DB initialization or data loading failed', error);
        toast({ title: "Initialization Error", description: "Could not load the song library.", variant: "destructive" });
        setIsLoading(false);
        setProcessingMessage('');
        return; 
      }

      let startParam: string | null = null;
      if (window.Telegram && window.Telegram.WebApp) {
          const telegramApp = window.Telegram.WebApp;
          telegramApp.ready();
          setTg(telegramApp);
          setUser(telegramApp.initDataUnsafe?.user);
          startParam = telegramApp.initDataUnsafe?.start_param;
      }
      
      if (!startParam && window.location.hash) {
         const hashParams = new URLSearchParams(window.location.hash.substring(1));
         startParam = hashParams.get('tgWebAppStartParam');
      }

      if (startParam) {
          await handleTelegramFile(startParam);
      } else {
          setIsLoading(false);
          setProcessingMessage('');
      }
    };
    
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setProcessingMessage('Processing file...');
    try {
        const savedSong = await processAndSaveSong(file, file.name.replace(/\.[^/.]+$/, ""));
        if (savedSong) {
            toast({ title: "Song Added!", description: `\'\'\'${savedSong.title}\'\'\' has been added.` });
        }
    } catch (error: any) {
        console.error('Failed to process file', error);
        toast({ title: "Processing Failed", description: error.message || "Could not process the audio file.", variant: "destructive" });
    } finally {
        setIsLoading(false);
        setProcessingMessage('');
    }
  }, [processAndSaveSong, toast]);
  
  const handleUpdateSong = useCallback(async (updatedData: EditableSongData) => {
    if (!editingSong) return;

    try {
      await updateSong(editingSong.id, updatedData);
      const updatedSongs = songs.map(s =>
          s.id === editingSong.id ? { ...s, ...updatedData } : s
        ).sort((a, b) => a.title.localeCompare(b.title));
      setSongs(updatedSongs);
      if(currentSong?.id === editingSong.id) {
          setCurrentSong(prev => prev ? { ...prev, ...updatedData } : null);
      }
      toast({ title: "Song Updated", description: "The song details have been saved." });
    } catch (error) {
      console.error("Failed to update song:", error);
      toast({ title: "Update Failed", description: "Could not save the changes.", variant: "destructive" });
    }
  }, [editingSong, toast, songs, currentSong?.id]);

  const handleCreatePlaylist = useCallback(async () => {
    const playlistName = prompt("Enter the name for the new playlist:");
    if (playlistName && playlistName.trim() !== "") {
        try {
            const newPlaylist = await addPlaylist(playlistName.trim());
            setPlaylists(prev => [...prev, newPlaylist].sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: "Playlist Created", description: `Playlist '${newPlaylist.name}' has been created.` });
        } catch (error) {
            console.error("Failed to create playlist", error);
            toast({ title: "Error", description: "Could not create the playlist.", variant: "destructive" });
        }
    }
  }, [toast]);
  
  const handleDeletePlaylist = useCallback(async (playlistId: number) => {
    try {
        await deletePlaylist(playlistId);
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        toast({ title: "Playlist Deleted", description: "The playlist has been removed." });
    } catch (error) {
        console.error("Failed to delete playlist", error);
        toast({ title: "Error", description: "Could not delete the playlist.", variant: "destructive" });
    }
  }, [toast]);

  const handleAddSongToPlaylist = useCallback(async (playlistId: number) => {
    if (!songToAddToPlaylist) return;
    try {
        const updatedPlaylist = await updatePlaylistSongs(playlistId, [songToAddToPlaylist.id]);
        if (updatedPlaylist) {
            setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
            toast({ title: "Song Added", description: `Added to '${updatedPlaylist.name}'.` });
        } else {
             toast({ title: "Already Exists", description: `This song is already in the playlist.` });
        }
    } catch (error) {
        console.error("Failed to add song to playlist", error);
        toast({ title: "Error", description: "Could not add the song to the playlist.", variant: "destructive" });
    }
  }, [songToAddToPlaylist, toast]);
  
  const handleConfirmAddSongsToPlaylist = useCallback(async (playlistId: number, songIds: number[]) => {
    if (songIds.length === 0) return;
    try {
        const updatedPlaylist = await updatePlaylistSongs(playlistId, songIds);
        if (updatedPlaylist) {
             setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
             toast({ title: "Playlist Updated", description: `${songIds.length} song(s) added to '${updatedPlaylist.name}'.` });
        }
    } catch (error) {
        console.error("Failed to add songs to playlist", error);
        toast({ title: "Error", description: "Could not add the selected songs.", variant: "destructive" });
    }
    setPlaylistToEdit(null);
  }, [toast]);


  const handlePlayPause = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSelectSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };
  
  const handleEditSong = (song: Song) => {
    setEditingSong(song);
  };
  
  const handleOpenAddToPlaylist = (song: Song) => {
    setSongToAddToPlaylist(song);
  }

  const handleOpenAddSongsToPlaylist = (playlist: Playlist) => {
    setPlaylistToEdit(playlist);
  }

  const playNext = useCallback(() => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  }, [currentSong, songs]);

  const playPrev = useCallback(() => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  }, [currentSong, songs]);

  const groupedSongs = useMemo(() => {
    return songs.reduce<SongGroup>((acc, song) => {
      const { genre, artist, album } = song;
      if (!acc[genre]) {
        acc[genre] = {};
      }
      if (!acc[genre][artist]) {
        acc[genre][artist] = {};
      }
      if (!acc[genre][artist][album]) {
        acc[genre][artist][album] = [];
      }
      acc[genre][artist][album].push(song);
      return acc;
    }, {});
  }, [songs]);
  
  useEffect(() => {
    if (!tg) return;

    const applyTheme = (theme: 'dark' | 'light') => {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
    
    applyTheme(tg.colorScheme);

    const themeChangedHandler = () => {
        applyTheme(tg.colorScheme);
    };

    tg.onEvent('themeChanged', themeChangedHandler);
    
    return () => {
        tg.offEvent('themeChanged', themeChangedHandler);
    }
  }, [tg]);

  if (isLoading && !songs.length && processingMessage) {
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
                <SongList 
                  songs={songs}
                  groupedSongs={groupedSongs} 
                  playlists={playlists}
                  onSelectSong={handleSelectSong} 
                  onEditSong={handleEditSong}
                  onOpenAddToPlaylist={handleOpenAddToPlaylist}
                  onCreatePlaylist={handleCreatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onOpenAddSongsToPlaylist={handleOpenAddSongsToPlaylist}
                  currentSong={currentSong} 
                />
                <Separator />
                <FileUpload 
                  onFileSelect={handleManualUpload} 
                  isLoading={isLoading && !!processingMessage}
                />
            </div>
        </ScrollArea>
       </main>
       <EditSongDialog
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        song={editingSong}
        onSave={handleUpdateSong}
      />
      <AddToPlaylistDialog
        isOpen={!!songToAddToPlaylist}
        onClose={() => setSongToAddToPlaylist(null)}
        song={songToAddToPlaylist}
        playlists={playlists}
        onSelectPlaylist={handleAddSongToPlaylist}
      />
      <AddSongsToPlaylistDialog
        isOpen={!!playlistToEdit}
        playlist={playlistToEdit}
        allSongs={songs}
        onClose={() => setPlaylistToEdit(null)}
        onConfirm={handleConfirmAddSongsToPlaylist}
      />
      <div className="pb-36" /> {/* Spacer for player */}
      <Player 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onPlayPause={handlePlayPause}
        onNext={playNext}
        onPrev={playPrev}
        isLoading={isLoading && !!processingMessage}
        telegramUser={user}
      />
    </div>
  );
}
