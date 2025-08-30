'use client';

import { Song, SongGroup } from '@/types';
import { Button } from '@/components/ui/button';
import { Music, User, Library, PlayCircle, BarChartHorizontal } from 'lucide-react';

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
        <div className="space-y-4">
          {Object.keys(groupedSongs).sort().map(category => (
            <div key={category} className="space-y-2">
              <h3 className="font-headline text-lg flex items-center gap-2 text-primary">
                  <Music className="w-5 h-5"/> {category}
              </h3>
              <div className="pl-4 space-y-2">
                {Object.keys(groupedSongs[category]).sort().map(artist => (
                    <div key={`${category}-${artist}`}>
                        <h4 className="font-semibold flex items-center gap-2 text-accent">
                            <User className="w-4 h-4" /> {artist}
                        </h4>
                        <ul className="space-y-1 pt-2 pl-4">
                          {groupedSongs[category][artist].map(song => (
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
            </div>
          ))}
        </div>
      </div>
  );
}
