export const getDataUserId =
  x =>
    x &&
    x.data &&
    x.data.user &&
    x.data.user.id ||
    null;
