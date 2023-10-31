import { type DepsContainer } from '../../core';
import {
  createCreateGameCommandHandler,
  createStartGameCommandHandler,
} from './game.handler';
import { createAttendGame } from './game.service';

export function createGameModule(depsContainer: DepsContainer) {
  createCreateGameCommandHandler(depsContainer);
  createStartGameCommandHandler(depsContainer);
  const attendGame = createAttendGame(depsContainer);

  return {
    attendGame,
  };
}
