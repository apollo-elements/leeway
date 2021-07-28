// @ts-check
/* eslint-disable no-console */
/* eslint-env node */
import compression from 'compression';
import express from 'express';

import { HTTPS } from 'express-sslify';
import { ssr } from './ssr.js';
import { server } from './server.js';

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

app.get('/', async function sendSPA(req, res) {
  res.set('Cache-Control', shouldCache(req.path) ? shortHeaders : longHeaders);
  res.send(await ssr());
});

app.get('/*.graphql', (req, res, next) => {
  res.set({ 'Content-Type': 'text/plain' });
  next();
});

app.use(express.static('public', {
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
