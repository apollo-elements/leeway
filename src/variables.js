import { makeVar } from '@apollo/client/core';

const user = {
  id: null,
  nick: null,
  status: null,
  ...JSON.parse(localStorage.getItem('leeway-user')),
};

export const localUserVar = makeVar(user);
