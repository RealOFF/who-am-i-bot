import TelegramBot from 'node-telegram-bot-api';
import { Config } from './config';

// Create a new bot instance
const bot = new TelegramBot(Config.BOT_TOKEN, { polling: true });

// Event listener for when a user sends a message
bot.on('message', message => {
  const chatId = message.chat.id;
  const messageText = message.text;

  // Reply to the user with their message
  bot.sendMessage(chatId, `You said: ${messageText}`);
});

// To handle errors
bot.on('polling_error', error => {
  console.error(error);
});

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stopPolling();
  console.log('Bot has stopped.');
});
