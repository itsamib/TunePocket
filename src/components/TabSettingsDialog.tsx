'use client';

import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { GripVertical } from 'lucide-react';
import type { TabConfig } from '@/types';
import { cn } from '@/lib/utils';


interface TabSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tabConfig: TabConfig[];
  onSave: (newConfig: TabConfig[]) => void;
}

export function TabSettingsDialog({
  isOpen,
  onClose,
  tabConfig,
  onSave,
}: TabSettingsDialogProps) {
  const [localTabs, setLocalTabs] = useState(tabConfig);

  useEffect(() => {
    // Sync local state when the dialog is opened with new props
    if (isOpen) {
      setLocalTabs(tabConfig);
    }
  }, [isOpen, tabConfig]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localTabs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalTabs(items);
  };

  const handleVisibilityChange = (id: string, isVisible: boolean) => {
    setLocalTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === id ? { ...tab, isVisible } : tab
      )
    );
  };

  const handleSave = () => {
    onSave(localTabs);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize Tabs</DialogTitle>
          <DialogDescription>
            Toggle visibility and drag to reorder the tabs in your library.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tabs">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {localTabs.map((tab, index) => (
                    <Draggable key={tab.id} draggableId={tab.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md border bg-background",
                            snapshot.isDragging && "bg-accent shadow-lg"
                          )}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="text-muted-foreground" />
                          </div>
                          <Checkbox
                            id={`vis-${tab.id}`}
                            checked={tab.isVisible}
                            onCheckedChange={(checked) => handleVisibilityChange(tab.id, !!checked)}
                          />
                          <label htmlFor={`vis-${tab.id}`} className="flex-grow">{tab.name}</label>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
