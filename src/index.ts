import { createBaseModule } from './modules/base';
import { depsContainer } from './core';

const destroy = createBaseModule(depsContainer);

process.once('SIGINT', () => destroy('SIGINT'));
process.once('SIGTERM', () => destroy('SIGTERM'));
