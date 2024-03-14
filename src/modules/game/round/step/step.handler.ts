import { passStepSchema } from './step.validator';
import { type DepsContainer, UserCommands } from '../../../../core';
import { createPassStep } from './step.service';
import { PASS_STEP_ERROR_MESSAGES, PASS_STEP_MESSAGE } from './step.view';

export function createPassStepCommandHandler(depsContainer: DepsContainer) {
  const { bot } = depsContainer;
  const passStep = createPassStep({ ...depsContainer });

  bot.command(UserCommands.PASS_STEP, async ctx => {
    const { userId } = passStepSchema.parse({ userId: ctx.message.from?.id });

    const result = await passStep({ userId });

    if (result.isOk) {
      ctx.reply(PASS_STEP_MESSAGE);
    } else {
      ctx.reply(PASS_STEP_ERROR_MESSAGES[result.error]);
    }
  });
}
