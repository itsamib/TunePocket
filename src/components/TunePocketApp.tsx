'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { addSong, getSongs, initDB, updateSong, getPlaylists, addPlaylist, updatePlaylistSongs, deletePlaylist, deleteSong as dbDeleteSong } from '@/lib/db';
import type { Song, SongGroup, StoredSong, EditableSongData, Playlist, TabConfig, SongWithId } from '@/types';
import Player from './Player';
import { SongList } from './SongList';
import { EditSongDialog } from './EditSongDialog';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Menu, Search, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Buffer } from 'buffer';
import * as mmb from 'music-metadata-browser';
import { AddSongsToPlaylistDialog } from './AddSongsToPlaylistDialog';
import { SettingsSheet } from './SettingsSheet';
import { Input } from './ui/input';


const DEFAULT_TABS: TabConfig[] = [
    { id: 'songs', name: 'Songs', isVisible: true },
    { id: 'playlists', name: 'Playlists', isVisible: true },
    { id: 'grouped', name: 'Genres', isVisible: true },
    { id: 'artists', name: 'Artists', isVisible: true },
    { id: 'albums', name: 'Albums', isVisible: true },
];

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
  const [songToDelete, setSongToDelete] = useState<SongWithId | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabConfig, setTabConfig] = useState<TabConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');


  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

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

        const isDuplicate = songs.some(song => 
            song.title.toLowerCase() === title.toLowerCase() &&
            song.artist.toLowerCase() === artist.toLowerCase() &&
            song.album.toLowerCase() === album.toLowerCase()
        );

        if (isDuplicate) {
            throw new Error(`Song "${title}" by ${artist} already exists in your library.`);
        }

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
  }, [songs]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setProcessingMessage('Initializing database...');
      
      try {
        await initDB();
        
        const savedTabs = localStorage.getItem('tunePocketTabConfig');
        if (savedTabs) {
            setTabConfig(JSON.parse(savedTabs));
        } else {
            setTabConfig(DEFAULT_TABS);
        }

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
        setOriginalQueue(playableSongs);


        setProcessingMessage('Loading playlists...');
        const storedPlaylists = await getPlaylists();
        setPlaylists(storedPlaylists);


      } catch (error) {
        console.error('DB initialization or data loading failed', error);
        toast({ title: "Initialization Error", description: "Could not load the song library.", variant: "destructive" });
      } finally {
        setIsLoading(false);
        setProcessingMessage('');
      }

      if (window.Telegram && window.Telegram.WebApp) {
          const telegramApp = window.Telegram.WebApp;
          telegramApp.ready();
          setTg(telegramApp);
          setUser(telegramApp.initDataUnsafe?.user);
      }
    };
    
    initializeApp();
  }, [toast]);

  const handleManualUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setProcessingMessage('Processing file...');
    try {
        const savedSong = await processAndSaveSong(file, file.name.replace(/\.[^/.]+$/, ""));
        if (savedSong) {
            toast({ title: "Song Added!", description: `"${savedSong.title}" has been added.` });
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

    const handleDeleteSong = useCallback(async (songId: number) => {
        if (!songId) return;

        try {
            const deletedSongTitle = songs.find(s => s.id === songId)?.title || "The song";
            await dbDeleteSong(songId);

            setSongs(prevSongs => prevSongs.filter(s => s.id !== songId));

            setPlaylists(prevPlaylists =>
                prevPlaylists.map(p => ({
                    ...p,
                    songIds: p.songIds.filter(id => id !== songId)
                }))
            );

            if (currentSong?.id === songId) {
                setCurrentSong(null);
                setIsPlaying(false);
            }

            toast({ title: "Song Deleted", description: `"${deletedSongTitle}" has been removed from your library.` });
        } catch (error) {
            console.error("Failed to delete song:", error);
            toast({ title: "Delete Failed", description: "Could not delete the song.", variant: "destructive" });
        }
    }, [songs, currentSong, toast]);

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

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleManualUpload(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };


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

  const handleOpenDeleteSongDialog = (song: Song) => {
    setSongToDelete({ id: song.id, title: song.title });
  };
  
  const handleOpenAddToPlaylist = (song: Song) => {
    setSongToAddToPlaylist(song);
  }

  const handleOpenAddSongsToPlaylist = (playlist: Playlist) => {
    setPlaylistToEdit(playlist);
  }

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
        const newShuffleState = !prev;
        if (newShuffleState) {
            const newShuffledQueue = [...originalQueue].sort(() => Math.random() - 0.5);
            setShuffledQueue(newShuffledQueue);
        }
        return newShuffleState;
    });
  }, [originalQueue]);

  const handleCycleRepeatMode = () => {
    setRepeatMode(prev => {
        if (prev === 'none') return 'all';
        if (prev === 'all') return 'one';
        return 'none';
    });
  };

  const playNext = useCallback(() => {
    if (!currentSong || songs.length === 0) return;

    const queue = isShuffle ? shuffledQueue : originalQueue;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
            nextIndex = 0;
        } else {
            setIsPlaying(false);
            return;
        }
    }

    setCurrentSong(queue[nextIndex]);
    setIsPlaying(true);
  }, [currentSong, songs.length, isShuffle, shuffledQueue, originalQueue, repeatMode]);

  const playPrev = useCallback(() => {
    if (!currentSong || songs.length === 0) return;
    
    const queue = isShuffle ? shuffledQueue : originalQueue;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    
    setCurrentSong(queue[prevIndex]);
    setIsPlaying(true);
  }, [currentSong, songs.length, isShuffle, shuffledQueue, originalQueue]);
  
  const handleUpdateTabConfig = (newConfig: TabConfig[]) => {
      setTabConfig(newConfig);
      localStorage.setItem('tunePocketTabConfig', JSON.stringify(newConfig));
      toast({ title: 'Settings Saved', description: 'Your tab settings have been updated.'})
  }

  useEffect(() => {
    setOriginalQueue(songs);
    if(isShuffle) {
        setShuffledQueue([...songs].sort(() => Math.random() - 0.5));
    }
  }, [songs, isShuffle]);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) {
      return songs;
    }
    return songs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album.toLowerCase().includes(query)
    );
  }, [songs, searchQuery]);

  const groupedSongs = useMemo(() => {
    return filteredSongs.reduce<SongGroup>((acc, song) => {
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
  }, [filteredSongs]);
  
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
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length > 0) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartRef.current.x;

    if (touchStartRef.current.x < 20 && swipeDistance > 100) {
      setIsSettingsOpen(true);
    }
    
    touchStartRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
  };

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
    <div 
      className="h-screen w-screen flex flex-col bg-background text-foreground"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
       <header className="p-2 border-b flex items-center justify-between">
         <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Menu />
         </Button>
         <h1 className="text-2xl font-headline text-primary">TunePocket</h1>
         <div className="w-10"></div>
       </header>
       <main className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4 pb-32">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                   <Input 
                     placeholder="Search songs, artists, albums..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10"
                   />
                   {searchQuery && (
                     <Button
                       variant="ghost"
                       size="icon"
                       className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                       onClick={() => setSearchQuery('')}
                     >
                       <X className="h-5 w-5 text-muted-foreground" />
                     </Button>
                   )}
                </div>
                <SongList 
                  songs={filteredSongs}
                  groupedSongs={groupedSongs} 
                  playlists={playlists}
                  onSelectSong={handleSelectSong} 
                  onEditSong={handleEditSong}
                  onDeleteSong={handleOpenDeleteSongDialog}
                  onOpenAddToPlaylist={handleOpenAddToPlaylist}
                  onCreatePlaylist={handleCreatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onOpenAddSongsToPlaylist={handleOpenAddSongsToPlaylist}
                  currentSong={currentSong} 
                  tabConfig={tabConfig}
                  songToDelete={songToDelete}
                  setSongToDelete={setSongToDelete}
                  confirmDeleteSong={handleDeleteSong}
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
       <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tabConfig={tabConfig}
        onTabConfigChange={handleUpdateTabConfig}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        className="hidden" 
        accept="audio/*,.m4a"
      />
      <Button 
        onClick={handleFileButtonClick}
        disabled={isLoading && !!processingMessage}
        className="fixed bottom-24 right-4 z-50 h-16 w-16 rounded-full shadow-lg"
      >
        <Plus className="w-8 h-8" />
        <span className="sr-only">Add Song</span>
      </Button>
      
      <Player 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onPlayPause={handlePlayPause}
        onNext={playNext}
        onPrev={playPrev}
        isLoading={isLoading && !!processingMessage}
        telegramUser={user}
        isShuffle={isShuffle}
        onToggleShuffle={handleToggleShuffle}
        repeatMode={repeatMode}
        onCycleRepeatMode={handleCycleRepeatMode}
      />
    </div>
  );
}
