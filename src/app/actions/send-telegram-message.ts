/**
 * @fileOverview A flow for sending a message to a user via a Telegram bot.
 *
 * - sendTelegramMessage - A function that sends a text message to a specified chat ID.
 * - SendTelegramMessageInput - The input type for the sendTelegramMessage function.
 */
'use server';

import { z } from 'zod';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn(
    'TELEGRAM_BOT_TOKEN environment variable not set. Telegram features will fail.'
  );
}

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
  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_HTTP_API_TOKEN") {
    throw new Error('Telegram Bot Token is not configured on the server. Please set the TELEGRAM_BOT_TOKEN environment variable.');
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
