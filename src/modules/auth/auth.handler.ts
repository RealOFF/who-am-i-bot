import { type DepsContainer } from '../../core';
import { authSchema } from './auth.valodator';

export function createAuthHandler({ bot, logger, db }: DepsContainer) {
  bot.use(async (ctx, next) => {
    if (!ctx.message) {
      logger.warn('Context without message');
      next();

      return;
    }
    try {
      const data = authSchema.parse({
        id: ctx.message.from?.id,
        username: ctx.message.from?.username,
        language: ctx.message.from?.language_code,
      });
      const user = await db.user.findUnique({ where: { id: data.id } });
      if (user) {
        logger.info('User already registrated', { context: 'Auth middleware' });
        next();

        return;
      } else {
        logger.info(`User created id=${data.id}`, { context: 'Auth middleware' });
        await db.user.create({ data });
        next();

        return;
      }
    } catch (error) {
      logger.error('Error in handler', {
        context: 'Auth middleware',
        error,
      });
    }
  });
}
