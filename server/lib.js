import Pred from 'crocks/Pred';
import hasProp from 'crocks/predicates/hasProp';
import mconcatMap from 'crocks/helpers/mconcatMap';
import curry from 'crocks/helpers/curry';
import propOr from 'crocks/helpers/propOr';

// eslint-disable-next-line no-console
export const trace = curry((tag, x) => console.log(tag, x) || x);

// eslint-disable-next-line no-console
export const traceMap = curry((f, tag, x) => console.log(tag, f(x)) || x);

export const getNick = propOr(undefined, 'nick');

export const getTime = date =>
  new Date(date).getTime();

const isValidType = props => mconcatMap(Pred, hasProp, props);

export const isValidUser =
  isValidType([
    'id',
    'nick',
    'status',
  ]);

export const isValidMessage =
  isValidType([
    'date',
    'message',
    'nick',
    'userId',
  ]);
