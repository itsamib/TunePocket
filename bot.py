
import logging
from telegram import Update, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# --- Configuration ---
BOT_TOKEN = "8317334769:AAHHl5uEcSbcvBjwXdnDXLmBuN41RMTC_w0"  # Replace with your token from BotFather
MINI_APP_URL = "https://9000-firebase-studio-1756580205727.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev"  # Replace with your deployed PWA's URL
# ---------------------

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Handler for the /start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Welcome to TunePocket! Send me an MP3 file, and I'll add it to your library.",
        reply_markup={'inline_keyboard': [[{'text': 'Open TunePocket', 'web_app': {'url': MINI_APP_URL}}]]}
    )

# Handler for audio messages
async def handle_audio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    audio_file = update.message.audio
    chat_id = update.message.chat_id
    if not audio_file:
        await update.message.reply_text("Please send an audio file (MP3).")
        return

    try:
        # We will create a special URL to open the web app with the file_id and chat_id
        # The web app will use these to fetch the file and send a confirmation message back.
        # We combine them with an underscore, e.g., "fileid_chatid"
        start_param = f"{audio_file.file_id}_{chat_id}"
        
        # Construct the deep link URL for the Mini App
        app_url_with_param = f"{MINI_APP_URL}#tgWebAppStartParam={start_param}"
        
        logger.info(f"Generated Mini App URL: {app_url_with_param}")

        # Create an inline keyboard button to open the Mini App
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
