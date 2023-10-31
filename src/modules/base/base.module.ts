import { type DepsContainer } from '../../core';
import { createGameModule } from '../game';
import { createAuthHandler } from '../auth';

const moduleCreators = [createGameModule, createAuthHandler];

export function createBaseModule(depsContainer: DepsContainer) {
  const { logger, bot } = depsContainer;

  bot.use(async (ctx, next) => {
    logger.info(`Processing start updateId=${ctx.update.update_id}`);
    await next(); // runs next middleware
    // runs after next middleware finishes
    logger.info(`Processing end updateId=${ctx.update.update_id}`);
  });

  moduleCreators.forEach(createModule => createModule(depsContainer));

  bot.launch();

  logger.info('Bot started');

  return (message: string) => {
    bot.stop(message);
    logger.info('Bot has stopped.');
  };
}
