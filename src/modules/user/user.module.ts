import { type DepsContainer } from 'core';
import { createUserAuthHandler, createUserTextRequestHandler } from './user.handler';

export function createUserModule(depsContainer: DepsContainer) {
  createUserAuthHandler(depsContainer);
  const onUserTextRequest = createUserTextRequestHandler(depsContainer);

  return { onUserTextRequest };
}
