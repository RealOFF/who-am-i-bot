import { type TextRequestType, type User } from '../../domain';
import { type DepsContainer } from '../../core';
import { authSchema } from './user.valodator';
import { type Context } from 'telegraf';

export function createUserAuthHandler({ bot, logger: baseLogger, db }: DepsContainer) {
  const logger = baseLogger.child({ context: 'createAuthHandler' });

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
      // TODO optimise db requests
      const user = await db.user.findUnique({ where: { id: data.id } });
      if (user) {
        logger.info('User already registrated');
        next();

        return;
      } else {
        logger.info(`User created id=${data.id}`);
        await db.user.create({ data });
        next();

        return;
      }
    } catch (error) {
      logger.error({ error }, 'Error in handler');
    }
  });
}

type OnUserTextRequestHandler = (ctx: {
  main: Context & { message: { text: string } };
  user: User;
}) => void;

export type OnUserTextRequest = (
  textRequestType: keyof typeof TextRequestType,
  handler: OnUserTextRequestHandler
) => void;

export function createUserTextRequestHandler(depsContainer: DepsContainer) {
  const { logger: baseLogger, bot, db } = depsContainer;
  const logger = baseLogger.child({ context: 'createUserTextRequestHandler' });
  const handlers = new Map<keyof typeof TextRequestType, OnUserTextRequestHandler[]>();

  bot.hears(/^(?!\/).+/, async ctx => {
    logger.info(`Text message recieved: ${ctx.match.input}`);

    const user = await db.user.findUnique({ where: { id: ctx.message.from.id } });

    if (!user) {
      logger.error(`User with id=${ctx.message.from.id} is not found`);
      return;
    }

    if (!user.activeTextRequestType) {
      return;
    }

    handlers.get(user.activeTextRequestType)?.forEach(handler =>
      handler({
        main: ctx,
        user,
      })
    );
  });

  return (
    textRequestType: keyof typeof TextRequestType,
    handler: OnUserTextRequestHandler
  ) => {
    handlers.set(textRequestType, [...(handlers.get(textRequestType) || []), handler]);
  };
}
