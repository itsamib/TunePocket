
import logging
import os
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# --- Configuration ---
# CRITICAL: The URL below MUST be a PUBLICLY ACCESSIBLE URL for your Next.js app.
# Private URLs from development environments will NOT work.
#
# FOR PRODUCTION: Replace this with your deployed web app's public URL.
# FOR LOCAL TESTING: Use a tunneling service like ngrok to create a public URL
# for your local server (e.g., http://localhost:9002) and paste the ngrok URL here.

# IMPORTANT: Replace with your actual Bot Token from BotFather. This MUST MATCH the
# token in your .nv.local file.
BOT_TOKEN = "8317334769:AAG1uFkrsdXwoyAyYH0YgL189eeWOcal4d8"
# IMPORTANT: Replace with your PUBLIC Mini App URL.
MINI_APP_URL = "https://9000-firebase-studio-1756580205727.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev"

# In-memory storage for the last 5 added songs (for demonstration purposes)
# In a production scenario, you'd use a database.
last_added_songs = []
# ---------------------

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- Helper Functions ---
def add_song_to_recents(song_title):
    """Adds a song to the in-memory list of recent songs."""
    if len(last_added_songs) >= 5:
        last_added_songs.pop(0)
    last_added_songs.append(song_title)

# --- Keyboard Layouts ---
def get_main_menu_keyboard():
    """Returns the main menu inline keyboard."""
    keyboard = [
        [InlineKeyboardButton("🎵 Open TunePocket", web_app={'url': MINI_APP_URL})],
        [
            InlineKeyboardButton("👤 My Profile", callback_data='show_profile'),
            InlineKeyboardButton("🎶 My Last 5 Songs", callback_data='show_recents')
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

# --- Command Handlers ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends a welcome message with the main menu."""
    user = update.effective_user
    await update.message.reply_html(
        rf"Hi {user.mention_html()}! Welcome to TunePocket. Send me an MP3 file to add it to your library.",
        reply_markup=get_main_menu_keyboard()
    )

# --- Message Handlers ---
async def handle_audio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handles audio files by automatically processing them.
    The Mini App will need to be reloaded to see the new song.
    """
    audio_file = update.message.audio
    if not audio_file:
        await update.message.reply_text("Please send an audio file (MP3).")
        return

    chat_id = update.message.chat_id
    song_title = audio_file.title or "Untitled Song"
    processing_message = await update.message.reply_text(f"Processing '{song_title}'... Please wait.")

    try:
        # Step 1: Get file path from Telegram
        file_info_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getFile?file_id={audio_file.file_id}"
        file_info_response = requests.get(file_info_url)
        file_info_response.raise_for_status()
        file_path = file_info_response.json()["result"]["file_path"]

        # Step 2: Download the file content
        file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        file_response = requests.get(file_url)
        file_response.raise_for_status()
        
        # The file content is in file_response.content
        # In a real app, you would send this content to your backend to be processed and stored.
        # For this PWA architecture, the user reloads the app and the app itself handles local storage.
        # This bot's primary job is to acknowledge the receipt.
        
        # We simulate a processing delay
        import time
        time.sleep(2) 
        
        add_song_to_recents(song_title)

        await processing_message.edit_text(
            f"✅ '{song_title}' has been added!\n\n"
            f"Please open or reload TunePocket to see it in your library.",
            reply_markup=get_main_menu_keyboard()
        )

    except Exception as e:
        logger.error(f"Error handling audio: {e}", exc_info=True)
        await processing_message.edit_text(
            "Sorry, I couldn't process that file. Please try again."
        )

# --- Callback Query Handler ---
async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Parses the CallbackQuery and updates the message text."""
    query = update.callback_query
    await query.answer()

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
    
    elif query.data == 'show_recents':
        if not last_added_songs:
            recents_text = "You haven't added any songs recently."
        else:
            songs_list = "\n".join([f"• {title}" for title in last_added_songs])
            recents_text = f"<b>Your last 5 added songs:</b>\n\n{songs_list}"
        
        await query.edit_message_text(text=recents_text, parse_mode='HTML', reply_markup=get_main_menu_keyboard())


# --- Main Bot Function ---
def main() -> None:
    """Starts the bot and runs it until Ctrl-C is pressed."""
    if BOT_TOKEN == "YOUR_HTTP_API_TOKEN" or MINI_APP_URL == "https://your-mini-app-url.com":
        logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        logger.error("!!! BOT_TOKEN or MINI_APP_URL is not configured in bot.py !!!")
        logger.error("!!! Please edit the file and set the correct values.     !!!")
        logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return
        
    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.AUDIO, handle_audio))
    application.add_handler(CallbackQueryHandler(handle_callback_query))

    logger.info("Bot is running...")
    application.run_polling()

if __name__ == "__main__":
    main()
