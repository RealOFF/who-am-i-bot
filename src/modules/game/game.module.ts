import { type DepsContainer } from '../../core';
import {
  createCreateGameCommandHandler,
  createStartGameCommandHandler,
  createSetupRoleHandler,
  createFinishRoundCommandHandler,
  createPassStepCommandHandler,
} from './game.handler';
import { createAttendGame } from './game.service';

export function createGameModule(depsContainer: DepsContainer) {
  createCreateGameCommandHandler(depsContainer);
  createStartGameCommandHandler(depsContainer);
  createSetupRoleHandler(depsContainer);
  createFinishRoundCommandHandler(depsContainer);
  createPassStepCommandHandler(depsContainer);
  const attendGame = createAttendGame(depsContainer);

  return {
    attendGame,
  };
}
