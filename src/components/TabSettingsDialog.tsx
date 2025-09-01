'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortableItem({ tab, onVisibilityChange }: { tab: TabConfig, onVisibilityChange: (id: string, visible: boolean) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: tab.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 p-2 rounded-md border bg-background",
                isDragging && "bg-accent shadow-lg"
            )}
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
                <GripVertical className="text-muted-foreground" />
            </div>
            <Checkbox
                id={`vis-${tab.id}`}
                checked={tab.isVisible}
                onCheckedChange={(checked) => onVisibilityChange(tab.id, !!checked)}
            />
            <label htmlFor={`vis-${tab.id}`} className="flex-grow">{tab.name}</label>
        </div>
    );
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    
    if (active.id !== over?.id) {
      setLocalTabs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over!.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={localTabs}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {localTabs.map(tab => (
                            <SortableItem key={tab.id} tab={tab} onVisibilityChange={handleVisibilityChange} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
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
