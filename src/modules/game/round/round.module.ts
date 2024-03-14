import { createStartRound } from './round.service';
import {
  createFinishRoundCommandHandler,
  createNotifyUserRoundStarted,
  createNotifyUserToCreateRole,
  createSetupRoleHandler,
  type CreateSetupRoleHandler,
} from './round.handler';
import { createStepModule } from './step/step.module';

export type CreateRoundModule = CreateSetupRoleHandler;

export function createRoundModule(depsContainer: CreateRoundModule) {
  const notifyUserRoundStarted = createNotifyUserRoundStarted(depsContainer);
  const notifyUserNeedToCreateRole = createNotifyUserToCreateRole(depsContainer);

  const startRound = createStartRound({
    ...depsContainer,
    notifyUserRoundStarted,
    notifyUserNeedToCreateRole,
  });
  createFinishRoundCommandHandler({ ...depsContainer, startRound });
  createSetupRoleHandler(depsContainer);
  createStepModule(depsContainer);

  return { startRound };
}
