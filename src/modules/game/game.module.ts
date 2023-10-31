import { type DepsContainer } from '../../core';
import {
  createAttendGameCommandHandler,
  createCreateGameCommandHandler,
  createStartGameCommandHandler,
} from './game.handler';

export function createGameModule(depsContainer: DepsContainer) {
  createAttendGameCommandHandler(depsContainer);
  createCreateGameCommandHandler(depsContainer);
  createStartGameCommandHandler(depsContainer);
}
