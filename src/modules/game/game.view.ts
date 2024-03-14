import { Config } from '../../config';
import { StartRoundErrors } from './round';
import { AttendGameErrors, StartGameErrors } from './game.service';

export const START_GAME_ERROR_MESSAGES = {
  [StartRoundErrors.FIRST_ROUND_ALREADY_CREATED]: 'First round already created.',
  [StartGameErrors.GAME_IS_NOT_FOUND]: 'Game with provided id is not found.',
  [StartGameErrors.PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS]:
    'You are have no start game rights.',
  [AttendGameErrors.GAME_IS_NOT_FOUND]: 'Game with provided id is not found.',
  [StartRoundErrors.NOT_ENOUGH_USERS_TO_START_GAME]:
    'Not enough users to start game. It should be minimum 2 users.',
  [StartRoundErrors.ACTIVE_ROUND_IS_NOT_FOUND]: 'Unknown error.',
};

export const renderRoomCreated = (password: string) =>
  `Room created! Share this link with others: https://t.me/${Config.BOT_NAME}?start=${password}`;
