'use client';

import { useMemo, useState } from 'react';
import type { Song, SongGroup } from '@/types';
import { Button } from '@/components/ui/button';
import { Music, User, Library, PlayCircle, BarChartHorizontal, Disc, Pencil, ListMusic, Columns3 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from './ui/scroll-area';


interface SongListProps {
  songs: Song[];
  groupedSongs: SongGroup;
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
  currentSong: Song | null;
}

const SongListItem = ({ song, currentSong, onSelectSong, onEditSong }: { song: Song; currentSong: Song | null; onSelectSong: (song: Song) => void; onEditSong: (song: Song) => void; }) => (
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
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onEditSong(song)}>
            <Pencil className="w-4 h-4 text-muted-foreground"/>
        </Button>
    </li>
);

const ArtistList = ({ songs, onSelectSong, onEditSong, currentSong }: SongListProps) => {
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
                                <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} />
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

const AlbumList = ({ songs, onSelectSong, onEditSong, currentSong }: SongListProps) => {
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
                                <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} />
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

const GroupedList = ({ groupedSongs, onSelectSong, onEditSong, currentSong }: Omit<SongListProps, 'songs'>) => (
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
                                                         <li key={song.id} className="flex items-center gap-2">
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
                                                                <span className="truncate">{song.title}</span>
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onEditSong(song)}>
                                                                <Pencil className="w-4 h-4 text-muted-foreground"/>
                                                            </Button>
                                                        </li>
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


export function SongList({ songs, groupedSongs, onSelectSong, onEditSong, currentSong }: SongListProps) {
  
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
            
            <Tabs defaultValue="grouped" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="grouped"><Columns3 className="w-4 h-4 mr-2"/>Grouped</TabsTrigger>
                    <TabsTrigger value="songs"><ListMusic className="w-4 h-4 mr-2"/>Songs</TabsTrigger>
                    <TabsTrigger value="artists"><User className="w-4 h-4 mr-2"/>Artists</TabsTrigger>
                    <TabsTrigger value="albums"><Disc className="w-4 h-4 mr-2"/>Albums</TabsTrigger>
                </TabsList>
                <TabsContent value="grouped" className="mt-4">
                    <GroupedList groupedSongs={groupedSongs} onSelectSong={onSelectSong} onEditSong={onEditSong} currentSong={currentSong} />
                </TabsContent>
                <TabsContent value="songs" className="mt-4">
                     <ul className="space-y-1">
                        {songs.map(song => (
                           <SongListItem key={song.id} song={song} currentSong={currentSong} onSelectSong={onSelectSong} onEditSong={onEditSong} />
                        ))}
                    </ul>
                </TabsContent>
                <TabsContent value="artists" className="mt-4">
                    <ArtistList songs={songs} groupedSongs={groupedSongs} onSelectSong={onSelectSong} onEditSong={onEditSong} currentSong={currentSong} />
                </TabsContent>
                 <TabsContent value="albums" className="mt-4">
                    <AlbumList songs={songs} groupedSongs={groupedSongs} onSelectSong={onSelectSong} onEditSong={onEditSong} currentSong={currentSong} />
                </TabsContent>
            </Tabs>
        </div>
    );
}