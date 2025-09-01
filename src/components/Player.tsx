'use client';

import type { Song } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Loader2, Wifi, WifiOff, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  telegramUser: any;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'none' | 'one' | 'all';
  onCycleRepeatMode: () => void;
}

export default function Player({ 
    currentSong, 
    isPlaying, 
    onPlayPause, 
    onNext, 
    onPrev, 
    isLoading, 
    telegramUser,
    isShuffle,
    onToggleShuffle,
    repeatMode,
    onCycleRepeatMode
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);

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

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong?.localURL}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={() => {
            if (audioRef.current && isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback failed on new song", e))
            }
        }}
        onEnded={onNext}
        loop={repeatMode === 'one'}
      />
      <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg rounded-b-none border-t border-x-0 border-b-0 shadow-2xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
             <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
              {artworkUrl ? (
                <Image src={artworkUrl} alt="Album art" width={64} height={64} className="rounded-md object-cover w-16 h-16"/>
              ) : (
                <Music className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="truncate">
              <p className="font-bold font-headline truncate">{currentSong?.title ?? 'No song selected'}</p>
              <p className="text-sm text-muted-foreground truncate">{currentSong?.artist ?? 'Select a song to play'}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 flex-grow">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={onToggleShuffle} className={cn(isShuffle && 'text-primary')}>
                <Shuffle />
              </Button>
              <Button variant="ghost" size="icon" onClick={onPrev} disabled={!currentSong}>
                <SkipBack />
              </Button>
              <Button variant="default" size="icon" onClick={onPlayPause} disabled={!currentSong} className="w-12 h-12">
                {isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause /> : <Play />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onNext} disabled={!currentSong}>
                <SkipForward />
              </Button>
              <Button variant="ghost" size="icon" onClick={onCycleRepeatMode}>
                {renderRepeatIcon()}
              </Button>
            </div>
            <div className="w-full flex items-center gap-2 text-xs max-w-xs">
              <span>{formatTime(currentTime)}</span>
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={1}
                disabled={!currentSong}
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
             <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                </Button>
                <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.05}
                className="w-24"
                />
            </div>
            <div className="truncate">
             {telegramUser ? (
                <Badge variant="secondary" className="flex items-center gap-1.5">
                    <Wifi className="text-green-500 w-4 h-4" />
                    <span className="truncate">
                        {telegramUser.username ? `@${telegramUser.username}` : telegramUser.first_name}
                    </span>
                </Badge>
            ): (
                <Badge variant="destructive" className="flex items-center gap-1.5">
                    <WifiOff className="w-4 h-4" />
                    Offline
                </Badge>
            )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
