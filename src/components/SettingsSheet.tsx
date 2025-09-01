'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Settings, SlidersHorizontal } from 'lucide-react';
import { TabSettingsDialog } from './TabSettingsDialog';
import type { TabConfig } from '@/types';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tabConfig: TabConfig[];
  onTabConfigChange: (newConfig: TabConfig[]) => void;
}

export function SettingsSheet({
  isOpen,
  onClose,
  tabConfig,
  onTabConfigChange,
}: SettingsSheetProps) {
  const [isTabSettingsOpen, setIsTabSettingsOpen] = useState(false);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings /> Settings
            </SheetTitle>
            <SheetDescription>
              Customize your TunePocket experience.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setIsTabSettingsOpen(true);
                onClose();
              }}
            >
              <SlidersHorizontal className="mr-2" /> Tab Settings
            </Button>
            {/* Add other settings here in the future */}
          </div>
        </SheetContent>
      </Sheet>
      <TabSettingsDialog
        isOpen={isTabSettingsOpen}
        onClose={() => setIsTabSettingsOpen(false)}
        tabConfig={tabConfig}
        onSave={onTabConfigChange}
      />
    </>
  );
}
