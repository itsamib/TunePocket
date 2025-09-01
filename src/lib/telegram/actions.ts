'use server';
/**
 * @fileOverview A set of server actions for interacting with the Telegram Bot API.
 *
 * - getTelegramFile - Fetches a file's content and metadata from Telegram.
 * - sendTelegramMessage - Sends a text message to a specified chat ID.
 */
import { z } from 'zod';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// --- Get File Action ---

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
      throw new Error("BOT_TOKEN is not configured on the server. Please ensure TELEGRAM_BOT_TOKEN is set in your .env.local file.");
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
        console.error("Telegram getFile API error response:", { status: fileInfoResponse.status, body: errorBody });
        if (fileInfoResponse.status === 400 || fileInfoResponse.status === 401) {
             throw new Error("Telegram Bot Token is invalid. Please check the `TELEGRAM_BOT_TOKEN` in your `.env.local` file.");
        }
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
    let fileResponse;
    try {
        fileResponse = await fetch(fileUrl);
    } catch (e: any) {
        console.error("Failed to download file from Telegram servers", e);
        throw new Error(`Network error when downloading file: ${e.message}`);
    }
    
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


// --- Send Message Action ---

const SendTelegramMessageInputSchema = z.object({
  chatId: z.string().describe('The chat ID to send the message to.'),
  text: z.string().describe('The text of the message to send.'),
});
export type SendTelegramMessageInput = z.infer<
  typeof SendTelegramMessageInputSchema
>;

const SendTelegramMessageOutputSchema = z.object({
  ok: z.boolean(),
  description: z.string().optional(),
});

export async function sendTelegramMessage(
  input: SendTelegramMessageInput
): Promise<z.infer<typeof SendTelegramMessageOutputSchema>> {
  const { chatId, text } = input;
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not configured on the server. Please ensure TELEGRAM_BOT_TOKEN is set in your .env.local file.');
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Telegram sendMessage API error:', result);
      throw new Error(
        `Failed to send message: ${result.description || 'Unknown error'}`
      );
    }
    return { ok: true, description: 'Message sent successfully.' };
  } catch (error: any) {
    console.error('Error sending Telegram message:', error);
    return { ok: false, description: error.message };
  }
}
