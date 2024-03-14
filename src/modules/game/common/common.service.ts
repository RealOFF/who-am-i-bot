type Pair<T> = {
  from: T;
  to: T;
};

export function createRandomPairs<T>(array: T[]) {
  let toArray = array;

  return array.reduce<Pair<T>[]>((result, item) => {
    const preparedToArray = toArray.filter(el => el !== item);
    const randomIndex = Math.floor(Math.random() * preparedToArray.length);

    result.push({
      from: item,
      to: preparedToArray[randomIndex],
    });

    toArray = toArray.filter(item => item !== preparedToArray[randomIndex]);

    return result;
  }, []);
}
