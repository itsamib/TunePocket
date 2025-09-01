'use client';
import { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <UploadCloud className="text-primary"/> Add a Song
                </CardTitle>
                <CardDescription>
                    Upload an audio file from your device to add it to your TunePocket library.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="audio-file" className="sr-only">Upload Song</Label>
                    <Input id="audio-file" type="file" accept="audio/*" onChange={handleFileChange} disabled={isLoading} className="file:text-primary-foreground file:font-bold"/>
                </div>
                 <p className="text-xs text-muted-foreground mt-4">Or, send an audio file to the TunePocket bot in Telegram.</p>
            </CardContent>
        </Card>
    </div>
  );
}