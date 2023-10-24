import { COMMANDS_CONFIG, BotCommands } from './bot-commands.config';

export function getCommands() {
  return COMMANDS_CONFIG;
}

export function isCommand(str: string): str is BotCommands {
  return Object.values<string>(BotCommands).includes(str);
}
