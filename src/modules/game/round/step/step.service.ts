import { type DepsContainer } from '../../../../core';
import { createErrResult, createOkResult } from '../../../../common';

export type PassStepParams = {
  userId: number;
};

export enum CreatePassStepErrors {
  ROUND_IS_NOT_FOUND_TO_PASS_STEP = 'ROUND_IS_NOT_FOUND_TO_PASS_STEP',
  CURRENT_ROUND_HAVE_NO_ACTIVE_ROLE_TO_PASS_STEP = 'CURRENT_ROUND_HAVE_NO_ACTIVE_ROLE_TO_PASS_STEP',
}

export function createPassStep(depsContainer: DepsContainer) {
  const { db, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createPassStep' });

  return async ({ userId }: PassStepParams) => {
    const round = await db.round.findFirst({
      where: {
        isActive: true,
        activeRole: {
          assignedTo: {
            userId,
          },
        },
      },
      include: {
        activeRole: true,
        roles: true,
      },
    });

    if (!round) {
      logger.error('Round is not found', { userId });

      return createErrResult(CreatePassStepErrors.ROUND_IS_NOT_FOUND_TO_PASS_STEP);
    }
    const { activeRole } = round;

    if (activeRole === null) {
      logger.error('Current round have no active role', { roundId: round.id });

      return createErrResult(
        CreatePassStepErrors.CURRENT_ROUND_HAVE_NO_ACTIVE_ROLE_TO_PASS_STEP
      );
    }

    const nextRoleInCurrentCycle = round.roles.find(
      ({ order }) => activeRole.order + 1 === order
    );
    const nextRole = nextRoleInCurrentCycle || round.roles[0];

    const result = await db.round.update({
      where: {
        id: round.id,
      },
      data: {
        activeRoleId: nextRole.id,
      },
    });

    return createOkResult(result);
  };
}
