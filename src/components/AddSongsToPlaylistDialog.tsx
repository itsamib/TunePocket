'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import type { Song, Playlist } from '@/types';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useState, useEffect } from 'react';

interface AddSongsToPlaylistDialogProps {
  isOpen: boolean;
  playlist: Playlist | null;
  allSongs: Song[];
  onClose: () => void;
  onConfirm: (playlistId: number, songIds: number[]) => void;
}

export function AddSongsToPlaylistDialog({
  isOpen,
  playlist,
  allSongs,
  onClose,
  onConfirm,
}: AddSongsToPlaylistDialogProps) {
  const [selectedSongIds, setSelectedSongIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Reset selections when dialog is reopened
    if (isOpen) {
      setSelectedSongIds(new Set());
    }
  }, [isOpen]);

  if (!playlist) return null;

  const handleToggleSong = (songId: number) => {
    setSelectedSongIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onConfirm(playlist.id, Array.from(selectedSongIds));
    onClose();
  };

  const existingSongIds = new Set(playlist.songIds);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Songs to &quot;{playlist.name}&quot;</DialogTitle>
          <DialogDescription>
            Select songs from your library to add to this playlist.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80 border rounded-md p-4">
          <div className="space-y-4">
            {allSongs.length > 0 ? (
              allSongs.map((song) => {
                const isInPlaylist = existingSongIds.has(song.id);
                const isSelected = selectedSongIds.has(song.id);
                return (
                  <div key={song.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`song-${song.id}`}
                      checked={isSelected || isInPlaylist}
                      disabled={isInPlaylist}
                      onCheckedChange={() => handleToggleSong(song.id)}
                    />
                    <Label
                      htmlFor={`song-${song.id}`}
                      className={`flex-grow ${
                        isInPlaylist ? 'text-muted-foreground' : ''
                      }`}
                    >
                      <div className="font-semibold">{song.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {song.artist} &middot; {song.album}
                      </div>
                    </Label>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Your library is empty.
              </p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedSongIds.size === 0}>
            Add {selectedSongIds.size > 0 ? selectedSongIds.size : ''} Song(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
