import propPathOr from 'crocks/helpers/propPathOr';

export const getDataUserId = propPathOr(null, ['data', 'user', 'id']);
