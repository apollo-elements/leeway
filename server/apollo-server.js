import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import { readFileSync } from 'fs';

const pubsub = new PubSub();

const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

import * as Subscription from './subscriptions';
import * as Query from './queries';
import * as Mutation from './mutations';
import * as user from './models/user.js';
import * as message from './models/message.js';
export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers: { Mutation, Query, Subscription },
  context: {
    pubsub,
    message,
    user,
  }
});
