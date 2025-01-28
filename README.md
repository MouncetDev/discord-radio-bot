# Discord Radio Bot

A Discord bot that streams live radio stations into voice channels. Built using `discord.js` and `@discordjs/voice`, this bot allows users to play, pause, and resume online radio streams in their servers.

## Features
- 🎵 **Stream live radio** into Discord voice channels.
- ⏸️ **Play, stop, and resume** radio stations.
- 🔊 **Adjust volume** (1-20 range).
- 🔒 **Restricted access** for allowed users.
- 🔄 **Automatically follows** an authorized user into voice channels.

## Setup Instructions
### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/MouncetDev/discord-radio-bot.git
   cd discord-radio-bot
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create a `.env` file** and add your bot token:
   ```env
   TOKEN=your-bot-token-here
   ```
4. **Run the bot**
   ```bash
   node bot.js
   ```

## Commands
| Command | Description |
|---------|-------------|
| `-c` | Connects the bot to your voice channel. |
| `-p <station>` | Plays the specified radio station (e.g., `-p hitradio`). |
| `-s` | Stops the current stream. |
| `-r` | Resumes the last played station. |
| `-v <1-20>` | Sets the volume level (default: 10). |
| `-d` | Disconnects the bot from the voice channel. |

## Available Radio Stations
| Station Name | Command |
|--------------|---------|
| Hit Radio | `-p hitradio` |
| France Maghreb | `-p francemaghreb` |

## Customization
- **Add new radio stations**: Edit the `radioUrls` object in `bot.js`:
  ```js
  const radioUrls = {
    'hitradio': 'https://hitradio-maroc.ice.infomaniak.ch/hitradio-maroc-128.mp3',
    'francemaghreb': 'https://francemaghreb2.ice.infomaniak.ch/francemaghreb2-high.mp3',
    'newstation': 'https://example.com/your-stream.mp3' // Add new stations here
  };
  ```
- **Restrict bot access**: Add user IDs to `allowedUsers`:
  ```js
  const allowedUsers = new Set([
    'YOUR_USER_ID_HERE',
    'ANOTHER_USER_ID_HERE'
  ]);
  ```

## Dependencies
- [`discord.js`](https://discord.js.org/)
- [`@discordjs/voice`](https://www.npmjs.com/package/@discordjs/voice)
- [`dotenv`](https://www.npmjs.com/package/dotenv)
- [`express`](https://www.npmjs.com/package/express)

## Contributing
Feel free to open issues or submit pull requests to improve the bot.

## License
This project is licensed under the [MIT License](LICENSE).

---
Made with ❤️ by [MouncetDev]

