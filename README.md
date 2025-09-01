# TunePocket: Telegram Mini App

This is a Next.js project for a Telegram Mini App called TunePocket. It allows users to upload MP3 files through a Telegram bot and manage them in a web-based player with offline capabilities.

## How It Works

1.  **User Sends MP3:** A user sends an MP3 file to your Telegram bot.
2.  **Bot Responds:** The Python bot (`bot.py`) does *not* save the file. Instead, it gets the file's unique `file_id` from Telegram and sends a special button back to the user.
3.  **User Opens Mini App:** The user clicks the button, which opens your Next.js web application (the Mini App) inside Telegram, passing the `file_id` to it.
4.  **App Downloads & Saves:** The Mini App uses the `file_id` to download the song directly from Telegram's servers, extracts its metadata (title, artist), and saves the actual audio file into the browser's local storage (IndexedDB).
5.  **Offline Playback:** The user can now play their music from the Mini App, even without an internet connection, because the files are stored on their own device.

---

## CRITICAL: Configuration

For the app to work, you MUST configure your Bot Token in **TWO** places:

1.  **For the Web App (Next.js Server):**
    *   Open the `.env.local` file in the root of your project.
    *   Replace `YOUR_HTTP_API_TOKEN` with your actual bot token.
    *   **Example:** `TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"`
    *   This allows the web app to download files from Telegram.

2.  **For the Telegram Bot (Python Script):**
    *   Open the `bot.py` file.
    *   Replace `https://your-mini-app-url.com` with the **public URL** of your web app (e.g., your `ngrok` URL for testing).

The Python bot reads the same `.env.local` file for the token, so you only need to set the token there.

---

## Running the Application

This project has **two separate parts** that must run at the same time in **two separate terminals**.

### Terminal 1: Run the Web App (Next.js)

In your first terminal, run the following command to start the Next.js development server:

```bash
npm run dev
```

This will make the web application available, usually on `http://localhost:9002`.

### Terminal 2: Run the Telegram Bot (Python)

In your second terminal, you must run the Python script for the bot.

#### **Python Environment Setup**

Your development environment is managed by **Nix**. This means standard Python installation methods (`pip`, `venv`) will **fail**. The required Python packages (`python-telegram-bot`, `python-dotenv`) are already configured in your environment.

#### **Configure and Run the Bot Script**

1.  **Set App URL in `bot.py`:** Open the `bot.py` file and replace the placeholder value for `MINI_APP_URL` with your actual **public** web app URL.
2.  **Run the bot:** Once the environment is correctly configured, run the bot using this command:

    ```bash
    npm run bot:run
    ```

    You should see a log message confirming the bot is running. If you get an error, double-check your `.env.local` and `bot.py` configurations.

git remote add origin https://github.com/itsamib/TunePocket.git


git remote add origin 
