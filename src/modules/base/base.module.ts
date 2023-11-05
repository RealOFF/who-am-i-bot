import { type DepsContainer } from '../../core';
import { createGameModule } from '../game';
import { createAuthHandler } from '../auth';
import { createStartCommandHandler } from './base.handler';

export function createBaseModule(depsContainer: DepsContainer) {
  createAuthHandler(depsContainer);
  const { attendGame } = createGameModule(depsContainer);
  createStartCommandHandler({
    ...depsContainer,
    attendGame,
  });
}
