import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import { readFileSync } from 'fs';

import { resolvers } from './resolvers/index.js';
import * as User from './models/user.js';
import * as Message from './models/message.js';

import { sessionParser } from './session.js';

const pubsub = new PubSub();

const typeDefs = gql(readFileSync(new URL('schema.graphql', import.meta.url), 'utf8'));

export const context = ({ req, res, connection, payload, ...rest }) => ({
  pubsub,
  user: req?.user,
  models: {
    Message,
    User: {
      ...User,
      login: user => new Promise((res, rej) =>
        req.login(user, err => err ? rej(err) : (context.user = user, res(user)))),
      logout: () => {
        req.logout();
        req.session.destroy();
      },
    },
  },
});

export const server = new ApolloServer({ context, resolvers, typeDefs, subscriptions: {
  onConnect: (connectionParams, websocket, context) => {
    context.wsSessionReady = new Promise(resolve => {
      sessionParser(context.request, {}, async () => {
        if (context.request.session?.passport)
          context.user ??= await User.getUser(context.request.session.passport.user);
        resolve();
      });
    });
  },
  onDisconnect: (websocket, context) => {
    context.user = null;
  },
} });
