import { makeVar } from '@apollo/client/core';

export const localUserVar = makeVar({
  id: null,
  nick: null,
  status: navigator.onLine ? 'ONLINE' : 'OFFLINE',
});
