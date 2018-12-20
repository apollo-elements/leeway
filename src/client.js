import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';
import { withClientState } from 'apollo-link-state';
import ApolloClient from 'apollo-client';

import { ApolloLink, split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';
import compose from 'crocks/helpers/compose';
import fanout from 'crocks/helpers/fanout';
import isSame from 'crocks/predicates/isSame';
import merge from 'crocks/Pair/merge';
import propOr from 'crocks/helpers/propOr';

import { get } from './lib/storage';

const { host } = location;

// Set up the WebSocket Link for Subscriptions
function getWsLink() {
  const protocol = host.includes('localhost') ? 'ws' : 'wss';
  const options = { reconnect: true };
  const uri = `${protocol}://${host}/graphql`;
  return new WebSocketLink({ uri, options });
}

// Set up the HTTP Link for Queries and Mutations
function getHttpLink() {
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

const cache = new InMemoryCache();

const stateLink = withClientState({
  cache,
  resolvers: {},
  defaults: {
    user: { __typename: 'User', ...get('user') },
  }
});

const terminal = split(isWsOperation, getWsLink(), getHttpLink());

const link = ApolloLink.from([stateLink, terminal]);

// Create the Apollo Client
export const client = new ApolloClient({ cache, link });

// Hook into apollo dev tools
window.__APOLLO_CLIENT__ = client;
