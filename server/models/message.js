import map from 'crocks/pointfree/map';

import { MESSAGES } from '../constants';
import { getTime } from '../lib';
import { redis } from './redis';

export const addMessage = ({ userId, message, date }) =>
  redis.zadd(
    MESSAGES,
    getTime(date),
    JSON.stringify({ userId, message, date })
  );

export const getMessages = () => redis.zrangebyscore(MESSAGES, -Infinity, Infinity)
  .then(map(JSON.parse));
