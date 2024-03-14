import { CreatePassStepErrors } from './step.service';

export const PASS_STEP_ERROR_MESSAGES = {
  [CreatePassStepErrors.CURRENT_ROUND_HAVE_NO_ACTIVE_ROLE_TO_PASS_STEP]:
    'Round is not started.',
  [CreatePassStepErrors.ROUND_IS_NOT_FOUND_TO_PASS_STEP]:
    'Your active round is not found.',
};

export const PASS_STEP_MESSAGE = 'Step passed';
