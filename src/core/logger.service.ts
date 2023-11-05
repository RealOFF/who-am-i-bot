import pino, { type Logger as PinoLogger } from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

export type Logger = PinoLogger;
