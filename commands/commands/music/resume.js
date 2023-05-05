import * as env from 'dotenv';
import { SlashCommandBuilder, GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the current stream after a pause.'),
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

    await interaction.deferReply();

    const queue = player.nodes.get(interaction.guildId);

    if (!queue)
      return void interaction.followUp({
        content: `${notificationPrefix} Error: no music's being played.`
      });

    const success = queue.node.resume();
    return void interaction.followUp({
      content: success
        ? `${notificationPrefix} Notification: stream's resumed`
        : `${notificationPrefix} Error: something's gone wrong`
    });
  }
};
