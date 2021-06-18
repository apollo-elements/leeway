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
