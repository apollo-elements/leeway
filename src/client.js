import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { persistCache } from 'apollo-cache-persist';

import compose from 'crocks/helpers/compose';
import objOf from 'crocks/helpers/objOf';
import fanout from 'crocks/Pair/fanout';
import isSame from 'crocks/predicates/isSame';
import merge from 'crocks/pointfree/merge';
import propOr from 'crocks/helpers/propOr';

const { host } = location;

// Set up the WebSocket Link for Subscriptions
function createWsLink() {
  const protocol = host.includes('localhost') ? 'ws' : 'wss';
  const options = { reconnect: true };
  const uri = `${protocol}://${host}/graphql`;
  return new WebSocketLink({ uri, options });
}

// Set up the HTTP Link for Queries and Mutations
function createHttpLink() {
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const uri = `${protocol}://${host}/graphql`;
  return new HttpLink({ uri });
}

// isWsOperation :: { query } -> Boolean
const getKind = propOr(null, 'kind');
const getOperation = propOr(null, 'operation');
const getQuery = propOr(null, 'query');
const isOperation = compose(isSame('OperationDefinition'), getKind);
const isSubscription = compose(isSame('subscription'), getOperation);
const both = (a, b) => a && b;
const isWsOperation = compose(
  merge(both),
  fanout(isOperation, isSubscription),
  getMainDefinition,
  getQuery
);

const cache = new InMemoryCache().restore(window.__APOLLO_STATE__);

const resolverFor = name => (_, args, { cache }) => {
  cache.writeData({ data: objOf(name, args[name]) });
  return args[name];
};

const resolvers = {
  Mutation: {
    nick: resolverFor('nick'),
    id: resolverFor('id'),
    status: resolverFor('status'),
  },
};

const defaults = {
  nick: null,
  id: null,
  status: navigator.onLine ? 'ONLINE' : 'OFFLINE',
};

const link = split(isWsOperation, createWsLink(), createHttpLink());

let client;

export async function getClient() {
  if (client) return client;
  await persistCache({ cache, storage: localStorage });
  client = new ApolloClient({ cache, resolvers, link, ssrForceFetchDelay: 100 });
  cache.writeData({ data: defaults });
  return client;
}
