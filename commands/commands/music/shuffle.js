import * as env from 'dotenv';
import { SlashCommandBuilder, GuildMember } from 'discord.js';

const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export default {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the queue.'),
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

    try {
      queue.tracks.shuffle();
      const trimString = (str, max) =>
        str.length > max ? `${str.slice(0, max - 3)}...` : str;
      const joinArray = arr => {
        let result = '';
        let counter = 1;
        for (let str of arr) {
          result += counter + '. ' + str + '\n';
          counter++;
        }
        return result;
      };
      return void interaction.followUp({
        embeds: [
          {
            title: 'Now Playing',
            description: trimString(
              `${notificationPrefix} Notification: The current item playing is '${
                queue.currentTrack.title
              }'.\n ${joinArray(queue.tracks.toArray())}`,
              2047
            )
          }
        ]
      });
    } catch (err) {
      console.log(`${notificationPrefix} Error: ${err}`);
      interaction.followUp({
        content: `${notificationPrefix} Error: ${err.message}`
      });
    }
  }
};
