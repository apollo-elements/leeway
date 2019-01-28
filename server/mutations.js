import uuidv4 from 'uuid/v4';

import {
  JOINED,
  MESSAGE_SENT,
  ONLINE,
  PARTED,
  USER_STATUS_UPDATED
} from './constants';
import { trace, traceMap } from './lib';

export async function updateUserStatus(_, { id, status }, { pubsub, user: { getUser, update } }) {
  const userStatusUpdated = { ...await getUser(id), status };
  await update(id, userStatusUpdated);
  pubsub.publish(USER_STATUS_UPDATED, { userStatusUpdated });
  trace('userStatusUpdated', Object.values(userStatusUpdated.user));
  return status;
}

export async function changeNickname(_, { id, nick }, { user: { getUser, changeNickname } }) {
  await changeNickname(id, nick);
  return await getUser(id).then(traceMap(x => JSON.stringify(x, null, 2), 'user'));
}

export async function sendMessage(_, { user, message }, { pubsub, message: { addMessage } }) {
  const date = new Date().toISOString();
  const messageSent = { user, message, date };
  await addMessage(messageSent);
  pubsub.publish(MESSAGE_SENT, { messageSent });
  return messageSent;
}

export async function join(_, { nick }, { user: { create }, pubsub }) {
  const id = uuidv4();
  const userJoined = { id, nick, status: ONLINE };
  await create(userJoined);
  pubsub.publish(JOINED, { userJoined });
  trace('userJoined', Object.values(userJoined));
  return userJoined;
}

export async function part(_, { id }, { user: { getUser, deleteUser }, pubsub }) {
  const { nick } = await getUser(id);
  await deleteUser(id);
  const userParted = { id, nick, status: PARTED };
  pubsub.publish(PARTED, { userParted });
  trace('userParted', [nick, id]);
  return;
}
