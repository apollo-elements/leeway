import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

// Set up the WebSocket Link
const { host } = location;
const protocol = host.includes('localhost') ? 'ws' : 'wss';
const options = { reconnect: true };

const httpLink = new HttpLink({
  uri: `http://${host}/graphql`
});

const wsLink = new WebSocketLink({
  uri: `${protocol}://${host}/graphql`,
  options
});

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const cache = new InMemoryCache();

// Create the Apollo Client
export const client = new ApolloClient({ cache, link });

// Hook into apollo dev tools
window.__APOLLO_CLIENT__ = client;
