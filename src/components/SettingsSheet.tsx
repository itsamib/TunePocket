'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Settings, SlidersHorizontal } from 'lucide-react';
import type { TabConfig } from '@/types';

// Dynamically import TabSettingsDialog with SSR disabled
const TabSettingsDialog = dynamic(
  () => import('./TabSettingsDialog').then((mod) => mod.TabSettingsDialog),
  { ssr: false }
);


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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


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
      
      {/* This component will only be rendered on the client side after mounting */}
      {hasMounted && (
        <TabSettingsDialog
          isOpen={isTabSettingsOpen}
          onClose={() => setIsTabSettingsOpen(false)}
          tabConfig={tabConfig}
          onSave={onTabConfigChange}
        />
      )}
    </>
  );
}
