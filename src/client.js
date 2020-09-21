import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { persistCache } from 'apollo-cache-persist';

import compose from 'crocks/helpers/compose';
import fanout from 'crocks/Pair/fanout';
import isSame from 'crocks/predicates/isSame';
import merge from 'crocks/pointfree/merge';
import propOr from 'crocks/helpers/propOr';

const { host } = location;

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        nick(next) { return next || null; },
        id(next) { return next || null; },
        status(next) { return next || navigator.onLine ? 'ONLINE' : 'OFFLINE'; },
      },
    },
  },
});

cache.restore(window.__APOLLO_STATE__);

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

const link =
  split(isWsOperation, createWsLink(), createHttpLink());

let client;

export async function getClient() {
  if (client) return await client;
  client = new Promise(resolve =>
    persistCache({ cache, storage: localStorage })
      .then(() =>
        resolve(new ApolloClient({ cache, link, ssrForceFetchDelay: 100 }))));
}
