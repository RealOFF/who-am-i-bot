import { createBaseModule } from './modules/base';
import { depsContainer, depsCleanup } from './core';

createBaseModule(depsContainer);

process.once('SIGINT', () => depsCleanup('SIGINT'));
process.once('SIGTERM', () => depsCleanup('SIGTERM'));
