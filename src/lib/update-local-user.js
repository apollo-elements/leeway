import gql from 'graphql-tag';

import userMutation from '../user-mutation.graphql';

export async function updateLocalUser(client, { id, nick }) {
  const variables = { id, nick, status: navigator.onLine ? 'ONLINE' : 'OFFLINE' };
  const mutation = gql(userMutation);
  const { graphQLErrors = [], networkError, data } =
    await client.mutate({ mutation, variables });
  if (graphQLErrors.length) throw new Error(graphQLErrors);
  if (networkError) throw new Error(networkError);
  if (!data) throw new Error('Unexpected error');
  const { user } = data;
  return user;
}
