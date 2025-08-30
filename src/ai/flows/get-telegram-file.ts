'use server';
/**
 * @fileOverview A flow for securely fetching a file from Telegram.
 *
 * - getTelegramFile - A function that fetches a file's temporary URL from Telegram and streams it back.
 * - GetTelegramFileInput - The input type for the getTelegramFile function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN environment variable not set. Telegram file fetching will fail.");
}

const GetTelegramFileInputSchema = z.object({
  fileId: z.string().describe("The file_id provided by Telegram."),
});

export type GetTelegramFileInput = z.infer<typeof GetTelegramFileInputSchema>;

// We don't define an output schema because we will return a Response object directly.
export async function getTelegramFile(input: GetTelegramFileInput): Promise<Response> {
    return getTelegramFileFlow(input);
}

const getTelegramFileFlow = ai.defineFlow(
  {
    name: 'getTelegramFileFlow',
    inputSchema: GetTelegramFileInputSchema,
    // No output schema needed as we are returning a raw Response
  },
  async ({ fileId }) => {
    if (!BOT_TOKEN) {
      throw new Error("Telegram Bot Token is not configured on the server.");
    }
    
    // 1. Get the file path from Telegram
    const fileInfoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
    let fileInfoResponse;
    try {
        fileInfoResponse = await fetch(fileInfoUrl);
    } catch (e: any) {
        console.error("Failed to fetch file info from Telegram API", e);
        throw new Error(`Network error when calling Telegram getFile API: ${e.message}`);
    }
    
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfoResponse.ok || !fileInfo.ok) {
        console.error("Telegram getFile API error:", fileInfo);
        throw new Error(`Failed to get file info from Telegram: ${fileInfo.description || 'Unknown error'}`);
    }
    
    const filePath = fileInfo.result.file_path;
    
    // 2. Construct the file download URL
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    
    // 3. Fetch the file and stream it back to the client
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok || !fileResponse.body) {
        const errorBody = await fileResponse.text();
        console.error("Failed to download file from Telegram servers. Status:", fileResponse.status, "Body:", errorBody);
        throw new Error(`Failed to download the file from Telegram servers. Status: ${fileResponse.status}`);
    }

    // Create a new response with the file's body and headers
    const headers = new Headers();
    const contentType = fileResponse.headers.get('Content-Type') || 'application/octet-stream';
    const fileName = filePath.split('/').pop() || 'song.mp3';

    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return new Response(fileResponse.body, {
        status: 200,
        headers,
    });
  }
);
