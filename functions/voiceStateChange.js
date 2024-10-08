import * as env from 'dotenv';

import { getHoursMinutesSecondsString, getFormatedDate } from './functions.js';

const appToken = env.config().parsed.DISCORD_TOKEN;
const appId = env.config().parsed.APP_ID;
const publicKey = env.config().parsed.PUBLIC_KEY;
const clientId = env.config().parsed.CLIENT_ID;
const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

// Not really sure what all of this does,
// but I'm still gonna keet it because what if.
export async function voiceStateChange(
  bot,
  oldState,
  newState,
  channelsWithActiveUsers
) {
  const logChannel = bot.channels.cache.find(
    channel =>
      channel.name == 'bot-logs' &&
      channel.guild.id == newState.guild.id &&
      channel.guild.id == oldState.guild.id
  );
  if (
    !logChannel ||
    newState.member.id == bot.user.id ||
    oldState.channelId == newState.channelId
  )
    return;

  const now = new Date();

  const newVoiceChannel = newState.channel;
  const oldVoiceChannel = oldState.channel;

  // Joined a New Channel
  if (newVoiceChannel && !oldState.channelId) {
    let guild = channelsWithActiveUsers.find(
      guild => guild.id === newVoiceChannel.guild.id
    );
    if (!guild) {
      channelsWithActiveUsers.push({
        id: newVoiceChannel.guild.id,
        activeMembers: []
      });
      guild = channelsWithActiveUsers.find(
        guild => guild.id === newVoiceChannel.guild.id
      );
    }

    guild.activeMembers.push({
      id: newState.member.id,
      channel: {
        id: newVoiceChannel.id
      },
      startOfStay: now.getTime()
    });

    await logChannel.send(
      `${notificationPrefix} Log: ${
        newState.member
      } joined the voice channel '${newVoiceChannel.name}' at ${getFormatedDate(
        now
      )}.`
    );
  }

  // Left a Channel without Joining Another
  if (oldVoiceChannel && !newState.channelId) {
    const guild = channelsWithActiveUsers.find(
      guild => guild.id == oldVoiceChannel.guild.id
    );
    const activeMember = guild?.activeMembers.find(
      member => member.id == oldState.member.id
    );

    if (!activeMember)
      await logChannel.send(
        `${notificationPrefix} Log: ${oldState.member} left the voice channel '${oldVoiceChannel.name}'.
          Our Bot could not time the member's stay in the voice channel.`
      );
    else {
      const secondsOfStay = Math.round(
        (now.getTime() - activeMember.startOfStay) / 1000
      );

      await logChannel.send(
        `${notificationPrefix} Log: ${
          oldState.member
        } left the voice channel '${oldVoiceChannel.name}' at ${getFormatedDate(
          now
        )}, 
            having stayed for ${getHoursMinutesSecondsString(secondsOfStay)}.`
      );

      guild.activeMembers = guild.activeMembers.filter(
        member => member.id != activeMember.id
      );
    }
  }

  // Switched a Channel
  if (newVoiceChannel && oldState.channelId) {
    let guild = channelsWithActiveUsers.find(
      guild => guild.id === newVoiceChannel.guild.id
    );

    const activeMember = guild?.activeMembers.find(
      member => member.id == oldState.member.id
    );

    guild.activeMembers = guild.activeMembers.filter(
      member => member.id != activeMember.id
    );

    if (!guild) {
      channelsWithActiveUsers.push({
        id: newVoiceChannel.guild.id,
        activeMembers: []
      });
      guild = channelsWithActiveUsers.find(
        guild => guild.id === newVoiceChannel.guild.id
      );
      guild.activeMembers.push({
        id: newState.member.id,
        channel: {
          id: newVoiceChannel.id
        },
        startOfStay: now.getTime()
      });
    }

    if (!activeMember) {
      await logChannel.send(
        `${notificationPrefix} Log: ${oldState.member} left the voice channel '${oldVoiceChannel.name}'.
          Our Bot could not time the member's stay in the voice channel.`
      );
    } else {
      const secondsOfStay = Math.round(
        (now.getTime() - activeMember.startOfStay) / 1000
      );

      await logChannel.send(
        `${notificationPrefix} Log: ${
          oldState.member
        } left the voice channel '${oldVoiceChannel.name}' at ${getFormatedDate(
          now
        )}, 
            having stayed for ${getHoursMinutesSecondsString(secondsOfStay)}.`
      );
    }

    guild.activeMembers.push({
      id: newState.member.id,
      channel: {
        id: newVoiceChannel.id
      },
      startOfStay: now.getTime()
    });

    await logChannel.send(
      `${notificationPrefix} Log: ${
        newState.member
      } joined the voice channel '${newVoiceChannel.name}' at ${getFormatedDate(
        now
      )}.`
    );
  }
}
