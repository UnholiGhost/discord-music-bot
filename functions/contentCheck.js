import * as env from 'dotenv';

const appToken = env.config().parsed.DISCORD_TOKEN;
const appId = env.config().parsed.APP_ID;
const publicKey = env.config().parsed.PUBLIC_KEY;
const clientId = env.config().parsed.CLIENT_ID;
const notificationPrefix = env.config().parsed.NOTIFICATION_PREFIX;

// Content Check Function
export async function contentCheck(content, message) {
  const lowercaseMessage = content.toLowerCase();

  if (content.startsWith('_')) {
    message.reply(
      `${notificationPrefix} Warning: please, use the new way of typing commands with '/'.`
    );
    return true;
  }
  if (
    lowercaseMessage.includes('slava') ||
    lowercaseMessage.includes('слава украине') ||
    lowercaseMessage.includes('слава україні')
  ) {
    message.reply('Героям Слава!');
    return true;
  } else if (
    lowercaseMessage.includes('слава украинѣ') ||
    lowercaseMessage.includes('слава украйнѣ')
  ) {
    message.reply('Героямъ Слава!');
    return true;
  } else if (
    lowercaseMessage.includes('slava') ||
    lowercaseMessage.includes('слава')
  ) {
    message.reply('Слава Україні!');
    return true;
  }
  return false;
}
