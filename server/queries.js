import Pred from 'crocks/Pred';
import hasProp from 'crocks/predicates/hasProp';
import mconcatMap from 'crocks/helpers/mconcatMap';
import filter from 'crocks/pointfree/filter';
const isValidUser =
  mconcatMap(Pred, hasProp, [
    'status',
    'nick',
    'id'
  ]);

export const users = (_, __, { user: { getUsers } }) =>
  getUsers()
    .then(filter(isValidUser));

export const messages = (_, __, { message: { getMessages } }) =>
  getMessages();
