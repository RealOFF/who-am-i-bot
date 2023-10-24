import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getCommands, isCommand } from './bot-commands.service';
import { BotCommands, startSchema } from './bot-commands.config';
import { db, logger } from '../../../core';

const CommandsHandlers = {
  [BotCommands.CREATE_GAME]: async () => {
    return 'Specify the name of the game room.';
  },
  [BotCommands.START]: async (message: Message) => {
    const data = startSchema.parse({
      id: message.from?.id,
      username: message.from?.username,
      language: message.from?.language_code,
    });

    await db.user.create({
      data,
    });

    return 'Hello. Chat started.';
  },
};

function handleBotCommand(commandName: BotCommands, message: Message) {
  return CommandsHandlers[commandName](message);
}

export function createBotCommandsController(bot: TelegramBot) {
  bot.setMyCommands(getCommands());

  bot.on('message', async message => {
    const commandEntity = message.entities?.find(({ type }) => type === 'bot_command');
    if (!commandEntity || !message.text) {
      logger.warn('Command entity not found');

      return;
    }

    const commandName = message.text.slice(
      commandEntity.offset,
      commandEntity.offset + commandEntity.length
    );

    if (!isCommand(commandName)) {
      logger.warn('Unknown command');

      return;
    }

    try {
      const response = await handleBotCommand(commandName, message);
      const chatId = message.chat.id;

      bot.sendMessage(chatId, response);
    } catch (error) {
      logger.error('Command error', error);
    }
  });
}
