import { type DepsContainer, SystemCommands } from '../../core';

export function createStartCommandHandler({ bot }: DepsContainer) {
  bot.command(SystemCommands.START, async ctx => {
    ctx.reply('Hello. Chat started.');
  });
}
