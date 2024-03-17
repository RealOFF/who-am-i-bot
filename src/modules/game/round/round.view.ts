import { FinishRoundErrors, StartRoundErrors } from './round.service';

export const ROUND_FINISED_MESSAGE = 'Round finished.';

export const FINISH_ROUND_ERROR_MESSAGES = {
  [FinishRoundErrors.PLAYER_HAVE_NO_FINISH_ROUND_ACCESS_RIGHTS]:
    'You are have no finish round rights.',
  [FinishRoundErrors.USER_IS_NOT_FOUND_TO_FINISH_ROUND]: 'Unknown error.',
  [StartRoundErrors.ACTIVE_ROUND_IS_NOT_FOUND]: 'Unknown error.',
  [StartRoundErrors.FIRST_ROUND_ALREADY_CREATED]: 'Unknown error.',
  [StartRoundErrors.GAME_IS_NOT_FOUND]: 'Unknown error.',
  [StartRoundErrors.NOT_ENOUGH_USERS_TO_START_ROUND]: 'Unknown error.',
  [StartRoundErrors.ROLE_IS_NOT_FOUND]: 'Unknown error.',
};

export const ROUND_STARTED_MESSAGE = 'First round started.';

export const renderCreateRoleMessage = (roleName: string) =>
  `Create a role for a user with a nickname: ${roleName}.`;
