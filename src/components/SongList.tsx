'use client';

import { useMemo, useState } from 'react';
import type { Song, SongGroup, Playlist } from '@/types';
import { Button } from '@/components/ui/button';
import { Music, User, Library, PlayCircle, BarChartHorizontal, Disc, Pencil, ListMusic, Columns3, MoreVertical, PlusCircle, Trash2, FolderPlus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface SongListProps {
  songs: Song[];
  groupedSongs: SongGroup;
  playlists: Playlist[];
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onCreatePlaylist: () => void;
  onDeletePlaylist: (playlistId: number) => void;
  onOpenAddSongsToPlaylist: (playlist: Playlist) => void;
  currentSong: Song | null;
}

const SongListItem = ({ song, currentSong, onSelectSong, onEditSong, onOpenAddToPlaylist }: { song: Song; currentSong: Song | null; onSelectSong: (song: Song) => void; onEditSong: (song: Song) => void; onOpenAddToPlaylist: (song: Song) => void; }) => (
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
            </DropdownMenuContent>
        </DropdownMenu>
    </li>
);

const ArtistList = ({ songs, onSelectSong, onEditSong, onOpenAddToPlaylist, currentSong }: Pick<SongListProps, 'songs' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'currentSong'>) => {
    const artists = useMemo(() => {
        return songs.reduce((acc, song) => {
            if (!acc[song.artist]) {
                acc[song.artist] = [];
            }
            acc[song.artist].push(song);
            return acc;
        }, {} as { [artist: string]: Song[] });
    }, [songs]);

    return (
        <Accordion type="multiple" className="w-full">
            {Object.keys(artists).sort().map(artist => (
                <AccordionItem value={artist} key={artist}>
                    <AccordionTrigger className="font-headline text-lg flex items-center gap-2 text-accent hover:no-underline">
                        <User className="w-5 h-5"/> {artist}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-1 pt-1 pl-4">
                            {artists[artist].map(song => (
                                <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} />
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

const AlbumList = ({ songs, onSelectSong, onEditSong, onOpenAddToPlaylist, currentSong }: Pick<SongListProps, 'songs' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'currentSong'>) => {
    const albums = useMemo(() => {
        return songs.reduce((acc, song) => {
            if (!acc[song.album]) {
                acc[song.album] = [];
            }
            acc[song.album].push(song);
            return acc;
        }, {} as { [album: string]: Song[] });
    }, [songs]);

    return (
        <Accordion type="multiple" className="w-full">
            {Object.keys(albums).sort().map(album => (
                <AccordionItem value={album} key={album}>
                    <AccordionTrigger className="font-headline text-lg flex items-center gap-2 text-primary hover:no-underline">
                        <Disc className="w-5 h-5"/> {album}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-1 pt-1 pl-4">
                            {albums[album].map(song => (
                                <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} />
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

const GroupedList = ({ groupedSongs, onSelectSong, onEditSong, onOpenAddToPlaylist, currentSong }: Pick<SongListProps, 'groupedSongs' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'currentSong'>) => (
    <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedSongs)}>
        {Object.keys(groupedSongs).sort().map(genre => (
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
                                                         <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} />
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

const PlaylistView = ({ playlists, songs, currentSong, onSelectSong, onEditSong, onOpenAddToPlaylist, onCreatePlaylist, onDeletePlaylist, onOpenAddSongsToPlaylist }: Pick<SongListProps, 'playlists' | 'songs' | 'currentSong' | 'onSelectSong' | 'onEditSong' | 'onOpenAddToPlaylist' | 'onCreatePlaylist' | 'onDeletePlaylist' | 'onOpenAddSongsToPlaylist'>) => {
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
        <div>
            <Button onClick={onCreatePlaylist} className="w-full mb-4">
                <PlusCircle className="mr-2" /> Create New Playlist
            </Button>
            {playlists.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                    {playlists.map(playlist => (
                        <AccordionItem value={`playlist-${playlist.id}`} key={playlist.id}>
                            <AccordionTrigger className="font-headline text-lg flex items-center justify-between hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <ListMusic className="w-5 h-5 text-primary"/> {playlist.name}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="flex justify-end gap-2 mb-2">
                                    <Button variant="outline" size="sm" onClick={() => onOpenAddSongsToPlaylist(playlist)}>
                                        <FolderPlus className="mr-2 h-4 w-4" /> Add Songs
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(playlist.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Playlist
                                    </Button>
                                </div>
                                {playlist.songIds.length > 0 ? (
                                    <ul className="space-y-1 pt-1 pl-4">
                                        {playlist.songIds.map(songId => {
                                            const song = songsById.get(songId);
                                            return song ? <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} /> : null;
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground pl-4 pt-2">This playlist is empty. Click &quot;Add Songs&quot; to get started.</p>
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
        </div>
    )
}


export function SongList({ songs, groupedSongs, playlists, onSelectSong, onEditSong, onOpenAddToPlaylist, onCreatePlaylist, onDeletePlaylist, onOpenAddSongsToPlaylist, currentSong }: SongListProps) {
  
    if (songs.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8">
                <p className="font-headline text-lg">Your Library is Empty</p>
                <p>Add songs by uploading a file below or sending an audio file to the Telegram bot.</p>
            </div>
        )
    }
    
    return (
        <div>
            <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2"><Library /> My Library</h2>
            
            <Tabs defaultValue="songs" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="songs"><Music className="w-4 h-4 mr-2"/>Songs</TabsTrigger>
                    <TabsTrigger value="playlists"><ListMusic className="w-4 h-4 mr-2"/>Playlists</TabsTrigger>
                    <TabsTrigger value="grouped"><Columns3 className="w-4 h-4 mr-2"/>Genres</TabsTrigger>
                    <TabsTrigger value="artists"><User className="w-4 h-4 mr-2"/>Artists</TabsTrigger>
                    <TabsTrigger value="albums"><Disc className="w-4 h-4 mr-2"/>Albums</TabsTrigger>
                </TabsList>
                <TabsContent value="songs" className="mt-4">
                     <ul className="space-y-1">
                        {songs.map(song => (
                           <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} />
                        ))}
                    </ul>
                </TabsContent>
                <TabsContent value="playlists" className="mt-4">
                     <PlaylistView 
                        playlists={playlists} 
                        songs={songs} 
                        currentSong={currentSong} 
                        onSelectSong={onSelectSong} 
                        onEditSong={onEditSong}
                        onOpenAddToPlaylist={onOpenAddToPlaylist}
                        onCreatePlaylist={onCreatePlaylist}
                        onDeletePlaylist={onDeletePlaylist}
                        onOpenAddSongsToPlaylist={onOpenAddSongsToPlaylist}
                    />
                </TabsContent>
                <TabsContent value="grouped" className="mt-4">
                    <GroupedList groupedSongs={groupedSongs} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} currentSong={currentSong} />
                </TabsContent>
                <TabsContent value="artists" className="mt-4">
                    <ArtistList songs={songs} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} currentSong={currentSong} />
                </TabsContent>
                 <TabsContent value="albums" className="mt-4">
                    <AlbumList songs={songs} onSelectSong={onSelectSong} onEditSong={onEditSong} onOpenAddToPlaylist={onOpenAddToPlaylist} currentSong={currentSong} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
