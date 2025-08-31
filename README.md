# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running the Application

This project consists of two separate parts that must be run concurrently:

1.  **The Next.js Web App (Mini App):** This is the user interface that users interact with inside Telegram.
2.  **The Python Telegram Bot:** This is a backend script that listens for messages sent to the bot on Telegram.

You will need **two separate terminals** to run this application.

### Terminal 1: Run the Web App

In your first terminal, run the following command to start the Next.js development server:

```bash
npm run dev
```

This will make the web application available, usually on `http://localhost:9002`.

### Terminal 2: Run the Telegram Bot

In your second terminal, you need to run the Python script for the bot.

First, ensure you have the necessary Python libraries installed. The dependencies are listed in `requirements.txt`. You can install them using pip:

```bash
pip install -r requirements.txt
```

**Note:** If you are in an environment managed by a tool like Nix, you may need to configure your environment to include the dependencies from `requirements.txt` instead of using `pip` directly.

Once the dependencies are installed, run the bot using the following command:

```bash
npm run bot:run
```
Alternatively, you can run the script directly:
```bash
python3 bot.py
```

If `python3` is not found, try `python`:
```bash
python bot.py
```

You should see a log message in the console, such as `Bot is running...`, which confirms that the bot is active and listening for messages.
