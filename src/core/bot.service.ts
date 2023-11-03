import { Telegraf, session } from 'telegraf';
import { Config } from '../config';

export const bot = new Telegraf(Config.BOT_TOKEN);

bot.use(session());
