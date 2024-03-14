import { type DepsContainer } from '../../core';
import {
  type Result,
  type OkResult,
  createErrResult,
  createOkResult,
  createEmptyOkResult,
} from '../../common';
import { type StartRoundErrors } from './round';

type CreateGameParams = {
  creatorId: number;
};

export function createCreateGame({ logger: baseLogger, db }: DepsContainer) {
  const logger = baseLogger.child({ context: 'createCreateGame' });

  return async ({
    creatorId,
  }: CreateGameParams): Promise<OkResult<{ password: string }>> => {
    const session = await db.session.create({
      data: {
        players: {
          create: [
            {
              userId: creatorId,
              isCreator: true,
            },
          ],
        },
      },
    });
    logger.info('Session created');

    return createOkResult(session);
  };
}

type AttendGameParams = {
  userId: number;
  gameCode: string;
};

export enum AttendGameErrors {
  GAME_IS_NOT_FOUND = 'ATTEND_GAME_GAME_IS_NOT_FOUND',
}

export function createAttendGame({ db, logger: baseLogger }: DepsContainer) {
  const logger = baseLogger.child({ context: 'createAttendGame' });

  return async ({
    userId,
    gameCode,
  }: AttendGameParams): Promise<Result<void, AttendGameErrors>> => {
    const game = await db.session.findFirst({
      select: {
        id: true,
        players: { where: { userId } },
      },
      where: { password: gameCode },
    });

    if (!game) {
      logger.error(`Game not found game${gameCode}`);

      return createErrResult(AttendGameErrors.GAME_IS_NOT_FOUND);
    }

    if (game.players.length > 0) {
      logger.info(`Player with userId=${userId} already created in game=${gameCode}`);
      const [player] = game.players;

      await Promise.all([
        db.player.updateMany({
          where: {
            id: { not: player.id },
            userId,
          },
          data: { isActive: false },
        }),
        db.player.update({
          where: { id: player.id },
          data: { isActive: true },
        }),
      ]);

      return createEmptyOkResult();
    }

    await db.player.create({
      data: {
        userId,
        sessionId: game.id,
        isCreator: false,
        isActive: true,
      },
    });

    return createEmptyOkResult();
  };
}

export type CreateStartGameParams = {
  startRound: (params: { gameId: number }) => Promise<Result<void, StartRoundErrors>>;
} & DepsContainer;

export type StartGameParams = {
  userId: number;
};

export enum StartGameErrors {
  GAME_IS_NOT_FOUND = 'GAME_IS_NOT_FOUND',
  PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS = 'PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS',
}

export function createStartGame({
  startRound,
  db,
  logger: baseLogger,
}: CreateStartGameParams) {
  const logger = baseLogger.child({ context: 'createStartGame' });

  return async ({ userId }: StartGameParams) => {
    const player = await db.player.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!player) {
      logger.error(`Player with id=${userId} is not found`);

      return createErrResult(StartGameErrors.GAME_IS_NOT_FOUND);
    }

    if (!player.isCreator) {
      logger.error(`Player with id=${userId} is not creator and can not start game`);

      return createErrResult(StartGameErrors.PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS);
    }

    const result = await startRound({ gameId: player.sessionId });

    logger.info('Game started');

    return result;
  };
}
