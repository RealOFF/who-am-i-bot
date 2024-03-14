import {
  createCreateGameCommandHandler,
  createStartGameCommandHandler,
} from './game.handler';
import { createAttendGame } from './game.service';
import { createRoundModule, type CreateRoundModule } from './round';

export type CreateGameModule = CreateRoundModule;

export function createGameModule(depsContainer: CreateGameModule) {
  const roundModule = createRoundModule(depsContainer);

  createCreateGameCommandHandler(depsContainer);
  createStartGameCommandHandler({
    ...depsContainer,
    startRound: roundModule.startRound,
  });
  const attendGame = createAttendGame(depsContainer);

  return { attendGame };
}
