import { botModule } from 'modules/bot';

const destroy = botModule.init();

process.once('SIGINT', () => destroy());
