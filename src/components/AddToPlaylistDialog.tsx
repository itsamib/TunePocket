
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
import { ListMusic } from 'lucide-react';

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  song: Song | null;
  playlists: Playlist[];
  onClose: () => void;
  onSelectPlaylist: (playlistId: number) => void;
}

export function AddToPlaylistDialog({
  isOpen,
  song,
  playlists,
  onClose,
  onSelectPlaylist,
}: AddToPlaylistDialogProps) {
  if (!song) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>
            Select a playlist to add &quot;{song.title}&quot; to.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-60">
          <div className="space-y-2 pr-4">
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Button
                  key={playlist.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onSelectPlaylist(playlist.id);
                    onClose();
                  }}
                >
                  <ListMusic className="mr-2 h-4 w-4" />
                  {playlist.name}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No playlists found. Create one from the Playlists tab.
              </p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
