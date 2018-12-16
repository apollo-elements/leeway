import { readFileSync } from 'fs';
import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import Redis from 'ioredis';
import map from 'crocks/pointfree/map';
import uuidv4 from 'uuid/v4';

const reverse = xs => [...xs].reverse();

const redis = new Redis(process.env.REDIS_URL);

const pubsub = new PubSub();

const MESSAGES = 'MESSAGES';
const MESSAGE_SENT = 'MESSAGE_SENT';
const ONLINE = 'ONLINE';
const OFFLINE = 'OFFLINE';
const USERS = 'USERS';
const USER_STATUS_UPDATED = 'USER_STATUS_UPDATED';

const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

async function join(_, { nick }, { user: { create }, pubsub }) {
  const id = uuidv4();
  const user = { id, nick, status: ONLINE };
  await create(user);
  pubsub.publish(USER_STATUS_UPDATED, { user });
  return user;
}

async function part(_, { id }, { user: { getUser, update } }) {
  await update(id, { status: OFFLINE });
  pubsub.publish(USER_STATUS_UPDATED, { user: await getUser(id) });
  return;
}

async function changeNickname(_, { id, newNick }, { user: { getUser, changeNickname } }) {
  await changeNickname(id, newNick);
  return await getUser(id);
}

async function users(_, __, { user: { getUsers } }) {
  return await getUsers();
}

async function messages(_, __, { message: { getMessages } }) {
  return await getMessages();
}

async function sendMessage(_, { user, message }, { pubsub, message: { addMessage } }) {
  const date = new Date().toISOString();
  const messageSent = { user, message, date };
  await addMessage(messageSent);
  pubsub.publish(MESSAGE_SENT, { messageSent });
  return messageSent;
}

const messageSent = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(MESSAGE_SENT);
  }
};

const userStatusUpdated = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(USER_STATUS_UPDATED);
  }
};

const resolvers = {
  Mutation: {
    changeNickname,
    join,
    part,
    sendMessage,
  },

  Query: {
    messages,
    users,
  },

  Subscription: {
    messageSent,
    userStatusUpdated,
  },
};

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: {
    pubsub,
    message: {
      getMessages: () => redis.lrange(MESSAGES, 0, -1)
        .then(reverse)
        .then(map(JSON.parse)),
      addMessage: ({ user, message, date }) =>
        redis.zadd(MESSAGES, new Date(date).getTime(), JSON.stringify({ user, message, date }))
    },
    user: {
      changeNickname: (id, nick) => redis.hset(USERS, id, { nick }),
      create: user => redis.hmset(USERS, user.id, user),
      getUser: id => redis.hget(USERS, id),
      getUsers: () => redis.hgetall(USERS),
      update: (id, user) => redis.hmset(USERS, id, user),
    }
  }
});
