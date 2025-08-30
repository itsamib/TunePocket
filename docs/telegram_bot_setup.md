# TunePocket Telegram Bot Setup

This guide explains how to create a Telegram bot, enable its Web App (Mini App) functionality, and provides a sample Python script to handle audio file uploads and launch the TunePocket PWA.

## 1. Create a Telegram Bot with BotFather

1.  **Open Telegram** and search for the `BotFather` bot (it has a verified checkmark).
2.  Start a chat with `BotFather` and send the `/newbot` command.
3.  Follow the prompts:
    *   Choose a name for your bot (e.g., "TunePocket Bot").
    *   Choose a username for your bot, which must end in `bot` (e.g., `MyTunePocket_bot`).
4.  `BotFather` will provide you with an **HTTP API token**. **Save this token securely.** You'll need it for the Python script.

## 2. Set up the Mini App (Web App)

1.  Send the `/mybots` command to `BotFather` and select your newly created bot.
2.  Go to **Bot Settings** -> **Menu Button**.
3.  Select **Configure Menu Button**.
4.  Enter the **URL of your deployed PWA**. For local testing, you can use a tool like `ngrok` to expose your local server. For production, this will be your static hosting URL (e.g., from Vercel or GitHub Pages).
5.  Set the **text for the menu button** (e.g., "Open TunePocket").
6.  A confirmation message will appear. Now, your bot has a menu button that launches your web app.

## 3. Enable `start_param` for Deep Linking

When a user sends a file, we want the bot to open the app with a link to that file. This is done via a deep link using the `start_param`.

1.  Send `/mybots` to `BotFather` again and select your bot.
2.  Go to **Bot Settings** -> **Inline Mode**.
3.  Click **Turn on**. This allows the bot to be used in any chat and is often a prerequisite for more advanced Web App interactions. (While not strictly necessary for our file-sending flow, it's good practice).
4.  The bot logic itself will construct the URL with the `start_param`.

## 4. Sample Python Bot Script

This script uses the `python-telegram-bot` library to handle incoming audio files.

**Prerequisites:**

Install the library:
```bash
pip install python-telegram-bot --pre
```

**`bot.py` Code:**

```python
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# --- Configuration ---
BOT_TOKEN = "YOUR_HTTP_API_TOKEN"  # Replace with your token from BotFather
MINI_APP_URL = "https://your-pwa-url.com"  # Replace with your deployed PWA's URL
# ---------------------

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Handler for the /start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Welcome to TunePocket! Send me an MP3 file, and I'll add it to your library."
    )

# Handler for audio messages
async def handle_audio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    audio_file = update.message.audio
    if not audio_file:
        await update.message.reply_text("Please send an audio file (MP3).")
        return

    try:
        # Get the file object from Telegram
        file = await context.bot.get_file(audio_file.file_id)
        file_path = file.file_path  # This is the download link

        # Construct the deep link URL for the Mini App
        # The file_path is already a full URL
        app_url_with_param = f"{MINI_APP_URL}?start_param={file_path}"
        
        logger.info(f"Generated Mini App URL: {app_url_with_param}")

        # Create an inline keyboard button to open the Mini App
        keyboard = [
            [
                InlineKeyboardButton(
                    "Open in TunePocket & Process Song",
                    web_app={"url": app_url_with_param}
                )
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            f"Ready to process '{audio_file.title or 'this song'}'. Click below to open your library:",
            reply_markup=reply_markup,
        )

    except Exception as e:
        logger.error(f"Error handling audio: {e}")
        await update.message.reply_text("Sorry, I couldn't process that file. Please try again.")

def main() -> None:
    """Start the bot."""
    application = Application.builder().token(BOT_TOKEN).build()

    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.AUDIO, handle_audio))

    # Run the bot until the user presses Ctrl-C
    logger.info("Bot is running...")
    application.run_polling()

if __name__ == "__main__":
    main()

```

### How to Run the Bot

1.  Replace `YOUR_HTTP_API_TOKEN` and `https://your-pwa-url.com` in the `bot.py` script.
2.  Run the script from your terminal: `python bot.py`.
3.  Go to Telegram, find your bot, and send it an MP3 file. It should reply with a button that opens your PWA and passes the file's download link.

## 5. Testing and Deployment

*   **Local Testing**:
    1.  Run your Next.js app locally (`npm run dev`).
    2.  Use `ngrok` to create a public HTTPS URL for your local server: `ngrok http 9002`.
    3.  Update the `MINI_APP_URL` in your Python script and the Menu Button URL in `BotFather` with the `ngrok` URL.
    4.  Restart your Python bot. You can now test the full flow.
*   **Deployment**:
    1.  Deploy your Next.js PWA to a static host like Vercel or Netlify.
    2.  Update the `MINI_APP_URL` in your bot script and `BotFather` settings to the final production URL.
    3.  Deploy your Python bot to a server (e.g., Heroku, a VPS, or a serverless function) so it runs continuously.
