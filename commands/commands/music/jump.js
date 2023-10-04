import * as env from 'dotenv';
import { SlashCommandBuilder } from 'discord.js';
import { GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('jump')
    .setDescription('Play the entry on the selected position.')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription('Enter the position to skip to.')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('skip')
        .setDescription('Skip all entries up to the selected position?')
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

      const query = interaction.options.get('position').value || false;
      const skip = interaction.options.get('skip')?.value || false;

      if (!queue || !queue?.node.isPlaying())
        return void interaction.followUp({
          content: `${notificationPrefix} Error: no music's being played.`
        });

      if (queue.tracks.length < 2) {
        return void interaction.followUp({
          content: `${notificationPrefix} Warning: the queue is empty.`,
          ephemeral: true
        });
      }
      if (queue.tracks.length - 1 < Math.abs(query || 1)) {
        return void interaction.followUp({
          content: `${notificationPrefix} Warning: there's no position No.${query}.`,
          ephemeral: true
        });
      }

      const lastTrack = queue.tracks.data[query - 1];

      let success = true;

      if (skip) {
        const nextTracks = queue.tracks.data.slice(0, query - 1);

        nextTracks.reverse();
        nextTracks.map(el => {
          success = queue.node.remove(el);
        });
      }

      const jumpingSuccess = queue.node.jump(lastTrack);

      return void interaction.followUp({
        content:
          success && jumpingSuccess
            ? `${notificationPrefix} Notification: jumped to '${lastTrack}'.`
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
