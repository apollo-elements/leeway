import {
  JOINED,
  MESSAGE_SENT,
  PARTED,
  USER_LAST_SEEN_UPDATED,
  USER_STATUS_UPDATED,
} from './constants';

export const messageSent = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(MESSAGE_SENT);
  },
};

export const userStatusUpdated = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(USER_STATUS_UPDATED);
  },
};

export const userLastSeenUpdated = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(USER_LAST_SEEN_UPDATED);
  },
};

export const userJoined = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(JOINED);
  },
};

export const userParted = {
  subscribe(_, __, { pubsub }) {
    return pubsub.asyncIterator(PARTED);
  },
};
