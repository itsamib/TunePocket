'use client';

import type { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Loader2, Shuffle, Repeat, Repeat1, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
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
  telegramUser?: any;
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [colorPalette, setColorPalette] = useState<any>(null);
  const [showControls, setShowControls] = useState(true);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000); // Hide after 5 seconds
  }, []);

  const handleToggleControls = () => {
    setShowControls(true);
    resetControlsTimeout();
  };

  useEffect(() => {
    if (isSheetOpen) {
      handleToggleControls(); // Show controls and start timer when sheet opens
    } else if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current); // Clear timer when sheet closes
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isSheetOpen, resetControlsTimeout]);


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

      if (window.Vibrant) {
          window.Vibrant.from(url).getPalette().then((palette: any) => {
              setColorPalette(palette);
          });
      }

      return () => {
          URL.revokeObjectURL(url);
          setColorPalette(null);
      }
    }
    setArtworkUrl(null);
    setColorPalette(null);
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
    const iconColor = showControls ? colorPalette?.LightVibrant?.hex || '#FFF' : '#FFF';
    switch (repeatMode) {
      case 'one':
        return <Repeat1 style={{ color: iconColor }} />;
      case 'all':
        return <Repeat style={{ color: iconColor }} />;
      default:
        return <Repeat />;
    }
  };

  const dynamicStyles = {
    background: colorPalette 
      ? `linear-gradient(135deg, ${colorPalette.DarkMuted?.hex || '#111'}, ${colorPalette.DarkVibrant?.hex || '#000'})`
      : 'linear-gradient(135deg, #111, #000)',
    color: colorPalette?.LightVibrant?.hex || '#FFF',
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
        <div onClick={() => setIsSheetOpen(true)} className="fixed bottom-0 left-0 right-0 z-50 w-full cursor-pointer bg-background/80 backdrop-blur-md border-t">
            <div className="flex items-center gap-2 p-2">
                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                    {artworkUrl ? (
                    <Image src={artworkUrl} alt="Album art" width={48} height={48} className="rounded-md object-cover w-12 h-12"/>
                    ) : (
                    <Music className="w-6 h-6 text-muted-foreground" />
                    )}
                </div>
                <div className="truncate flex-grow mx-2">
                    <p className="font-bold font-headline truncate">{currentSong.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPrev(); }} className="h-10 w-10 shrink-0">
                    <SkipBack size={22} />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPlayPause(); }} className="h-12 w-12 shrink-0">
                    {isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </Button>
                 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onNext(); }} className="h-10 w-10 shrink-0">
                    <SkipForward size={22} />
                </Button>
            </div>
            <Progress value={progress} className="h-1 w-full rounded-none" />
        </div>
        <SheetContent 
          side="bottom" 
          className="h-screen p-0 flex flex-col border-none text-white overflow-hidden" 
          style={{background: dynamicStyles.background}}
          onClick={handleToggleControls}
        >
            <div 
              className={cn(
                "absolute inset-0 z-[-2] bg-cover bg-center transition-all duration-500",
                showControls ? 'scale-110' : 'scale-100'
              )} 
              style={{ backgroundImage: artworkUrl ? `url(${artworkUrl})` : 'none' }}
            />
            <div 
              className={cn(
                "absolute inset-0 z-[-1] bg-black/60 transition-all duration-500",
                showControls ? "backdrop-blur-sm" : "backdrop-blur-none"
              )} 
            />
          
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div 
                  className={cn(
                    "absolute top-0 left-0 right-0 p-6 transition-opacity duration-300",
                    showControls ? "opacity-100" : "opacity-0"
                  )}
                >
                    <SheetClose className="absolute right-4 top-4 z-20 rounded-full bg-black/30 p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                        <X className="h-6 w-6" style={{color: dynamicStyles.color}}/>
                        <span className="sr-only">Close</span>
                    </SheetClose>
                    <SheetHeader className="text-left shrink-0 pt-8">
                        <SheetTitle className="font-headline text-3xl" style={{color: dynamicStyles.color}}>{currentSong.title}</SheetTitle>
                        <SheetDescription style={{color: colorPalette?.LightMuted?.hex || '#CCC'}}>{currentSong.artist}</SheetDescription>
                        <p className="text-sm" style={{color: colorPalette?.Muted?.hex || '#AAA'}}>{currentSong.album}</p>
                    </SheetHeader>
                </div>
              

              <div 
                className={cn(
                  "absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center gap-4 w-full transition-opacity duration-300",
                   showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                   <div className="w-full max-w-md">
                      <Slider
                          value={[progress]}
                          onValueChange={handleSeek}
                          max={100}
                          step={1}
                          className="[&>span:first-child]:h-1"
                      />
                      <div className="flex justify-between items-center text-xs mt-2" style={{color: dynamicStyles.color}}>
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                      </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 w-full">
                      <Button variant="ghost" size="icon" onClick={onToggleShuffle} className="h-14 w-14">
                          <Shuffle style={{ color: isShuffle ? (colorPalette?.LightVibrant?.hex || '#FFF') : (colorPalette?.Muted?.hex || '#AAA') }} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={onPrev} className="h-14 w-14">
                          <SkipBack size={28} style={{ color: dynamicStyles.color }}/>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={onPlayPause} className="w-20 h-20 rounded-full border border-white/50 bg-white/10 hover:bg-white/20">
                          {isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause size={40} style={{ color: dynamicStyles.color }}/> : <Play size={40} style={{ color: dynamicStyles.color }}/>}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={onNext} className="h-14 w-14">
                          <SkipForward size={28} style={{ color: dynamicStyles.color }}/>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={onCycleRepeatMode} className="h-14 w-14">
                          {renderRepeatIcon()}
                      </Button>
                  </div>

                  <div className="flex items-center gap-2 w-full max-w-xs mx-auto shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                          {isMuted || volume === 0 ? <VolumeX style={{color: dynamicStyles.color}}/> : <Volume2 style={{color: dynamicStyles.color}}/>}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        max={1}
                        step={0.05}
                        className="[&>span:first-child]:h-1"
                      />
                  </div>
              </div>
            </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
