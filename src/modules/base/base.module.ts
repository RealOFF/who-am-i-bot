import { type DepsContainer } from '../../core';
import { createGameModule } from '../game';
import { createUserModule } from '../user';
import { createStartCommandHandler } from './base.handler';

export function createBaseModule(depsContainer: DepsContainer) {
  const { onUserTextRequest } = createUserModule(depsContainer);
  const { attendGame } = createGameModule({ ...depsContainer, onUserTextRequest });
  createStartCommandHandler({
    ...depsContainer,
    attendGame,
  });
}
