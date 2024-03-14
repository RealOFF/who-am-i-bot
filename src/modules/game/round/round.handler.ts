import {
  createSetupRole,
  createFinishRound,
  type CreateFinishRoundParams,
} from './round.service';
import { type DepsContainer, UserCommands } from '../../../core';
import { finishRoundSchema } from './round.validator';
import { TextRequestType } from '../../../domain';
import { type OnUserTextRequest } from '../../user';
import {
  ROUND_FINISED_MESSAGE,
  FINISH_ROUND_ERROR_MESSAGES,
  ROUND_STARTED_MESSAGE,
  renderCreateRoleMessage,
} from './round.view';

type CreateFinishRoundCommandHandlerParams = CreateFinishRoundParams;

export function createFinishRoundCommandHandler(
  depsContainer: CreateFinishRoundCommandHandlerParams
) {
  const { bot } = depsContainer;
  const finishRound = createFinishRound(depsContainer);

  bot.command(UserCommands.FINISH_ROUND, async ctx => {
    const { userId } = finishRoundSchema.parse({ userId: ctx.message.from?.id });

    const result = await finishRound({ userId });

    if (result.isOk) {
      ctx.reply(ROUND_FINISED_MESSAGE);
    } else {
      ctx.reply(FINISH_ROUND_ERROR_MESSAGES[result.error]);
    }
  });
}

export type CreateSetupRoleHandler = {
  onUserTextRequest: OnUserTextRequest;
} & DepsContainer;

export function createSetupRoleHandler(depsContainer: CreateSetupRoleHandler) {
  const { onUserTextRequest } = depsContainer;
  const setupRole = createSetupRole(depsContainer);

  onUserTextRequest(TextRequestType.SETUP_ROLE_NAME, async ctx => {
    await setupRole({
      assignedToId: ctx.user.id,
      title: ctx.main.message.text,
    });
  });
}

export function createNotifyUserRoundStarted(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createNotifyUserRoundStarted' });

  return async ({ userId }: { userId: number }) => {
    await bot.telegram.sendMessage(userId, ROUND_STARTED_MESSAGE);

    logger.info('User notified about round started', { userId });
  };
}

export function createNotifyUserToCreateRole(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createNotifyUserToCreateRole' });

  return async ({ userId, roleName }: { userId: number; roleName: string }) => {
    await bot.telegram.sendMessage(userId, renderCreateRoleMessage(roleName));

    logger.info('User notified about need to create role', { userId });
  };
}
