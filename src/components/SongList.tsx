'use client';

import { useMemo, useState } from 'react';
import type { Song, SongGroup, Playlist, TabConfig, SongWithId } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Music, User, Library, PlayCircle, BarChartHorizontal, Disc, Pencil, ListMusic, Columns3, MoreVertical, PlusCircle, Trash2, FolderPlus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';

interface SongListProps {
  songs: Song[];
  groupedSongs: SongGroup;
  playlists: Playlist[];
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
  onDeleteSong: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onCreatePlaylist: () => void;
  onDeletePlaylist: (playlistId: number) => void;
  onOpenAddSongsToPlaylist: (playlist: Playlist) => void;
  currentSong: Song | null;
  tabConfig: TabConfig[];
  songToDelete: SongWithId | null;
  setSongToDelete: (song: SongWithId | null) => void;
  confirmDeleteSong: (id: number) => void;
}

const ICONS: { [key: string]: React.ElementType } = {
    songs: Music,
    playlists: ListMusic,
    grouped: Columns3,
    artists: User,
    albums: Disc,
};

const SongListItem = ({ song, currentSong, onSelectSong, onEditSong, onOpenAddToPlaylist, onDeleteSong }: { song: Song; currentSong: Song | null; onSelectSong: (song: Song) => void; onEditSong: (song: Song) => void; onOpenAddToPlaylist: (song: Song) => void; onDeleteSong: (song: Song) => void; }) => (
    <li className="flex items-center gap-2">
        <Button
            variant={currentSong?.id === song.id ? "secondary" : "ghost"}
            className={`w-full justify-start h-auto py-2 ${currentSong?.id === song.id ? 'font-bold' : ''}`}
            onClick={() => onSelectSong(song)}
        >
            {currentSong?.id === song.id ? (
                <BarChartHorizontal className="w-4 h-4 mr-2 text-primary animate-pulse" />
            ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
            )}
            <div className="truncate">
                <p className="truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">{song.artist} &middot; {song.album}</p>
            </div>
        </Button>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEditSong(song)}>
                    <Pencil className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenAddToPlaylist(song)}>
                    <ListMusic className="mr-2" /> Add to Playlist...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteSong(song)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </li>
);

