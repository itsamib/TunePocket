# **App Name**: TunePocket

## Core Features:

- Telegram Integration: Connects to Telegram Bot to receive audio file links passed via `start_param`.
- Local File Upload: Allows users to upload audio files directly from their device as an alternative to using Telegram.
- Metadata Extraction: Extracts song metadata (title, artist, genre) from uploaded MP3 files.
- Song Categorization: Automatically categorizes songs by genre and artist, and saves songs to local storage. Employs a tool to assist in determining if a genre should be split.
- Offline Storage: Saves song data and audio files in IndexedDB for offline access.
- Music Player: Provides an audio player with controls for playback, pause, next/previous, volume, and seek.
- PWA Installation: Makes the app installable as a PWA with offline support.

## Style Guidelines:

- Primary color: A vibrant purple (#A020F0) to create a sense of creativity and musicality.
- Background color: A desaturated, dark purple (#200830) for a sophisticated and immersive experience, appropriate to the dark color scheme implied by Telegram.
- Accent color: A lively pink (#F020A0), adding vibrancy and drawing attention to key controls and elements.
- Font pairing: 'Belleza' (sans-serif) for headlines, matched with 'Alegreya' (serif) for body text. 'Belleza' imparts a personalized touch suitable to artistic expression, while 'Alegreya' ensures readability for any song descriptions or interface text.
- Use clean and modern icons from a minimalist set.
- A clear and responsive layout for easy navigation on different devices.
- Smooth transitions and subtle animations to enhance user experience.