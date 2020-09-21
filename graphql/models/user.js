import map from 'crocks/pointfree/map';

import { ONLINE, PARTED, USERS } from '../constants';
import { redis } from './redis';

export const getUser = id =>
  redis.hget(USERS, id).then(JSON.parse);

export const changeNickname = (id, nick) =>
  redis.hset(USERS, id, JSON.stringify({ nick, id, status: ONLINE }));

export const create = user =>
  redis.hmset(USERS, user.id, JSON.stringify(user));

export const getUsers = () =>
  redis.hgetall(USERS)
    .then(Object.values)
    .then(map(JSON.parse));

export const deleteUser = async id =>
  redis.hmset(USERS, id, JSON.stringify({
    ...(await getUser(id)),
    status: PARTED,
  }));

export const update = (id, user) =>
  redis.hmset(USERS, id, JSON.stringify(user));
