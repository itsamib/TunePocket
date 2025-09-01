
import logging
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# --- Configuration ---
# CRITICAL: The URL below MUST be a PUBLICLY ACCESSIBLE URL.
# Private URLs from development environments like Cloud Workstations will NOT work
# because Telegram cannot access them.
#
# FOR PRODUCTION: Replace this with your deployed web app's public URL.
# FOR LOCAL TESTING: Use a tunneling service like ngrok to create a public URL
# for your local server (e.g., http://localhost:9002) and paste the ngrok URL here.

# IMPORTANT: Replace with your actual Bot Token from BotFather. This MUST MATCH the
# token in your .env.local file.
BOT_TOKEN = "YOUR_HTTP_API_TOKEN"
# IMPORTANT: Replace with your PUBLIC Mini App URL.
MINI_APP_URL = "https://your-mini-app-url.com"
# ---------------------

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- Keyboard Layouts ---
def get_main_menu_keyboard():
    """Returns the main menu inline keyboard."""
    keyboard = [
        [InlineKeyboardButton("🎵 Open TunePocket", web_app={'url': MINI_APP_URL})],
        [
            InlineKeyboardButton("👤 My Profile", callback_data='show_profile'),
            InlineKeyboardButton("📊 Server Status", callback_data='check_status')
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

# --- Command Handlers ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends a welcome message with the main menu."""
    user = update.effective_user
    await update.message.reply_html(
        rf"Hi {user.mention_html()}! Welcome to TunePocket.",
        reply_markup=get_main_menu_keyboard()
    )

# --- Message Handlers ---
async def handle_audio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles audio files by creating a deep link to the Mini App."""
    audio_file = update.message.audio
    chat_id = update.message.chat_id
    if not audio_file:
        await update.message.reply_text("Please send an audio file (MP3).")
        return

    try:
        # The start_param is a unique value that the Mini App will receive.
        # It's used here to pass the file_id and the chat_id for sending a confirmation.
        start_param = f"{audio_file.file_id}_{chat_id}"
        app_url_with_param = f"{MINI_APP_URL}#tgWebAppStartParam={start_param}"
        
        logger.info(f"Generated Mini App URL: {app_url_with_param}")

        keyboard = [[InlineKeyboardButton("Process in TunePocket", web_app={'url': app_url_with_param})]]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            f"Ready to process '{audio_file.title or 'this song'}'. Click below to open and add to your library:",
            reply_markup=reply_markup,
        )

    except Exception as e:
        logger.error(f"Error handling audio: {e}", exc_info=True)
        await update.message.reply_text("Sorry, I couldn't process that file. Please try again.")

# --- Callback Query Handler ---
async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Parses the CallbackQuery and updates the message text."""
    query = update.callback_query
    await query.answer()  # Acknowledge the button press

    if query.data == 'show_profile':
        user = query.from_user
        profile_text = (
            f"<b>Your Telegram Profile:</b>\n\n"
            f"<b>First Name:</b> {user.first_name}\n"
            f"<b>Last Name:</b> {user.last_name or 'Not set'}\n"
            f"<b>Username:</b> @{user.username or 'Not set'}\n"
            f"<b>User ID:</b> <code>{user.id}</code>\n"
        )
        await query.edit_message_text(text=profile_text, parse_mode='HTML', reply_markup=get_main_menu_keyboard())
    
    elif query.data == 'check_status':
        status_text = "✅ Bot is running correctly!"
        await query.edit_message_text(text=status_text, reply_markup=get_main_menu_keyboard())

# --- Main Bot Function ---
def main() -> None:
    """Starts the bot and runs it until Ctrl-C is pressed."""
    # Security check to ensure placeholder values are replaced.
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
    application.add_handler(CallbackQueryHandler(handle_callback_query))

    # Start the bot
    logger.info("Bot is running...")
    application.run_polling()

if __name__ == "__main__":
    main()
