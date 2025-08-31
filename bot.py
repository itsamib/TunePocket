
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# --- Configuration ---
# IMPORTANT: Replace with your actual Bot Token from BotFather
BOT_TOKEN = "YOUR_HTTP_API_TOKEN"
# IMPORTANT: Replace with your actual Mini App URL after deployment or during testing (e.g., ngrok URL)
MINI_APP_URL = "https://your-mini-app-url.com"
# ---------------------

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Handler for the /start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends a welcome message and a button to open the Mini App."""
    await update.message.reply_text(
        "Welcome to TunePocket! Send me an MP3 file, and I'll add it to your library.",
        reply_markup={'inline_keyboard': [[{'text': 'Open TunePocket', 'web_app': {'url': MINI_APP_URL}}]]}
    )

# Handler for audio messages (MP3 files)
async def handle_audio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles audio files by creating a deep link to the Mini App."""
    audio_file = update.message.audio
    chat_id = update.message.chat_id
    if not audio_file:
        await update.message.reply_text("Please send an audio file (MP3).")
        return

    try:
        # We create a special start_param for the Mini App. It combines the file_id
        # and the chat_id, separated by an underscore. The Mini App will parse this
        # to fetch the file and send a confirmation message back to the correct user.
        start_param = f"{audio_file.file_id}_{chat_id}"
        
        # Construct the deep link URL for the Mini App
        app_url_with_param = f"{MINI_APP_URL}#tgWebAppStartParam={start_param}"
        
        logger.info(f"Generated Mini App URL: {app_url_with_param}")

        # Create an inline keyboard button that opens the Mini App with the parameter
        keyboard = [
            [
                {
                    'text': "Process in TunePocket",
                    'web_app': {'url': app_url_with_param}
                }
            ]
        ]
        
        reply_markup = {'inline_keyboard': keyboard}

        await update.message.reply_text(
            f"Ready to process '{audio_file.title or 'this song'}'. Click below to open and add to your library:",
            reply_markup=reply_markup,
        )

    except Exception as e:
        logger.error(f"Error handling audio: {e}", exc_info=True)
        await update.message.reply_text("Sorry, I couldn't process that file. Please try again.")

def main() -> None:
    """Starts the bot and runs it until Ctrl-C is pressed."""
    if BOT_TOKEN == "YOUR_HTTP_API_TOKEN" or MINI_APP_URL == "https://your-mini-app-url.com":
        logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        logger.error("!!! BOT_TOKEN or MINI_APP_URL is not configured in bot.py !!!")
        logger.error("!!! Please edit the file and set the correct values.     !!!")
        logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return
        
    application = Application.builder().token(BOT_TOKEN).build()

    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.AUDIO, handle_audio))

    # Start the bot
    logger.info("Bot is running...")
    application.run_polling()

if __name__ == "__main__":
    main()
