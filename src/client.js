import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { persistCache } from 'apollo-cache-persist';

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

const httpLink = createHttpLink();
const wsLink = createWsLink();

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

let client;

export async function getClient() {
  if (client) return await client;
  client = new Promise(resolve =>
    persistCache({ cache, storage: localStorage })
      .then(() =>
        resolve(new ApolloClient({ cache, link, ssrForceFetchDelay: 100 }))));
}
