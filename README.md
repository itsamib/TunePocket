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

#### Environment Setup (Crucial Step)

Your development environment seems to be managed by Nix, which means standard Python installation methods (`pip`, `venv`) will not work correctly due to the `externally-managed-environment` error.

To run the Python bot, you must first ensure that Python and the required libraries are part of your environment configuration.

1.  **Locate your Nix configuration file:** Find the file named `dev.nix` or `.replit` in your project's root directory.
2.  **Add Python dependencies:** Edit this file to include the Python interpreter and the `python-telegram-bot` library. Add the following packages to the appropriate list in your configuration:
    ```nix
    pkgs.python311Full
    pkgs.python311Packages.pip
    pkgs.python311Packages.python-telegram-bot
    ```
3.  **Rebuild the environment:** Your environment should automatically rebuild after saving the file. If not, you may need to restart the development server or run a specific command for your platform.

#### Running the Bot Script

Once your environment is correctly configured, run the bot using the following command:

```bash
npm run bot:run
```
Alternatively, you can run the script directly. Start with `python3`:
```bash
python3 bot.py
```

If `python3` is not found, try `python`:
```bash
python bot.py
```

You should see a log message in the console, such as `Bot is running...`, which confirms that the bot is active and listening for messages.
