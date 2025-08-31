import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GEMINI_API_KEY) {
    console.error(`
        !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        !!! GEMINI_API_KEY is not configured in the .env file.      !!!
        !!!                                                         !!!
        !!! Please obtain an API key from Google AI Studio and add  !!!
        !!! it to your .env file to enable AI features.             !!!
        !!! https://aistudio.google.com/app/apikey                  !!!
        !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    `);
}


export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
