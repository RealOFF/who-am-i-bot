import { type DepsContainer } from '../../core';
import { createGameModule } from '../game';
import { createAuthHandler } from '../auth';
import { createStartCommandHandler } from './base.handler';

export function createBaseModule(depsContainer: DepsContainer) {
  const { logger, bot } = depsContainer;

  bot.use(async (ctx, next) => {
    logger.info(`Processing start updateId=${ctx.update.update_id}`);
    await next(); // runs next middleware
    // runs after next middleware finishes
    logger.info(`Processing end updateId=${ctx.update.update_id}`);
  });

  createAuthHandler(depsContainer);
  const { attendGame } = createGameModule(depsContainer);
  createStartCommandHandler({
    ...depsContainer,
    attendGame,
  });

  bot.launch();

  logger.info('Bot started');

  return (message: string) => {
    bot.stop(message);
    logger.info('Bot has stopped.');
  };
}
