import * as env from 'dotenv';
import { SlashCommandBuilder } from 'discord.js';
import { GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List the current queue.'),
  async execute(interaction, player) {
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

    const queue = player.nodes.get(interaction.guildId);

    if (typeof queue != 'undefined') {
      const trimString = (str, max) =>
        str.length > max ? `${str.slice(0, max - 3)}...` : str;
      return void interaction.reply({
        embeds: [
          {
            title: 'Now Playing',
            description: trimString(
              `${notificationPrefix} Notification: The current item playing is '${queue.currentTrack.title}'.\n ${queue}`,
              2047
            )
          }
        ]
      });
    } else {
      return void interaction.reply({
        content: `${notificationPrefix} There's no entries in the queue.`
      });
    }
  }
};
