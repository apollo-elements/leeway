import Equiv from 'crocks/Equiv';
import curry from 'crocks/helpers/curry';
import equals from 'crocks/pointfree/equals';
import prop from 'crocks/Maybe/prop';

const strictEquals = Equiv(equals);

export const isSameBy = curry(
  f =>
    strictEquals
      .contramap(f)
      .compareWith
);

/** isSameById, isSameByName, isSameByStatus :: String -> User -> Boolean */
export const isSameById = isSameBy(prop('id'));
export const isSameByName = isSameBy(prop('name'));
export const isSameByStatus = isSameBy(prop('status'));
