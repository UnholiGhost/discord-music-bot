import * as env from 'dotenv';
import { SlashCommandBuilder } from 'discord.js';
import { GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription("Change the player' volume.")
    .addIntegerOption(option =>
      option
        .setName('volume')
        .setDescription('Enter a number 0 — 120')
        .setRequired(true)
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

    let query = interaction.options.get('volume').value;

    if (query > 120) query = 25;

    query = Math.max(0, query);
    query = Math.min(120, query);

    const success = queue.node.setVolume(query);

    return void interaction.followUp({
      content: success
        ? `${notificationPrefix} Notification: volume set to ${query}.`
        : `${notificationPrefix} Notification: something's gone wrong.`
    });
  }
};
