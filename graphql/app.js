/* eslint-disable no-console */
/* eslint-env node */
import compression from 'compression';
import express from 'express';
import path from 'path';

import { createRequire } from 'module';
import { HTTPS } from 'express-sslify';

import { parse } from 'parse5';
import { append, createNode, createTextNode, serialize } from 'parse5-utils';

import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import { readFileSync } from 'fs';

import * as Resolvers from './resolvers/index.js';
import * as user from './models/user.js';
import * as message from './models/message.js';

const require = createRequire(import.meta.url);
const { ApolloClient, InMemoryCache } = require('@apollo/client/core');
const { SchemaLink } = require('@apollo/client/link/schema');

const pubsub = new PubSub();

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

const context = { pubsub, message, user };
const server = new ApolloServer({ context, resolvers: { ...Resolvers }, typeDefs });

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

const queryText = readFileSync(path.join(__dirname, '../src/Messages.query.graphql'), 'utf-8');

const query = gql(queryText);

const isTag = tag => x => x?.tagName === tag;

async function ssr() {
  const cache = new InMemoryCache();
  const link = new SchemaLink({ schema: server.schema, context });
  const client = new ApolloClient({ cache, link, ssrMode: true });
  await client.query({ query });

  const html = readFileSync(path.join(__dirname, '../build/index.html'), 'utf-8');

  // NB: it's faster for the browser to `JSON.parse` than it would be to parse a POJO,
  // since JSON is a restricted syntax
  // see https://v8.dev/blog/cost-of-javascript-2019#json
  const content = createTextNode(`
    // so embarassing: graphql/jsutils/instanceOf.mjs:16
    globalThis.process ??= { env: { PRODUCTION: true } };
    globalThis.exports = {};
    window.__APOLLO_STATE__ = JSON.parse('${JSON.stringify(client.extract())}');
  `);

  const script = createNode('script');

  append(script, content);

  const ast = parse(html);

  const body = ast.childNodes.find(isTag('html')).childNodes.find(isTag('body'));

  append(body, script);

  return serialize(ast);
}

app.get(/^\/(?!.*(\.)|(graphi?ql).*)/, async function sendSPA(req, res) {
  res.set('Cache-Control', shouldCache(req.path) ? shortHeaders : longHeaders);
  res.send(await ssr());
});

app.get('/*.graphql', (req, res, next) => {
  res.set({ 'Content-Type': 'text/plain' });
  next();
});

app.use(express.static('build', {
  setHeaders(res, path) {
    res.setHeader('Cache-Control', shouldCache(path) ? shortHeaders : longHeaders);
  },
}));

server.applyMiddleware({ app, path: '/graphql' });

const port = process.env.PORT || 4000;
const httpServer = app.listen({
  port,
  cors: {
    origin: '*',
    credentials: true,
  },
}, () => {
  console.log(`🤘 Server listening at ${server.graphqlPath} on ${port}`);
  console.log(`🗞 Subscriptions ready at ${server.subscriptionsPath} on ${port}`);
});

server.installSubscriptionHandlers(httpServer);
