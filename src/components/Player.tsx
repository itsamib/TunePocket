'use client';

import type { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Loader2, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'none' | 'one' | 'all';
  onCycleRepeatMode: () => void;
  telegramUser?: any; // Keep this optional as it might not be available
}

export default function Player({ 
    currentSong, 
    isPlaying, 
    onPlayPause, 
    onNext, 
    onPrev, 
    isLoading, 
    isShuffle,
    onToggleShuffle,
    repeatMode,
    onCycleRepeatMode,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (currentSong?.artwork) {
      const { data, format } = currentSong.artwork;
      const blob = new Blob([data], { type: format });
      const url = URL.createObjectURL(blob);
      setArtworkUrl(url);

      return () => URL.revokeObjectURL(url);
    }
    setArtworkUrl(null);
  }, [currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(newProgress);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && currentSong) {
      const newTime = (value[0] / 100) * currentSong.duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) setIsMuted(false);
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentTime = audioRef.current?.currentTime ?? 0;
  const duration = currentSong?.duration ?? 0;

  const renderRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat1 className="text-primary" />;
      case 'all':
        return <Repeat className="text-primary" />;
      default:
        return <Repeat />;
    }
  };

  if (!currentSong) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.localURL}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={() => {
            if (audioRef.current && isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback failed on new song", e))
            }
        }}
        onEnded={onNext}
        loop={repeatMode === 'one'}
      />
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
            <div className="fixed bottom-0 left-0 right-0 z-50 w-full cursor-pointer bg-background/80 backdrop-blur-md border-t">
                <div className="flex items-center gap-4 p-2">
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                        {artworkUrl ? (
                        <Image src={artworkUrl} alt="Album art" width={48} height={48} className="rounded-md object-cover w-12 h-12"/>
                        ) : (
                        <Music className="w-6 h-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="truncate flex-grow">
                        <p className="font-bold font-headline truncate">{currentSong.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPlayPause(); }} className="h-12 w-12 shrink-0">
                        {isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause size={28} /> : <Play size={28} />}
                    </Button>
                </div>
                <Progress value={progress} className="h-1 w-full rounded-none" />
            </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] p-4 flex flex-col border-none bg-gradient-to-b from-primary/20 via-background to-background">
          <SheetHeader>
              <SheetTitle className="sr-only">Now Playing: {currentSong.title}</SheetTitle>
              <SheetDescription className="sr-only">Music player controls and details for the current song.</SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center flex-grow gap-4">
              <div className="w-full max-w-xs aspect-square bg-muted rounded-lg shadow-2xl">
                  {artworkUrl ? (
                      <Image src={artworkUrl} alt="Album art" width={400} height={400} className="rounded-lg object-cover w-full h-full"/>
                  ) : (
                      <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-24 h-24 text-muted-foreground" />
                      </div>
                  )}
              </div>
              <div className="text-center w-full truncate mt-4">
                  <h2 className="text-2xl font-headline font-bold truncate">{currentSong.title}</h2>
                  <p className="text-lg text-muted-foreground truncate">{currentSong.artist}</p>
                  <p className="text-sm text-muted-foreground truncate">{currentSong.album}</p>
              </div>
              
              <div className="w-full max-w-md">
                  <Slider
                      value={[progress]}
                      onValueChange={handleSeek}
                      max={100}
                      step={1}
                  />
                  <div className="flex justify-between items-center text-xs mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                  </div>
              </div>

              <div className="flex items-center justify-center gap-2 w-full">
                  <Button variant="ghost" size="icon" onClick={onToggleShuffle} className={cn('h-14 w-14', isShuffle && 'text-primary')}>
                      <Shuffle />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onPrev} className="h-14 w-14">
                      <SkipBack />
                  </Button>
                  <Button variant="default" size="icon" onClick={onPlayPause} className="w-20 h-20 rounded-full shadow-lg">
                      {isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause size={32}/> : <Play size={32} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onNext} className="h-14 w-14">
                      <SkipForward />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onCycleRepeatMode} className="h-14 w-14">
                      {renderRepeatIcon()}
                  </Button>
              </div>
          </div>

          <div className="flex items-center gap-2 w-full max-w-xs mx-auto shrink-0 pb-4">
              <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
              </Button>
              <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.05}
              />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
