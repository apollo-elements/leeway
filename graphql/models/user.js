import map from 'crocks/pointfree/map.js';

import * as C from '../constants.js';
import { redis } from './redis.js';

export const getUser = id =>
  redis.hget(C.USERS, id).then(JSON.parse);

export const changeNickname = (id, nick) =>
  redis.hset(C.USERS, id, JSON.stringify({ nick, id, status: C.ONLINE }));

export const create = user =>
  redis.hmset(C.USERS, user.id, JSON.stringify(user));

export const getUsers = () =>
  redis.hgetall(C.USERS)
    .then(Object.values)
    .then(map(JSON.parse));

export const deleteUser = async id =>
  redis.hmset(C.USERS, id, JSON.stringify({
    ...(await getUser(id)),
    status: C.PARTED,
  }));

export const update = (id, user) =>
  redis.hmset(C.USERS, id, JSON.stringify(user));
