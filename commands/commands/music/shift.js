import * as env from 'dotenv';
import { SlashCommandBuilder } from 'discord.js';
import { GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('shift')
    .setDescription(
      'Remove entries from the queue starting from the first one.'
    )
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription(
          'Enter the position, entries up to which are to be removed. 0 is going to remove only the next one.'
        )
        .setRequired(false)
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

      let query = interaction.options.get('position')?.value || 1;

      if (!queue || !queue?.node.isPlaying())
        return void interaction.followUp({
          content: `${notificationPrefix} Error: no music's being played.`
        });

      if (queue.tracks.length < 1) {
        return void interaction.followUp({
          content: `${notificationPrefix} Warning: the queue is empty.`,
          ephemeral: true
        });
      }
      if (queue.tracks.length < 1) {
        return void interaction.followUp({
          content: `${notificationPrefix} Warning: the queue is empty.`,
          ephemeral: true
        });
      }
      if (queue.tracks.length == 1) {
        return void interaction.followUp({
          content: `${notificationPrefix} Warning: there's nothing to shift.`,
          ephemeral: true
        });
      }
      if (queue.tracks.length - 1 < Math.abs(query || 1)) {
        return void interaction.followUp({
          content: `${notificationPrefix} Warning: there's nothing on the position No.${query}.`,
          ephemeral: true
        });
      }

      const nextTracks = queue.tracks.data.slice(0, query - 1);
      const nextTrack = queue.tracks.data[query - 1];

      let success;

      nextTracks.reverse();
      nextTracks.map(el => {
        success = queue.node.remove(el);
      });

      return void interaction.followUp({
        content: success
          ? `${notificationPrefix} Notification: removed entries up to '${nextTrack}' from the queue.`
          : `${notificationPrefix} Notification: something's gone wrong.`
      });
    } catch (err) {
      console.log(`${notificationPrefix} Error: ${err}`);
      interaction.followUp({
        content: `${notificationPrefix} Error: ${err.message}`
      });
    }
  }
};
