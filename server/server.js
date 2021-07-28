import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import { readFileSync } from 'fs';

import * as Resolvers from './resolvers/index.js';
import * as user from './models/user.js';
import * as message from './models/message.js';

const pubsub = new PubSub();

const typeDefs = gql(readFileSync(new URL('schema.graphql', import.meta.url), 'utf8'));

export const context = { pubsub, message, user };

export const server = new ApolloServer({ context, resolvers: { ...Resolvers }, typeDefs });
