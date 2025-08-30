'use server';
/**
 * @fileOverview A song categorization AI agent.
 *
 * - categorizeSongsByGenre - A function that handles the song categorization process.
 * - CategorizeSongsByGenreInput - The input type for the categorizeSongsByGenre function.
 * - CategorizeSongsByGenreOutput - The return type for the categorizeSongsByGenre function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeSongsByGenreInputSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().describe('The artist of the song.'),
  genre: z.string().describe('The genre of the song.'),
});
export type CategorizeSongsByGenreInput = z.infer<typeof CategorizeSongsByGenreInputSchema>;

const CategorizeSongsByGenreOutputSchema = z.object({
  category: z.string().describe('The main category of the song based on the genre, e.g., Pop, Rock, Electronic.'),
  subCategory: z.string().describe('A more specific sub-category of the song based on the genre and artist, e.g., Indie Pop, Classic Rock, Deep House.'),
});
export type CategorizeSongsByGenreOutput = z.infer<typeof CategorizeSongsByGenreOutputSchema>;

export async function categorizeSongsByGenre(input: CategorizeSongsByGenreInput): Promise<CategorizeSongsByGenreOutput> {
  return categorizeSongsByGenreFlow(input);
}

const shouldSplitGenreTool = ai.defineTool({
    name: 'shouldSplitGenre',
    description: 'Determine whether a given music genre should be further split into subgenres based on the artist or other characteristics.',
    inputSchema: z.object({
        genre: z.string().describe('The primary genre of the song.'),
        artist: z.string().describe('The artist of the song.'),
    }),
    outputSchema: z.boolean().describe('True if the genre should be split into subgenres, false otherwise.'),
}, async (input) => {
    // In a real implementation, this would involve a more complex decision-making process,
    // potentially consulting a database of genres and artists.
    // For this example, we'll just return true if the artist name contains the word "Indie".
    return input.artist.includes('Indie');
});

const prompt = ai.definePrompt({
  name: 'categorizeSongsByGenrePrompt',
  input: {schema: CategorizeSongsByGenreInputSchema},
  output: {schema: CategorizeSongsByGenreOutputSchema},
  tools: [shouldSplitGenreTool],
  prompt: `You are an expert music categorization specialist.

  Based on the song title, artist, and genre, you will categorize the song into a main category and a sub-category.
  The main category should be a broad classification like Pop, Rock, Electronic, Classical, Jazz, etc.
  The sub-category should be a more specific classification based on the genre and artist.

  For example:
  * If the genre is Pop and the artist is Taylor Swift, the main category is Pop and the sub-category is Indie Pop.
  * If the genre is Rock and the artist is The Rolling Stones, the main category is Rock and the sub-category is Classic Rock.
  * If the genre is Electronic and the artist is David Guetta, the main category is Electronic and the sub-category is Dance Pop.

  Title: {{{title}}}
  Artist: {{{artist}}}
  Genre: {{{genre}}}
  
  Consider using the 'shouldSplitGenre' tool to determine if a genre should be split into subgenres based on the artist. This is especially useful for broad genres like Pop or Rock.
`,
});

const categorizeSongsByGenreFlow = ai.defineFlow(
  {
    name: 'categorizeSongsByGenreFlow',
    inputSchema: CategorizeSongsByGenreInputSchema,
    outputSchema: CategorizeSongsByGenreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
