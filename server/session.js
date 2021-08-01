import { redis } from './models/redis.js';
import crypto from 'crypto';
import connectRedis from 'connect-redis';
import session from 'express-session';

const RedisStore = connectRedis(session);

export const sessionParser = session({
  genid: () => crypto.randomUUID(),
  store: new RedisStore({ client: redis }),
  saveUninitialized: false,
  secret: 'macaroni sunhat',
  resave: false,
});
