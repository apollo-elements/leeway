import { makeVar } from '@apollo/client/core';

const user =
  JSON.parse(localStorage.getItem('leeway-user')) || {
    id: null,
    nick: null,
    status: navigator.onLine ? 'ONLINE' : 'OFFLINE',
  };

export const localUserVar = makeVar(user);

const wideQuery = window.matchMedia('min-width: 400px');
export const wideVar = makeVar(!!wideQuery.matches);

wideQuery.addEventListener('change', event => wideVar(!!event.matches));