const ArtistList = ({ songs, onSelectSong, onEditSong, onOpenAddToPlaylist, onDeleteSong, currentSong }: Pick<SongListProps, 'songs' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'onDeleteSong' | 'currentSong'>) => {
    const artists = useMemo(() => {
        return songs.reduce((acc, song) => {
            if (!acc[song.artist]) {
                acc[song.artist] = [];
            }
            acc[song.artist].push(song);
            return acc;
        }, {} as { [artist: string]: Song[] });
    }, [songs]);

    const sortedArtists = Object.keys(artists).sort();

    if (sortedArtists.length === 0) return <p className="text-center text-muted-foreground p-4">No artists found.</p>;

    return (
        <Accordion type="multiple" className="w-full">
            {sortedArtists.map(artist => (
                <AccordionItem value={artist} key={artist}>
                    <AccordionTrigger className="font-headline text-lg flex items-center gap-2 text-accent hover:no-underline">
                        <User className="w-5 h-5"/> {artist}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-1 pt-1 pl-4">
                            {artists[artist].map(song => (
                                <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} />
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

const AlbumList = ({ songs, onSelectSong, onEditSong, onOpenAddToPlaylist, onDeleteSong, currentSong }: Pick<SongListProps, 'songs' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'onDeleteSong' | 'currentSong'>) => {
    const albums = useMemo(() => {
        return songs.reduce((acc, song) => {
            if (!acc[song.album]) {
                acc[song.album] = [];
            }
            acc[song.album].push(song);
            return acc;
        }, {} as { [album: string]: Song[] });
    }, [songs]);

    const sortedAlbums = Object.keys(albums).sort();

    if (sortedAlbums.length === 0) return <p className="text-center text-muted-foreground p-4">No albums found.</p>;

    return (
        <Accordion type="multiple" className="w-full">
            {sortedAlbums.map(album => (
                <AccordionItem value={album} key={album}>
                    <AccordionTrigger className="font-headline text-lg flex items-center gap-2 text-primary hover:no-underline">
                        <Disc className="w-5 h-5"/> {album}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-1 pt-1 pl-4">
                            {albums[album].map(song => (
                                <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} />
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

const GroupedList = ({ groupedSongs, onSelectSong, onEditSong, onOpenAddToPlaylist, onDeleteSong, currentSong }: Pick<SongListProps, 'groupedSongs' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'onDeleteSong' | 'currentSong'>) => {
    const sortedGenres = Object.keys(groupedSongs).sort();

    if (sortedGenres.length === 0) return <p className="text-center text-muted-foreground p-4">No genres found.</p>;
    
    return (
    <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedSongs)}>
        {sortedGenres.map(genre => (
            <AccordionItem value={genre} key={genre}>
                <AccordionTrigger className="font-headline text-lg flex items-center gap-2 text-primary hover:no-underline">
                    <Music className="w-5 h-5"/> {genre}
                </AccordionTrigger>
                <AccordionContent>
                    <Accordion type="multiple" className="w-full pl-4" defaultValue={Object.keys(groupedSongs[genre])}>
                        {Object.keys(groupedSongs[genre]).sort().map(artist => (
                            <AccordionItem value={`${genre}-${artist}`} key={`${genre}-${artist}`}>
                                <AccordionTrigger className="font-semibold flex items-center gap-2 text-accent hover:no-underline">
                                    <User className="w-4 h-4" /> {artist}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-4 space-y-2">
                                        {Object.keys(groupedSongs[genre][artist]).sort().map(album => (
                                            <div key={`${genre}-${artist}-${album}`}>
                                                <h5 className="font-semibold flex items-center gap-2 text-muted-foreground mb-2">
                                                    <Disc className="w-4 h-4" /> {album}
                                                </h5>
                                                <ul className="space-y-1 pt-1 pl-4">
                                                    {groupedSongs[genre][artist][album].map(song => (
                                                         <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} />
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </AccordionContent>
            </AccordionItem>
        ))}
    </Accordion>
    );
};

const PlaylistView = ({ playlists, songs, currentSong, onSelectSong, onEditSong, onOpenAddToPlaylist, onDeleteSong, onCreatePlaylist, onDeletePlaylist, onOpenAddSongsToPlaylist }: Pick<SongListProps, 'playlists' | 'songs' | 'currentSong' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'onDeleteSong' | 'onCreatePlaylist' | 'onDeletePlaylist' | 'onOpenAddSongsToPlaylist'>) => {
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState<number | null>(null);

    const songsById = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);

    const handleDeleteClick = (id: number) => {
        setPlaylistToDelete(id);
        setIsAlertOpen(true);
    };

    const confirmDelete = () => {
        if (playlistToDelete !== null) {
            onDeletePlaylist(playlistToDelete);
        }
        setIsAlertOpen(false);
        setPlaylistToDelete(null);
    };

    return (
        <TooltipProvider>
            <Button onClick={onCreatePlaylist} className="w-full mb-4">
                <PlusCircle className="mr-2" /> Create New Playlist
            </Button>
            {playlists.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                    {playlists.map(playlist => (
                        <AccordionItem value={`playlist-${playlist.id}`} key={playlist.id}>
                            <div className="flex items-center w-full">
                                <AccordionTrigger className="font-headline text-lg flex-grow hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <ListMusic className="w-5 h-5 text-primary"/> {playlist.name}
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-1 shrink-0 pr-4">
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" className="p-0 w-8 h-8" onClick={() => onOpenAddSongsToPlaylist(playlist)}>
                                                <FolderPlus className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Add songs to playlist</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="destructive" size="sm" className="p-0 w-8 h-8" onClick={() => handleDeleteClick(playlist.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Delete playlist</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                            <AccordionContent>
                                {playlist.songIds.length > 0 ? (
                                    <ul className="space-y-1 pt-1 pl-4">
                                        {playlist.songIds.map(songId => {
                                            const song = songsById.get(songId);
                                            return song ? <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} /> : null;
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground pl-4 pt-2">This playlist is empty. Click the plus icon to add songs.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center text-muted-foreground p-4 border-dashed border-2 rounded-md">
                    <p>No playlists yet.</p>
                    <p>Click the button above to create your first one!</p>
                </div>
            )}
             <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the playlist. Songs in the playlist will not be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPlaylistToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    )
}


export function SongList({ songs, groupedSongs, playlists, onSelectSong, onEditSong, onDeleteSong, onOpenAddToPlaylist, onCreatePlaylist, onDeletePlaylist, onOpenAddSongsToPlaylist, currentSong, tabConfig, songToDelete, setSongToDelete, confirmDeleteSong }: SongListProps) {
  
    if (songs.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8">
                <p className="font-headline text-lg">Your Library is Empty</p>
                <p>Add songs by sending an audio file to the Telegram bot.</p>
            </div>
        )
    }
    
    const visibleTabs = tabConfig.filter(tab => tab.isVisible);
    const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].id : "";

    const handleConfirmDeleteSong = () => {
        if (songToDelete) {
            confirmDeleteSong(songToDelete.id);
        }
        setSongToDelete(null);
    }
    
    const renderContent = (tabId: string) => {
        switch(tabId) {
            case 'songs':
                return songs.length > 0 ? (
                    <ul className="space-y-1">
                        {songs.map(song => (
                           <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} />
                        ))}
                    </ul>
                ) : <p className="text-center text-muted-foreground p-4">No songs found.</p>;
            case 'playlists':
                return <PlaylistView 
                        playlists={playlists} 
                        songs={songs} 
                        currentSong={currentSong} 
                        onSelectSong={onSelectSong} 
                        onEditSong={onEditSong}
                        onOpenAddToPlaylist={onOpenAddToPlaylist}
                        onDeleteSong={onDeleteSong}
                        onCreatePlaylist={onCreatePlaylist}
                        onDeletePlaylist={onDeletePlaylist}
                        onOpenAddSongsToPlaylist={onOpenAddSongsToPlaylist}
                    />;
            case 'grouped':
                return <GroupedList groupedSongs={groupedSongs} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} currentSong={currentSong} />;
            case 'artists':
                return <ArtistList songs={songs} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} currentSong={currentSong} />;
            case 'albums':
                return <AlbumList songs={songs} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} onDeleteSong={onDeleteSong} currentSong={currentSong} />;
            default:
                return null;
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2"><Library /> My Library</h2>
            
            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)`}}>
                    {visibleTabs.map(tab => {
                        const Icon = ICONS[tab.id];
                        return (
                             <TabsTrigger key={tab.id} value={tab.id}>
                                <Icon className="w-4 h-4 mr-2"/>
                                {tab.name}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>
                {visibleTabs.map(tab => (
                    <TabsContent key={tab.id} value={tab.id} className="mt-4">
                        {renderContent(tab.id)}
                    </TabsContent>
                ))}
            </Tabs>
             <AlertDialog open={!!songToDelete} onOpenChange={(isOpen) => !isOpen && setSongToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete &quot;{songToDelete?.title}&quot; from your library and all playlists.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteSong} className={cn(buttonVariants({ variant: "destructive" }))}>
                            Delete Song
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
