import * as env from 'dotenv';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes
} from 'discord.js';
import { Player } from 'discord-player';
import fs from 'fs';
import path from 'path';

// Functions
import { contentCheck } from './functions/contentCheck.js';
import { voiceStateChange } from './functions/voiceStateChange.js';

try {
  const appToken = env.config().parsed.DISCORD_TOKEN;
  const appId = env.config().parsed.APP_ID;
  const publicKey = env.config().parsed.PUBLIC_KEY;
  const clientId = env.config().parsed.CLIENT_ID;
  const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;
  const _dirname = new URL(import.meta.url).pathname.slice(1);

  const voiceChannelStays = [];

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
  await player.extractors.loadDefault();

  player.on('error', (queue, err) => {
    console.log(
      `${notificationPrefix} Error: '${err.message}' from the queue on '${queue.guild.error}'.`
    );
  });

  player.on('playerError', (queue, err) => {
    console.log(
      `${notificationPrefix} Error: '${err.message}' from connexion on '${queue.guild.error}'.`
    );
  });

  player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(
      `${notificationPrefix} Notification: started playing '${track.title}'.`
    );
  });

  player.on('audioTracksAdd', (queue, track) => {
    queue.metadata.send(
      `${notificationPrefix} Notification: '${track.title}' added to the queue.`
    );
  });

  player.on('disconnect', queue => {
    queue.metadata.send(`${notificationPrefix} Notification: Disconnecting...`);
  });

  player.on('emptyChannel', queue => {
    queue.metadata.send(
      `${notificationPrefix} Notification: Leaving the empty voice channel...`
    );
  });

  player.on('emptyQueue', queue => {
    queue.metadata.send(
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
    voiceStateChange(bot, oldState, newState, voiceChannelStays);
  });

  // Log In
  bot.login(appToken);
} catch (e) {
  console.log(`\nError:\n${e}\n\n`);
}
