import * as env from 'dotenv';
import { SlashCommandBuilder } from 'discord.js';
import { GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove the last or the selected entry from the queue.')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription(
          'Enter the position in the queue to be removed. 0 is going to remove the last one.'
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

      let query = interaction.options.get('position')?.value || false;

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
      if (queue.tracks.length - 1 < (query || 1)) {
        return void interaction.followUp({
          content: `${notificationPrefix} Warning: there's no position No.${query}.`,
          ephemeral: true
        });
      }

      const lastTrack =
        queue.tracks.data[query ? query - 1 : queue.tracks.data.length - 1];
      const success = queue.node.remove(lastTrack);

      return void interaction.followUp({
        content: success
          ? `${notificationPrefix} Notification: removed '${lastTrack}' from the queue.`
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
