import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { WebSocketLink } from 'apollo-link-ws';

// Set up the WebSocket Link
const { hostname } = location;
const protocol = hostname.includes('localhost') ? 'ws' : 'wss';
const uri = `${protocol}://${hostname}/graphql`;
const options = { reconnect: true };
const link = new WebSocketLink({ uri, options });

const cache = new InMemoryCache();

// Create the Apollo Client
export const client = new ApolloClient({ cache, link });
