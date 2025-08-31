'use server';
/**
 * @fileOverview A flow for securely fetching a file from Telegram.
 *
 * - getTelegramFile - A function that fetches a file's content and metadata from Telegram.
 * - GetTelegramFileInput - The input type for the getTelegramFile function.
 * - GetTelegramFileOutput - The output type for the getTelegramFile function.
 */
import { z } from 'zod';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const GetTelegramFileInputSchema = z.object({
  fileId: z.string().describe("The file_id provided by Telegram."),
});
export type GetTelegramFileInput = z.infer<typeof GetTelegramFileInputSchema>;

const GetTelegramFileOutputSchema = z.object({
    fileBuffer: z.string().describe("The base64 encoded file content."),
    contentType: z.string().describe("The MIME type of the file."),
    fileName: z.string().describe("The original name of the file."),
});
export type GetTelegramFileOutput = z.infer<typeof GetTelegramFileOutputSchema>;

export async function getTelegramFile(input: GetTelegramFileInput): Promise<GetTelegramFileOutput> {
    const { fileId } = input;
    if (!BOT_TOKEN) {
      throw new Error("Telegram Bot Token is not configured on the server. Please set the TELEGRAM_BOT_TOKEN environment variable.");
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
    
    if (!fileInfoResponse.ok) {
        const errorBody = await fileInfoResponse.text();
        console.error("Telegram getFile API error response:", errorBody);
        throw new Error(`Failed to get file info from Telegram, status: ${fileInfoResponse.status}`);
    }
    
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
        console.error("Telegram getFile API error or file_path missing:", fileInfo);
        throw new Error(`Failed to get file info from Telegram: ${fileInfo.description || 'File path not available.'}`);
    }
    
    const filePath = fileInfo.result.file_path;
    
    // 2. Construct the file download URL
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    
    // 3. Fetch the file content
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok || !fileResponse.body) {
        const errorBody = await fileResponse.text();
        console.error("Failed to download file from Telegram servers. Status:", fileResponse.status, "Body:", errorBody);
        throw new Error(`Failed to download the file from Telegram servers. Status: ${fileResponse.status}`);
    }

    // 4. Convert to ArrayBuffer, then to base64 string (which is serializable)
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    
    const contentType = fileResponse.headers.get('Content-Type') || 'application/octet-stream';
    const fileName = filePath.split('/').pop() || 'song.mp3';

    // 5. Return a plain object
    return {
        fileBuffer: base64String,
        contentType: contentType,
        fileName: fileName,
    };
}
