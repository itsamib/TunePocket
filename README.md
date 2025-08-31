# TunePocket: Telegram Mini App

This is a Next.js starter project for a Telegram Mini App called TunePocket. It allows users to upload MP3 files through a Telegram bot and manage them in a web-based player.

## Running the Application

This project consists of two separate parts that must be run concurrently:

1.  **The Next.js Web App (Mini App):** This is the user interface that users interact with inside Telegram.
2.  **The Python Telegram Bot:** This is the backend script that listens for messages and file uploads sent to the bot on Telegram.

You will need **two separate terminals** to run this application.

---

### Terminal 1: Run the Web App

In your first terminal, run the following command to start the Next.js development server:

```bash
npm run dev
```

This will make the web application available, usually on `http://localhost:9002`.

---

### Terminal 2: Run the Telegram Bot

In your second terminal, you need to run the Python script for the bot.

#### **Environment Setup (Crucial Step)**

Your development environment is managed by **Nix**. This means standard Python installation methods (`pip`, `venv`, `conda`) will **not** work correctly and will result in an `externally-managed-environment` error.

To run the Python bot, you must first add the required Python packages to your environment's configuration file.

1.  **Locate your Nix configuration file:** Find the file named `dev.nix` or `.replit` in your project's root directory.

2.  **Add Python dependencies:** Edit this file to include the Python interpreter and the `python-telegram-bot` library. Add the following packages to the appropriate list (e.g., inside `dev.nix`'s `packages` or `.replit`'s `deps` list):

    ```nix
    pkgs.python311Full
    pkgs.python311Packages.pip
    pkgs.python311Packages.python-telegram-bot
    ```

3.  **Rebuild the environment:** After saving the file, your environment should automatically rebuild. If not, you may need to restart the development server or manually trigger a re-build according to your platform's documentation. This step is essential for the changes to take effect.

#### **Running the Bot Script**

Once your environment is correctly configured with the Python packages, run the bot using the following command:

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
