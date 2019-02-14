# Rusty Bot

[![Greenkeeper badge](https://badges.greenkeeper.io/StevenGodin/rusty-bot.svg)](https://greenkeeper.io/)

Rust Bot (Webhook) to post Rust Blogs to Discord.

## Usage

[Node](https://nodejs.org) v8 or higher is required.

1. Clone repository & install dependencies

   ```bash
   git clone https://github.com/StevenGodin/rusty-bot.git
   cd rusty-bot
   npm install
   ```

2. Configure webhook environment variable  
   `cp .env.example .env`  
   Update `HOOK_RUSTY_BOT` in `.env` with your discord webhook.
3. Run `npm start`

### Run as a daemon

```bash
npm install --global forever
forever start index.js
```
