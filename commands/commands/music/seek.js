import * as env from 'dotenv';
import { SlashCommandBuilder } from 'discord.js';
import { GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Jump to a certain point of the item being played.')
    .addIntegerOption(option =>
      option
        .setName('seconds')
        .setDescription('Enter the number of seconds')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('milliseconds')
        .setDescription('Enter the number of milliseconds (1 — 999)')
        .setRequired(false)
    ),

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

    let query = interaction.options.get('seconds').value;
    let queryMilliseconds = interaction.options.get('milliseconds')?.value || 0;

    queryMilliseconds = Math.max(0, queryMilliseconds);
    queryMilliseconds = Math.min(999, queryMilliseconds);

    const success = queue.node.seek(query * 1000 + queryMilliseconds);

    return void interaction.followUp({
      content: success
        ? `${notificationPrefix} Notification: seeking at ${
            (query * 1000 + queryMilliseconds) / 1000
          } seconds...`
        : `${notificationPrefix} Notification: something's gone wrong.`
    });
  }
};
