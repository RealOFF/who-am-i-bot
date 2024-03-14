export function createOkResult<V>(value: V): OkResult<V> {
  return {
    value,
    isOk: true,
    isErr: false,
  };
}

export function createEmptyOkResult(): OkResult<void> {
  return createOkResult(undefined);
}

export function createErrResult<E>(error: E): ErrResult<E> {
  return {
    error,
    isOk: false,
    isErr: true,
  };
}

export type OkResult<V> = {
  value: V;
  isOk: true;
  isErr: false;
};

export type ErrResult<E> = {
  error: E;
  isOk: false;
  isErr: true;
};

export type Result<V, E> = OkResult<V> | ErrResult<E>;
