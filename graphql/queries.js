import { ValidationError } from 'apollo-server-express';

import assign from 'crocks/helpers/assign';
import composeP from 'crocks/helpers/composeP';
import filter from 'crocks/pointfree/filter';
import map from 'crocks/pointfree/map';
import objOf from 'crocks/helpers/objOf';

import { getNick, isValidMessage, isValidUser } from './lib';

export const users = (_, __, { user: { getUsers } }) =>
  getUsers()
    .then(filter(isValidUser));

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
