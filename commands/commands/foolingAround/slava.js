import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slava')
    .setDescription('Slava Ukraini!'),
  async execute(message, player) {
    await message.reply('Слава Україні!');
  }
};
