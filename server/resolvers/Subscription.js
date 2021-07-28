import * as C from '../constants.js';

export const messageSent = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(C.MESSAGE_SENT);
  },
};

export const userStatusUpdated = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(C.USER_STATUS_UPDATED);
  },
};

export const userLastSeenUpdated = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(C.USER_LAST_SEEN_UPDATED);
  },
};

export const userJoined = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(C.JOINED);
  },
};

export const userParted = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(C.PARTED);
  },
};
