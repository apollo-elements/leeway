import { readFileSync } from 'fs';
import { ApolloServer, PubSub, gql } from 'apollo-server-express';
import Redis from 'ioredis';
import map from 'crocks/pointfree/map';

const redis = new Redis(process.env.REDIS_URL);

const pubsub = new PubSub();

const MESSAGE_SENT = 'MESSAGE_SENT';
const MESSAGES = 'messages';

const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

const resolvers = {
  Mutation: {
    async sendMessage(_, { user, message }) {
      const date = new Date().toISOString();
      const messageSent = { user, message, date };
      await redis.lpush(MESSAGES, JSON.stringify(messageSent));
      pubsub.publish(MESSAGE_SENT, { messageSent });
      return messageSent;
    },
  },

  Query: {
    messages: async () => await redis.lrange(MESSAGES, 0, -1).then(map(JSON.parse)),
  },

  Subscription: {
    messageSent: {
      subscribe: () => pubsub.asyncIterator(MESSAGE_SENT)
    },
  },
};

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});
