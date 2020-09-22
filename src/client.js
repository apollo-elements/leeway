import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { persistCache } from 'apollo-cache-persist';
import { localUserVar } from './variables';
import { mergeArrayByField } from './lib/merge-array-by-field';

import { ONE_HOUR } from './lib/constants';

const { host } = location;

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        localUser: {
          merge: true,
          read() {
            const cached = localUserVar();
            const status = !navigator.onLine ? 'OFFLINE' : cached.status || 'ONLINE';
            return { ...cached, status };
          },
        },
        users: {
          merge: mergeArrayByField('id'),
        },
      },
    },
    User: {
      keyFields: ['id'],
      fields: {
        status(prev, { readField }) {
          if (prev === 'PARTED') return prev;
          const id = readField('id');
          if (id === localUserVar().id)
            return navigator.onLine ? 'ONLINE' : 'OFFLINE';
          const lastSeen = readField('lastSeen');
          const timeDelta = Math.abs(new Date() - new Date(lastSeen));
          return (
              timeDelta < (ONE_HOUR / 4) ? 'ONLINE'
            : timeDelta < ONE_HOUR ? 'AWAY'
            : 'OFFLINE'
          );
        },
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

let clientPromise;

/**
 * @return {Promise<ApolloClient<unknown>>}
 */
export async function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = new Promise(resolve =>
    persistCache({ cache, storage: localStorage })
      .then(() =>
        resolve(new ApolloClient({ cache, link, ssrForceFetchDelay: 100 }))));
  return await clientPromise;
}
