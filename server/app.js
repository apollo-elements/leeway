import compression from 'compression';
import express from 'express';
import path from 'path';
import { HTTPS } from 'express-sslify';
import { createServer } from 'http';
import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import { readFileSync } from 'fs';

const port = process.env.PORT || 8000;
const url = process.env.URL || `http://localhost:${port}`;
const app = express();
const http = createServer(app);

const swHeaders = [
  'max-age=0',
  'must-revalidate',
  'no-cache',
  'no-store',
  'proxy-revalidate',
].join();

const staticHeaders = [
  'immutable',
  'max-age=31536000',
  'public',
].join()

if (process.env.NODE_ENV === 'production') {
  app.use(HTTPS({ trustProtoHeader: true }));
  app.use(compression({ threshold: 0 }));
}

app.use(express.static('public', {
  setHeaders(res, path) {
    res.setHeader("Cache-Control", path.endsWith('sw.js') ? swHeaders : staticHeaders);
  }
}));

app.get(/^(?!.*(\.)|(graphi?ql).*)/, function sendSPA(req, res) {
  res.sendFile(path.resolve('public', 'index.html'))
});

const pubsub = new PubSub();

const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

import * as Subscription from './subscriptions';
import * as Query from './queries';
import * as Mutation from './mutations';
import * as user from './models/user.js';
import * as message from './models/message.js';
const server = new ApolloServer({
  typeDefs,
  resolvers: { Mutation, Query, Subscription },
  context: {
    pubsub,
    message,
    user,
  }
});

server.applyMiddleware({ app, path: '/graphql' });

server.installSubscriptionHandlers(http);

http.listen({ port }, function onServerInit() {
  console.log(`🚀  Apollo Server at ${url}${server.graphqlPath}`);
});
