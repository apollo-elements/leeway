import { readFileSync } from 'fs';
import { ApolloServer, PubSub, gql } from 'apollo-server-express';

const pubsub = new PubSub();

const MESSAGE_SENT = 'MESSAGE_SENT';

const messages = [];

const typeDefs = gql(readFileSync(`${__dirname}/schema.graphql`, 'utf8'));

const resolvers = {
  Mutation: {
    sendMessage(root, { user, message }, context) {
      const date = new Date().toISOString();
      messages.push({ user, message, date });
      pubsub.publish(MESSAGE_SENT, { messageSent: messages });
      return { user, message, date };
    },
  },

  Query: {
    messages: () => messages,
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
