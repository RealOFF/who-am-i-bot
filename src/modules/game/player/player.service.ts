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
