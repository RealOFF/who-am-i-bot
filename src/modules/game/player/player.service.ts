import { type DepsContainer } from '../../../core';
import { createRandomPairs } from '../common';

type CreatePlayersPairsParams<T> = {
  players: T[];
};

export function createCreatePlayersPairs({ logger: baseLogger }: DepsContainer) {
  const logger = baseLogger.child({ context: 'createCreatePlayersPairs' });

  return <T>({ players }: CreatePlayersPairsParams<T>) => {
    const randomPairs = createRandomPairs(players);

    logger.info({ pairs: randomPairs }, 'Pairs created');

    return randomPairs;
  };
}

export function createPlayersQueue<T>(array: T[]) {
  return [...array].sort(() => {
    const value = Math.random();

    switch (true) {
      case value > 0.5:
        return 1;
      case value < 0.5:
        return -1;
      default:
        return 0;
    }
  });
}
