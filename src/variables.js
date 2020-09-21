import { makeVar } from '@apollo/client/core';

const user =
  JSON.parse(localStorage.getItem('leeway-user')) || {
    id: null,
    nick: null,
    status: navigator.onLine ? 'ONLINE' : 'OFFLINE',
  };

export const localUserVar = makeVar(user);
