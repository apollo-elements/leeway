import crypto from 'crypto';

import { AuthenticationError, UserInputError, ValidationError } from 'apollo-server-express';

import { isValidMessage, isValidUser, trace } from '../lib.js';

import * as C from '../constants.js';

export async function updateUserLastSeen(_, { userId }, context) {
  const existing = await context.models.User.getUser(userId);
  const lastSeen = new Date().toISOString();
  const user = { ...existing, lastSeen };
  await context.models.User.update(userId, user);
  context.pubsub.publish(C.USER_LAST_SEEN_UPDATED, { userLastSeenUpdated: user });
  trace('userLastSeenUpdated', Object.values(user));
}

export async function updateUserStatus(_, { id, status }, context) {
  const userStatusUpdated = { ...await context.models.User.getUser(id), status };
  if (!isValidUser.runWith(userStatusUpdated)) throw new ValidationError('Invalid User');
  await context.models.User.update(id, userStatusUpdated);
  context.pubsub.publish(C.USER_STATUS_UPDATED, { userStatusUpdated });
  trace('userStatusUpdated', Object.values(userStatusUpdated.user));
  return status;
}

export async function changeNickname(_, { id, nick }, context) {
  if (id !== context.user?.id)
    throw new AuthenticationError('Unauthorized');
  await context.models.User.changeNickname(id, nick);
  return await context.models.User.getUser(id);
}

export async function sendMessage(_, args, context) {
  await context.wsSessionReady;
  if (args.userId !== context.user.id)
    throw new AuthenticationError('Unauthorized');
  const { userId, message } = args;
  const trimmed = args.message.trim();
  if (trimmed.startsWith('/part'))
    return part(_, { id: userId }, context).then(() => ({ userId: null }));
  if (trimmed.startsWith('/nick')) {
    return changeNickname(_, { id: userId, nick: message.replace('/nick', '').trim() }, context)
      .then(() => ({ userId }));
  }
  const date = new Date().toISOString();
  const { nick } = await context.models.User.getUser(userId);
  const messageSent = { userId, message, date, nick };
  if (trimmed === '/msg NickServe help')
    messageSent.message = `👋 I'm that one person who had to try messaging the NickServe to see if it would work`;
  if (!isValidMessage.runWith(messageSent)) throw new ValidationError('Invalid Message');
  await context.models.Message.addMessage(messageSent);
  context.pubsub.publish(C.MESSAGE_SENT, { messageSent });
  trace('messageSent', Object.values(messageSent));
  return messageSent;
}

export async function editMessage(_, { date, message }, context) {
  await context.wsSessionReady;
  if (!context.user)
    throw new AuthenticationError('Unauthorized');
  const existing = await context.models.Message.getMessage(date);
  if (existing.userId !== context.user.id)
    throw new AuthenticationError('Unauthorized');
  const messageEdited = { ...existing, message };
  await context.models.Message.editMessage(messageEdited);
  context.pubsub.publish(C.MESSAGE_EDITED, { messageEdited });
  return messageEdited;
}

export async function join(_, { nick, password }, context) {
  await context.wsSessionReady;
  const existing = await context.models.User.getUserByNick(nick);
  if (existing && !await context.models.User.verify(existing, password))
    throw new AuthenticationError('Unauthorized');
  const id = existing ? existing.id : crypto.randomUUID();
  const lastSeen = new Date().toISOString();
  const userJoined = { id, nick, lastSeen, status: 'ONLINE' };
  if (!isValidUser.runWith(userJoined))
    throw new ValidationError('Invalid User');
  if (password)
    await context.models.User.create(userJoined, password);
  await context.models.User.login(userJoined);
  context.user = userJoined;
  context.pubsub.publish(C.JOINED, { userJoined });
  trace('userJoined', userJoined);
  return userJoined;
}

export async function part(_, __, context) {
  await context.wsSessionReady;
  const { id } = context.user ?? {};
  if (!id)
    throw new UserInputError('Can\'t part, not logged in');
  const { nick } = await context.models.User.getUser(id);
  const userParted = { id, nick, status: C.PARTED };
  if (!isValidUser.runWith(userParted))
    throw new ValidationError('Invalid User');
  context.pubsub.publish(C.PARTED, { userParted });
  context.user = null;
  trace('userParted', userParted);
  return context.models.User.logout();
}
