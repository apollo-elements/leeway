import { ValidationError } from 'apollo-server-express';

import assign from 'crocks/helpers/assign.js';
import composeP from 'crocks/helpers/composeP.js';
import filter from 'crocks/pointfree/filter.js';
import map from 'crocks/pointfree/map.js';
import objOf from 'crocks/helpers/objOf.js';

import { getNick, isValidMessage, isListableUser } from '../lib.js';

export const users = (_, __, { user: { getUsers } }) =>
  getUsers()
    .then(filter(isListableUser))
    .then(xs => xs.sort(
      (a, b) =>
        a.status === b.status ? 0
      : a.status === 'ONLINE' ? 1
      : a.status === 'parted' ? 0
      : -1
    ));

function validateMessage(message) {
  if (!isValidMessage.runWith(message)) throw new ValidationError('Invalid Message');
  return message;
}

const assignNick = getUser => ({ userId, ...message }) =>
  getUser(userId)
    .then(getNick)
    .then(objOf('nick'))
    .then(assign({ ...message, userId }));

export const messages = (_, __, { message: { getMessages }, user: { getUser } }) =>
  getMessages()
    .then(map(composeP(
      validateMessage,
      assignNick(getUser)
    )));
