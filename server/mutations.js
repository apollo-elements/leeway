import { ValidationError } from 'apollo-server';

import uuidv4 from 'uuid/v4';

import {
  JOINED,
  MESSAGE_SENT,
  ONLINE,
  PARTED,
  USER_STATUS_UPDATED
} from './constants';
import { isValidMessage, isValidUser, trace } from './lib';

export async function updateUserStatus(_, { id, status }, { pubsub, user: { getUser, update } }) {
  const userStatusUpdated = { ...await getUser(id), status };
  if (!isValidUser.runWith(userStatusUpdated)) throw new ValidationError('Invalid User');
  await update(id, userStatusUpdated);
  pubsub.publish(USER_STATUS_UPDATED, { userStatusUpdated });
  trace('userStatusUpdated', Object.values(userStatusUpdated.user));
  return status;
}

export async function changeNickname(_, { id, nick }, { user: { getUser, changeNickname } }) {
  await changeNickname(id, nick);
  return await getUser(id);
}

export async function sendMessage(_, { userId, message }, { pubsub, message: { addMessage }, user: { getUser } }) {
  const date = new Date().toISOString();
  const { nick } = await getUser(userId);
  const messageSent = { userId, message, date, nick };
  if (!isValidMessage.runWith(messageSent)) throw new ValidationError('Invalid Message');
  await addMessage(messageSent);
  pubsub.publish(MESSAGE_SENT, { messageSent });
  return messageSent;
}

export async function join(_, { nick }, { user: { create }, pubsub }) {
  const id = uuidv4();
  const userJoined = { id, nick, status: ONLINE };
  if (!isValidUser.runWith(userJoined)) throw new ValidationError('Invalid User');
  await create(userJoined);
  pubsub.publish(JOINED, { userJoined });
  trace('userJoined', Object.values(userJoined));
  return userJoined;
}

export async function part(_, { id }, { user: { getUser, deleteUser }, pubsub }) {
  const { nick } = await getUser(id);
  await deleteUser(id);
  const userParted = { id, nick, status: PARTED };
  if (!isValidUser.runWith(userParted)) throw new ValidationError('Invalid User');
  pubsub.publish(PARTED, { userParted });
  trace('userParted', [nick, id]);
  return;
}
