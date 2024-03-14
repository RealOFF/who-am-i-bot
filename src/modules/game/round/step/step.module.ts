import { type DepsContainer } from '../../../../core';
import { createPassStepCommandHandler } from './step.handler';

export function createStepModule(depsContainer: DepsContainer) {
  createPassStepCommandHandler(depsContainer);
}
