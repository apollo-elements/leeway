import map from 'crocks/pointfree/map';

import { MESSAGES } from '../constants';
import { redis } from './redis';

export const addMessage = ({ user, message, date }) =>
  redis.zadd(
    MESSAGES,
    new Date(date).getTime(),
    JSON.stringify({ user, message, date })
  );

export const getMessages = () => redis.zrangebyscore(MESSAGES, -Infinity, Infinity)
  .then(map(JSON.parse));
