import compression from 'compression';
import express from 'express';
import path from 'path';
import { JSDOM } from 'jsdom';
import { HTTPS } from 'express-sslify';
import { createServer } from 'http';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import { readFileSync } from 'fs';
import favicon from 'emoji-favicon';

const pubsub = new PubSub();

const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

import * as Subscription from './subscriptions';
import * as Query from './queries';
import * as Mutation from './mutations';
import * as user from './models/user.js';
import * as message from './models/message.js';
const context = { pubsub, message, user };
const resolvers = { Mutation, Query, Subscription };
const server = new ApolloServer({ context, resolvers, typeDefs });

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
].join();

const shouldNotCache = ({ path }) => path === '/' || path.endsWith('sw.js');

if (process.env.NODE_ENV === 'production') {
  app.use(HTTPS({ trustProtoHeader: true }));
  app.use(compression({ threshold: 0 }));
}

async function ssr(file, client) {
  const dom = await JSDOM.fromFile(file);
  const script = dom.window.document.createElement('script');
  const queryText = dom.window.document.querySelector('leeway-messages').firstElementChild.innerHTML;
  await client.query({ query: gql(queryText.replace(/.*@client.*/g, '')) });
  script.innerHTML = `window.__APOLLO_STATE__ = ${JSON.stringify(client.extract())}`;
  dom.window.document.head.append(script);
  return dom.serialize();
}

app.get(/^(?!.*(\.)|(graphi?ql).*)/, async function sendSPA(req, res) {
  const cache = new InMemoryCache();
  const link = new SchemaLink({ schema: server.schema, context });
  const client = new ApolloClient({ cache, link, ssrMode: true });
  const cacheHeaders = shouldNotCache(req) ? swHeaders : staticHeaders;
  console.log(req.path, cacheHeaders);
  const index = path.resolve('public', 'index.html');
  const body = await ssr(index, client);
  res.set("Cache-Control", cacheHeaders);
  res.send(body);
});

app.use(favicon('smiley'));

app.use(express.static('public', {
  setHeaders(res, path) {
    res.setHeader("Cache-Control", path.endsWith('sw.js') ? swHeaders : staticHeaders);
  }
}));

server.applyMiddleware({ app, path: '/graphql' });

server.installSubscriptionHandlers(http);

http.listen({ port }, function onServerInit() {
  console.log(`🚀  Apollo Server at ${url}${server.graphqlPath}`);
});
