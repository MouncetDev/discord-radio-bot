require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const app = express();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');

// Initialize the Discord client
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Command prefix and configuration
const prefix = "-";

const radioUrls = {
  'hitradio': 'https://hitradio-maroc.ice.infomaniak.ch/hitradio-maroc-128.mp3',
  'francemaghreb': 'https://francemaghreb2.ice.infomaniak.ch/francemaghreb2-high.mp3'
};

let connection = null;
let player = null;
let isPlaying = false;
let volume = 0.5;
let currentUrl = null;  // Store the current URL

// List of allowed user IDs
const allowedUsers = new Set([
  '', // Replace with actual user IDs
  '',
  ''
]);

// Set up Express server
app.get('/', (req, res) => {
  res.send('Server is up.');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

// Set up the Discord client
client.on('ready', () => {
  console.log(`${client.user.tag} is online`);
  client.user.setActivity(`${prefix}help | Radio-BOT`, { type: ActivityType.Listening }); // Set bot's activity to listening
});

// Handle voice state updates to follow the user
client.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = newState.id; // Get the user ID of the person whose state changed

  if (!allowedUsers.has(userId)) return; // Only follow allowed users

  const newChannel = newState.channel; // The new voice channel the user has joined

  if (!newChannel || !newChannel.joinable) {
    // If user left voice channel or bot can't join, disconnect the bot
    if (connection) {
      connection.destroy();
      connection = null;
    }
    return;
  }

  // Connect to the new voice channel if not already connected
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: newChannel.id,
      guildId: newChannel.guild.id,
      adapterCreator: newChannel.guild.voiceAdapterCreator,
    });
  } else if (connection.joinConfig.channelId !== newChannel.id) {
    connection.destroy(); // Disconnect from the old channel
    connection = joinVoiceChannel({
      channelId: newChannel.id,
      guildId: newChannel.guild.id,
      adapterCreator: newChannel.guild.voiceAdapterCreator,
    });
  }
});

// Handle incoming messages
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  if (!allowedUsers.has(message.author.id)) {
    return message.channel.send('You do not have permission to use this bot.');
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'c') {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.channel.send('You need to be in a voice channel to connect.');
    }

    if (connection) {
      connection.destroy(); // Disconnect from the previous channel
      connection = null;
    }

    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    message.channel.send(`Connected to ${voiceChannel.name}. Use \`${prefix}play <station>\` to start playing.`);
  } else if (command === 'p') {
    if (isPlaying) {
      return message.channel.send('The radio is already playing!');
    }

    const identifier = args[0]; // The radio station name or number
    const url = radioUrls[identifier];

    if (url) {
      if (!connection) {
        return message.channel.send('The bot is not connected to any voice channel. Use `-connect` to connect first.');
      }

      await voiceStay(url); // Play the specified radio station
      currentUrl = url;  // Store the current URL
      message.channel.send(`Started playing ${identifier}!`);
    } else {
      const availableStations = `
1: **Hit Radio**
2: **France Maghreb**
`;
      message.channel.send(`Invalid radio station name.\nAvailable stations:\n${availableStations}`);
    }
  } else if (command === 's') {
    if (!isPlaying) {
      return message.channel.send('The radio is not playing!');
    }

    if (player) {
      player.stop();
    }

    isPlaying = false;
    message.channel.send('Stopped playing!');
  } else if (command === 'resume') {
    if (isPlaying) {
      return message.channel.send('The radio is already playing!');
    }

    if (currentUrl) {
      if (!connection) {
        return message.channel.send('The bot is not connected to any voice channel. Use `-connect` to connect first.');
      }

      await voiceStay(currentUrl); // Resume playing the last played station
      message.channel.send('Resumed playback!');
    } else {
      message.channel.send('No station is currently set to resume. Use `-play <station>` to start playback.');
    }
  } else if (command === 'v') {
    const volumeArg = parseInt(args[0]);

    if (isNaN(volumeArg) || volumeArg < 1 || volumeArg > 20) {
      return message.channel.send('Please provide a volume between 1 and 20.');
    }

    volume = volumeArg / 20;
    if (player && player.state.status === AudioPlayerStatus.Playing) {
      player.state.resource.volume.setVolume(volume);
    }

    message.channel.send(`Volume set to ${volumeArg}`);
  } else if (command === 'help') {
    const helpEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Radio Bot Help')
      .setDescription('Here is a list of commands you can use with this bot:')
      .addFields(
        { name: '**-c**', value: 'Connect the bot to your current voice channel.', inline: false },
        { name: '**-p <station>**', value: 'Play the specified radio station. Available stations:\n\n1: **hitradio**\n2: **francemaghreb**\n', inline: false },
        { name: '**-s**', value: 'Stop playing the current radio stream.', inline: false },
        { name: '**-r**', value: 'Resume playback of the last played station.', inline: false },
        { name: '**-v <volume>**', value: 'Set the volume. Range: 1 to 20.', inline: false },
        { name: '**-d**', value: 'Disconnect the bot from the voice channel.', inline: false }
      )
      .setFooter({ text: 'For more info, contact the bot owner.' });

    message.channel.send({ embeds: [helpEmbed] });
  } else if (command === 'd') {
    if (!connection) {
      return message.channel.send('The bot is not connected to any voice channel.');
    }

    connection.destroy();
    connection = null;
    isPlaying = false;
    message.channel.send('Disconnected from the voice channel.');
  }
});

// Function to handle voice channel connection and playback
async function voiceStay(url) {
  if (!connection) {
    return console.error('The bot is not connected to any voice channel.');
  }

  const guild = connection.joinConfig.guildId;
  try {
    player = createAudioPlayer();

    const { default: fetch } = await import('node-fetch');
    const response = await fetch(url);
    const stream = response.body;
    const resource = createAudioResource(stream, { inlineVolume: true });

    resource.volume.setVolume(volume);
    player.play(resource);
    connection.subscribe(player);

    isPlaying = true;

    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Playback finished');
      isPlaying = false;
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      isPlaying = false;
      connection = null;
    });

  } catch (error) {
    console.error('Error connecting to voice channel or playing audio:', error);
  }
}

client.login(process.env.TOKEN);
