import * as env from 'dotenv';
import { SlashCommandBuilder, GuildMember } from 'discord.js';
import { QueryType } from 'discord-player';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a link or a search in YouTube.')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Enter a link or search terms')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('volume')
        .setDescription('Enter a number 0 — 120 (Default is 25)')
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

      const channel = interaction.member.voice.channel;
      const query = interaction.options.get('query');
      const volume = interaction.options.get('volume')?.value || 25;

      const searchResult = await player
        .search(query.value, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO
        })
        .catch(() => {});
      if (!searchResult || !searchResult.tracks.length)
        return void interaction.followUp({
          content: `${notificationPrefix} Notification: no results were found.`
        });

      // const queue = await player.createQueue(interaction.guild, {
      //   ytdlOptions: {
      //     quality: 'highest',
      //     filter: 'audioonly',
      //     highWaterMark: 1 << 30,
      //     dlChunkSize: 0
      //   },
      //   metadata: interaction.channel
      // });

      const queue = player.nodes.create(interaction.guild, {
        metadata: {
          channel: interaction.channel,
          client: interaction.guild.members.me,
          requestedBy: interaction.user
        },
        ytdlOptions: {
          quality: 'highest',
          filter: 'audioonly',
          highWaterMark: 1 << 28,
          dlChunkSize: 1 << 20
        },
        selfDeaf: true,
        volume,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 300000
      });

      try {
        if (!queue.connection)
          await queue.connect(interaction.member.voice.channel);
      } catch {
        void player.deleteQueue(interaction.guildId);
        return void interaction.followUp({
          content: `${notificationPrefix} Error: couldn't join your voice channel.`
        });
      }

      await interaction.followUp({
        content: `${notificationPrefix} Notification: loading your ${
          searchResult.playlist ? 'playlist' : 'track'
        }...`
      });
      searchResult.playlist
        ? queue.addTrack(searchResult.tracks)
        : queue.addTrack(searchResult.tracks[0]);
      if (!queue?.node.isPlaying()) await queue.node.play();
    } catch (err) {
      console.log(`${notificationPrefix} Error: ${err}`);
      interaction.followUp({
        content: `${notificationPrefix} Error: ${err.message}`
      });
      throw err;
    }
  }
};
