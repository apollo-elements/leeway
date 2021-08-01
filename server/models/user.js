import map from 'crocks/pointfree/map.js';

import * as C from '../constants.js';
import { redis } from './redis.js';
import { compare, hash } from 'bcrypt';

export const getUser = id =>
  redis.hget(C.USERS, id).then(JSON.parse);

export const getUserByNick = nick =>
  getUsers()
    .then(users =>
      users.find(x =>
        x.nick === nick));

export const changeNickname = (id, nick) =>
  redis.hset(C.USERS, id, JSON.stringify({ nick, id, status: C.ONLINE }));

export async function verify(user, password) {
  const record = await redis.hget(C.AUTH, user.id);
  if (!record)
    return true; // heh
  if (record && !password)
    return false;
  return await compare(password, record);
}

function addUserRecord(user) {
  return redis.hmset(C.USERS, user.id, JSON.stringify(user));
}

export const create = (user, password) =>
    !password ? addUserRecord(user)
  : hash(password, 10)
    .then(hashed =>
      Promise.all([
        addUserRecord(user),
        redis.hmset(C.AUTH, user.id, hashed),
      ])
    );

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
