import * as env from 'dotenv';
import {
  SlashCommandBuilder,
  ApplicationCommandOptionType,
  GuildMember
} from 'discord.js';
import { QueueRepeatMode } from 'discord-player';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Select a loop option.')
    .addIntegerOption(option =>
      option
        .setName('mode')
        .setDescription('Loop Type')
        .setRequired(true)
        .setChoices(
          {
            name: 'Off',
            value: QueueRepeatMode.OFF
          },
          {
            name: 'Track',
            value: QueueRepeatMode.TRACK
          },
          {
            name: 'Queue',
            value: QueueRepeatMode.QUEUE
          },
          {
            name: 'Autoplay',
            value: QueueRepeatMode.AUTOPLAY
          }
        )
    ),
  async execute(interaction, player) {
    try {
      if (
        !interaction.member.voice.channel ||
        !(interaction.member instanceof GuildMember)
      ) {
        return interaction.reply({
          content: `${notificationPrefix} Warning: you've got to be in a voice channel to use this command.`,
          ephemeral: true
        });
      }

      if (
        interaction.guild.members.me.voice.channelId &&
        interaction.member.voice.channelId !==
          interaction.guild.members.me.voice.channelId
      ) {
        return void interaction.reply({
          content: `${notificationPrefix} Warning: you're not in the right voice channel.`,
          ephemeral: true
        });
      }

      await interaction.deferReply();

      const queue = player.nodes.get(interaction.guildId);

      if (!queue || !queue?.node.isPlaying())
        return void interaction.followUp({
          content: `${notificationPrefix} Error: no music's being played.`
        });

      const loopMode = interaction.options.getInteger('mode');
      const success = queue.setRepeatMode(loopMode);
      const mode =
        loopMode == QueueRepeatMode.TRACK
          ? '🔂'
          : loopMode == QueueRepeatMode.QUEUE
          ? '🔁'
          : '▶';

      return void interaction.followUp({
        content: !success
          ? `${notificationPrefix} Notification: set loop mode ${mode}`
          : `${notificationPrefix} Error: couldn't set the loop mode`
      });
    } catch (err) {
      console.log(`${notificationPrefix} Error: ${err}`);
      interaction.followUp({
        content: `${notificationPrefix} Error: ${err.message}`
      });
    }
  }
};
