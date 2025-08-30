'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-songs-by-genre.ts';
import '@/ai/flows/get-telegram-file.ts';
import '@/ai/flows/send-telegram-message.ts';
