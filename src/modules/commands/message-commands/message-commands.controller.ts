import TelegramBot, { Message } from 'node-telegram-bot-api';
import { MessageCommands, createGameSchema } from './message-commands.config';
import { db, logger } from '../../../core';

const CommandsHandlers = {
  [MessageCommands.SET_GAME_NAME]: async (message: Message) => {
    const data = createGameSchema.parse({
      creatorId: message.from?.id,
      name,
    });

    await db.session.create({
      data,
    });

    return 'Game created';
  },
};

function handleMessageCommand(commandName: MessageCommands, message: Message) {
  return CommandsHandlers[commandName](message);
}

export function createMessageCommandsController(bot: TelegramBot) {
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
      const response = await handleMessageCommand(commandName, message);
      const chatId = message.chat.id;

      bot.sendMessage(chatId, response);
    } catch (error) {
      logger.error('Command error', error);
    }
  });
}
