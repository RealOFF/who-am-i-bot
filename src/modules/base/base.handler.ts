import { type DepsContainer, SystemCommands } from '../../core';
import { attendGameSchema } from './base.validator';

type CreateStartGameParams = {
  attendGame: (params: { userId: number; gameCode: string }) => Promise<unknown>;
} & DepsContainer;

export function createStartCommandHandler({
  bot,
  logger: baseLogger,
  attendGame,
}: CreateStartGameParams) {
  const logger = baseLogger.child({ context: 'createStartCommandHandler' });

  bot.command(SystemCommands.START, async ctx => {
    if (ctx.payload) {
      try {
        const { userId, gameCode } = attendGameSchema.parse({
          userId: ctx.message.from?.id,
          gameCode: ctx.payload,
        });

        await attendGame({
          userId,
          gameCode,
        });

        ctx.reply(`You attended to ${ctx.payload} room.`);

        return;
      } catch (error) {
        logger.error(
          {
            error,
          },
          'Error in handler'
        );
      }
    }

    ctx.reply('Hello. Chat started.');
  });
}
