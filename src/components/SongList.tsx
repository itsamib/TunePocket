'use client';

import { Song, SongGroup } from '@/types';
import { Button } from '@/components/ui/button';
import { Music, User, Library, PlayCircle, BarChartHorizontal, Disc } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface SongListProps {
  groupedSongs: SongGroup;
  onSelectSong: (song: Song) => void;
  currentSong: Song | null;
}

export function SongList({ groupedSongs, onSelectSong, currentSong }: SongListProps) {
  if (Object.keys(groupedSongs).length === 0) {
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
      <Accordion type="multiple" className="w-full">
        {Object.keys(groupedSongs).sort().map(genre => (
          <AccordionItem value={genre} key={genre}>
            <AccordionTrigger className="font-headline text-lg flex items-center gap-2 text-primary hover:no-underline">
              <Music className="w-5 h-5"/> {genre}
            </AccordionTrigger>
            <AccordionContent>
              <Accordion type="multiple" className="w-full pl-4">
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
                                    <li key={song.id}>
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
    </div>
  );
}