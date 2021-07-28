import Pred from 'crocks/Pred/index.js';
import hasProp from 'crocks/predicates/hasProp.js';
import mconcatMap from 'crocks/helpers/mconcatMap.js';
import curry from 'crocks/helpers/curry.js';
import propOr from 'crocks/helpers/propOr.js';
import compose from 'crocks/helpers/compose.js';

import * as C from './constants.js';

// eslint-disable-next-line no-console
export const trace = curry((tag, x) => console.log(tag, x) || x);

// eslint-disable-next-line no-console
export const traceMap = curry((f, tag, x) => console.log(tag, f(x)) || x);

export const getNick = propOr(undefined, 'nick');

export const getTime = date =>
  new Date(date).getTime();

/**
 * @param {string|null} [isoOrNull] isoOrNull
 * @return {Boolean}
 */
export const isISOLessThanOneWeekAgo = isoOrNull => {
  if (!isoOrNull || typeof isoOrNull !== 'string') return false;
  else {
    try {
      const delta = new Date() - new Date(isoOrNull);
      return (delta) < C.ONE_WEEK;
    } catch {
      return false;
    }
  }
};

const isValidType = props =>
  mconcatMap(Pred, hasProp, props);

const isOnlineThisWeek = Pred(compose(
  isISOLessThanOneWeekAgo,
  propOr(null, 'lastSeen')
));

export const isValidUser = isValidType(['id', 'nick', 'status']);

export const isListableUser = isValidUser.concat(isOnlineThisWeek);

export const isValidMessage =
  isValidType([
    'date',
    'message',
    'nick',
    'userId',
  ]);
