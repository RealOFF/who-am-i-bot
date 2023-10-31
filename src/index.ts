import { createBotController } from './modules/bot';

const destroy = createBotController();

process.once('SIGINT', () => destroy('SIGINT'));
process.once('SIGTERM', () => destroy('SIGTERM'));
