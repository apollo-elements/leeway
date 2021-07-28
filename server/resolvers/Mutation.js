import { ValidationError } from 'apollo-server-express';

import { v4 as uuidv4 } from 'uuid';

import { isValidMessage, isValidUser, trace } from '../lib.js';

import * as C from '../constants.js';

export async function updateUserLastSeen(_, { userId }, { pubsub, user: { getUser, update } }) {
  const existing = await getUser(userId);
  const lastSeen = new Date().toISOString();
  const user = { ...existing, lastSeen };
  await update(userId, user);
  pubsub.publish(C.USER_LAST_SEEN_UPDATED, { userLastSeenUpdated: user });
  trace('userLastSeenUpdated', Object.values(user));
}

export async function updateUserStatus(_, { id, status }, { pubsub, user: { getUser, update } }) {
  const userStatusUpdated = { ...await getUser(id), status };
  if (!isValidUser.runWith(userStatusUpdated)) throw new ValidationError('Invalid User');
  await update(id, userStatusUpdated);
  pubsub.publish(C.USER_STATUS_UPDATED, { userStatusUpdated });
  trace('userStatusUpdated', Object.values(userStatusUpdated.user));
  return status;
}

export async function changeNickname(_, { id, nick }, { user: { getUser, changeNickname } }) {
  await changeNickname(id, nick);
  return await getUser(id);
}

export async function sendMessage(_, args, context) {
  const { userId, message } = args;
  const { pubsub, message: { addMessage }, user: { getUser } } = context;
  const date = new Date().toISOString();
  const { nick } = await getUser(userId);
  const messageSent = { userId, message, date, nick };
  if (!isValidMessage.runWith(messageSent)) throw new ValidationError('Invalid Message');
  await addMessage(messageSent);
  pubsub.publish(C.MESSAGE_SENT, { messageSent });
  trace('messageSent', Object.values(messageSent));
  return messageSent;
}

export async function join(_, { nick }, { user: { create, getUsers }, pubsub }) {
  const existing = await getUsers().then(users => users.find(x => x.nick === nick));
  const id = existing ? existing.id : uuidv4();
  const lastSeen = new Date().toISOString();
  const userJoined = { id, nick, lastSeen, status: 'ONLINE' };
  if (!isValidUser.runWith(userJoined)) throw new ValidationError('Invalid User');
  await create(userJoined);
  pubsub.publish(C.JOINED, { userJoined });
  trace('userJoined', Object.values(userJoined));
  return userJoined;
}

export async function part(_, { id }, { user: { getUser, deleteUser }, pubsub }) {
  const { nick } = await getUser(id);
  await deleteUser(id);
  const userParted = { id, nick, status: C.PARTED };
  if (!isValidUser.runWith(userParted)) throw new ValidationError('Invalid User');
  pubsub.publish(C.PARTED, { userParted });
  trace('userParted', Object.values(userParted));
  return;
}
