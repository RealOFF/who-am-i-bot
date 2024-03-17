export function orderByRandom<T>(array: T[]) {
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
