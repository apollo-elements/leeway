import map from 'crocks/pointfree/map.js';

import * as C from '../constants.js';
import { getTime } from '../lib.js';
import { redis } from './redis.js';

export const addMessage = ({ userId, message, date }) =>
  redis.zadd(
    C.MESSAGES,
    getTime(date),
    JSON.stringify({ userId, message, date })
  );

export const getMessages = () =>
  redis.zrangebyscore(C.MESSAGES, -Infinity, Infinity)
    .then(map(JSON.parse));

export async function editMessage(message) {
  const score = getTime(message.date);
  await redis.zremrangebyscore(C.MESSAGES, score, score);
  return redis.zadd(C.MESSAGES, score, JSON.stringify(message));
}

export const getMessage = date =>
  redis.zrangebyscore(C.MESSAGES, getTime(date), getTime(date))
    .then(xs => xs.pop())
    .then(JSON.parse);
