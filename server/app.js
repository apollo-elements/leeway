import compression from 'compression';
import express from 'express';
import passport from 'passport';

import { Strategy } from 'passport-local';
import { HTTPS } from 'express-sslify';
import { server } from './server.js';
import { ssr } from './ssr.js';

import { getUser, getUsers, verify } from './models/user.js';

import { sessionParser } from './session.js';

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

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => getUser(id).then(x => done(null, x)));
passport.use(new Strategy(async (nick, password, done) => {
  const user = await getUsers().then(xs => xs.find(y => y.nick === nick));
  if (user && await verify(user, password))
    return done(null, user);
  else
    return done(null, false, { message: 'Incorrect username or password' });
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(sessionParser);

app.get('/', passport.initialize(), passport.session(), async function sendSPA(req, res) {
  res.set('Cache-Control', shouldCache(req.path) ? shortHeaders : longHeaders);
  res.send(await ssr(req, res));
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

app.use('/graphql', passport.initialize(), passport.session());
server.applyMiddleware({ app, path: '/graphql' });

const port = process.env.PORT || 4000;
const httpServer = app.listen({
  port,
  // cors: false,
  cors: {
    origin: '*',
    credentials: true,
  },
}, () => {
  console.log(`🤘 Server listening at ${server.graphqlPath} on ${port}`);
  console.log(`🗞 Subscriptions ready at ${server.subscriptionsPath} on ${port}`);
});

server.installSubscriptionHandlers(httpServer);
