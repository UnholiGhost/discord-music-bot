import * as env from 'dotenv';
import { SlashCommandBuilder, GuildMember } from 'discord.js';
import { QueueRepeatMode } from 'discord-player';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('now')
    .setDescription("Get information about what's playing now."),
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

    if (!queue || !queue?.node.isPlaying())
      return void interaction.followUp({
        content: `${notificationPrefix} Error: no music's being played.`
      });

    const progress = queue.node.createProgressBar();
    const perc = queue.node.getTimestamp();

    return void interaction.followUp({
      embeds: [
        {
          title: 'Now Playing',
          description: `${notificationPrefix} '${queue.currentTrack.title}' — (\`${perc.progress}%\`)`,
          fields: [
            {
              name: '\u200b',
              value: progress
            }
          ],
          color: 0xffffff
        }
      ]
    });
  }
};
