/* eslint-env node */
import compression from 'compression';
import express from 'express';
import path from 'path';
import favicon from 'emoji-favicon';

import { JSDOM } from 'jsdom';
import { HTTPS } from 'express-sslify';
import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { SchemaLink } from '@apollo/client/link/schema';
import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import { readFileSync } from 'fs';

import * as Subscription from './subscriptions';
import * as Query from './queries';
import * as Mutation from './mutations';
import * as user from './models/user.js';
import * as message from './models/message.js';

const pubsub = new PubSub();

const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

const context = { pubsub, message, user };
const resolvers = { Mutation, Query, Subscription };
const server = new ApolloServer({ context, resolvers, typeDefs });

// const port = process.env.PORT || 8000;
// const url = process.env.URL || `http://localhost:${port}`;
const app = express();

const shortHeaders = [
  'max-age=0',
  'must-revalidate',
  'no-cache',
  'no-store',
  'proxy-revalidate',
].join();

const longHeaders = [
  'immutable',
  'max-age=31536000',
  'public',
].join();

const shouldCache = path => path === '/' || path.endsWith('sw.js');

if (process.env.NODE_ENV === 'production') {
  app.use(HTTPS({ trustProtoHeader: true }));
  app.use(compression({ threshold: 0 }));
}

async function ssr(file, client) {
  const dom =
    await JSDOM.fromFile(file);

  const script =
    dom.window.document.createElement('script');

  const queryText =
    dom.window.document.querySelector('leeway-messages').firstElementChild.innerHTML;

  // Turns out we don't need to do this :shrug:
  // but i'm keeping the comment here because it's kind of a cool regexp
  // that {([&}]+)} matches "any inner brace"
  // I suppose it will fail if you have nested braces.
  // const CLIENT_FIELD_REGEXP =
  //   /(\s+\w+ @client {([^}]+)})|(\s+\w+ @client)/gs;

  await client.query({ query: gql(queryText) });

  // NB: it's faster for the browser to `JSON.parse` than it would be to parse a POJO,
  // since JSON is a restricted syntax
  // see https://v8.dev/blog/cost-of-javascript-2019#json
  script.innerHTML = `
    window.__APOLLO_STATE__ = JSON.parse('${JSON.stringify(client.extract())}')
  `;

  dom.window.document.head.append(script);

  return dom.serialize();
}

app.get(/^(?!.*(\.)|(graphi?ql).*)/, async function sendSPA(req, res) {
  const cache = new InMemoryCache();
  const link = new SchemaLink({ schema: server.schema, context });
  const client = new ApolloClient({ cache, link, ssrMode: true });
  const cacheHeaders = shouldCache(req.path) ? shortHeaders : longHeaders;
  const index = path.resolve('build', 'index.html');
  const body = await ssr(index, client);
  res.set('Cache-Control', cacheHeaders);
  res.send(body);
});

app.use(favicon('smiley'));

app.use(express.static('build', {
  setHeaders(res, path) {
    res.setHeader('Cache-Control', shouldCache(path) ? shortHeaders : longHeaders);
  },
}));

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = app.listen({
  port: process.env.PORT || 4000,
  cors: {
    origin: '*',
    credentials: true,
  },
}, () => {
  console.log(`🤘 Server listening at ${server.graphqlPath}`);
  console.log(`🗞 Subscriptions ready at ${server.subscriptionsPath}`);
});

server.installSubscriptionHandlers(httpServer);
