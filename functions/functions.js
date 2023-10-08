import * as env from 'dotenv';

const appToken = env.config().parsed.DISCORD_TOKEN;
const appId = env.config().parsed.APP_ID;
const publicKey = env.config().parsed.PUBLIC_KEY;
const clientId = env.config().parsed.CLIENT_ID;
const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

export function getHoursMinutesSecondsString(time) {
  let res = '';

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time / 60) % 60);
  const seconds = Math.floor(time % 60);

  if (hours) res += `${hours} ${hours > 1 ? 'hours' : 'hour'} `;
  if (minutes) res += `${minutes} ${minutes > 1 ? 'minutes' : 'minute'} `;
  if (seconds) res += `${seconds} ${seconds > 1 ? 'seconds' : 'second'} `;
  if (!(hours || minutes || seconds)) res = 'less than a second';
  if (res[res.length - 1] == ' ') res = res.slice(0, res.length - 1);

  return res;
}

export function getFormatedDate(now) {
  return `${now.getDate()}/${
    `${now.getMonth() + 1}`.length < 2
      ? `0${now.getMonth() + 1}`
      : now.getMonth() + 1
  }/${now.getFullYear()} ${now.getHours()}:${
    `${now.getMinutes()}`.length < 2 ? `0${now.getMinutes()}` : now.getMinutes()
  }:${
    `${now.getSeconds()}`.length < 2 ? `0${now.getSeconds()}` : now.getSeconds()
  }`;
}
