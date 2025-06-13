import 'dotenv/config';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes
} from 'discord.js';
import { DefaultExtractors } from '@discord-player/extractor';
import { Player, useMainPlayer } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import fs from 'fs';
import path from 'path';

// Functions
import { contentCheck } from './functions/contentCheck.js';
import { voiceStateChange } from './functions/voiceStateChange.js';

const appToken = process.env.DISCORD_TOKEN;
const appId = process.env.APP_ID;
const publicKey = process.env.PUBLIC_KEY;
const clientId = process.env.CLIENT_ID;
const notificationPrefix = process.env.NOTIFICATION_PREFIX;
const oauthTokens = process.env.YOUTUBE_TOKEN;
const innertubeCookies = process.env.INNERTUBE_COOKIE;
const _dirname = new URL(import.meta.url).pathname.slice(1);

const channelsWithActiveUsers = [];

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User]
});
const rest = new REST().setToken(appToken);

const commandsForRegistration = [];

bot.once(Events.ClientReady, client =>
  console.log(`Logged in as ${client.user.tag}.`)
);

bot.once('reconnecting', () => {
  console.log('Reconnecting...');
});

bot.once('disconnect', () => {
  console.log('Disconnect...');
});

bot.commands = new Collection();

const foldersPath = path.join(_dirname, '..', 'commands');
const commandFolders = fs.readdirSync(path.join(foldersPath, 'commands'));
const messageFolders = fs.readdirSync(path.join(foldersPath, 'messages'));

// Create Command References
for (let folder of commandFolders) {
  const commandPath = path.join(foldersPath, 'commands', folder);
  const commandFiles = fs
    .readdirSync(commandPath)
    .filter(file => path.extname(file) == '.js');
  for (let file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const { default: command } = await import('file://' + filePath);
    if (command.data && command.execute) {
      bot.commands.set(command.data.name, command);
      commandsForRegistration.push(command.data.toJSON());
    } else {
      console.log(
        `${notificationPrefix} Warning: the command at ${filePath} is missing a required 'data' or 'execute' property.`
      );
    }
  }
}

// Create Message References
for (let folder of messageFolders) {
  const commandPath = path.join(foldersPath, 'messages', folder);
  const commandFiles = fs
    .readdirSync(commandPath)
    .filter(file => path.extname(file) == '.js');
  for (let file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const { default: command } = await import('file://' + filePath);
    if (command.data && command.execute) {
      bot.commands.set(command.data.name, command);
    } else {
      console.log(
        `${notificationPrefix} Warning: the command at ${filePath} is missing a required 'data' or 'execute' property.`
      );
    }
  }
}

// Register Slash Commands
await rest.put(Routes.applicationCommands(clientId), {
  body: commandsForRegistration
});

// Player Configuration
const player = new Player(bot);
await player.extractors.register(YoutubeiExtractor, {
  // authentication: oauthTokens,
  // generateWithPoToken: true,
  // streamOptions: { useClient: 'WEB' },
  overrideBridgeMode: 'ytmusic'
  // cookie: innertubeCookies
});
await player.extractors.loadMulti(DefaultExtractors);

player.events.on('error', (queue, err) => {
  console.log(
    `${notificationPrefix} Error: '${err.message}' from the queue on '${queue.guild.error}'.`
  );
});

player.events.on('playerError', (queue, err) => {
  console.log(
    `${notificationPrefix} Error: '${err.message}' from connexion on '${queue.guild.error}'.`
  );
});

player.events.on('playerStart', (queue, track) => {
  queue.metadata.channel.send(
    `${notificationPrefix} Notification: started playing '${track.title}'.`
  );
});

player.events.on('audioTracksAdd', (queue, track) => {
  queue.metadata.channel.send(
    `${notificationPrefix} Notification: '${track.title}' added to the queue.`
  );
});

player.events.on('disconnect', queue => {
  queue.metadata.channel.send(
    `${notificationPrefix} Notification: Disconnecting...`
  );
});

player.events.on('emptyChannel', queue => {
  queue.metadata.channel.send(
    `${notificationPrefix} Notification: Leaving the empty voice channel...`
  );
});

player.events.on('emptyQueue', queue => {
  queue.metadata.channel.send(
    `${notificationPrefix} Notification: Queue finished. Disconnecting...`
  );
});

// On Command
bot.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.log(
      `${notificationPrefix} Error: no matching commands for ${interaction.commandName} were found.`
    );
    return;
  }

  try {
    await command.execute(interaction, player);
  } catch (err) {
    interaction.reply(
      `${notificationPrefix} Error: there was an error processing this command.`
    );
    console.log(err);
  }
});

// On Message Sent
bot.on('messageCreate', async message => {
  if (message.author.bot || message.content.startsWith('/')) return;

  // Contents Check
  if (contentCheck(message.content, message)) return;
});

// On Voice State Change
bot.on('voiceStateUpdate', async (oldState, newState) => {
  voiceStateChange(bot, oldState, newState, channelsWithActiveUsers);
});

// Log In
bot.login(appToken);
