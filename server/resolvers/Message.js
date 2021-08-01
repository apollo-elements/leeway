export async function user({ userId }, _, { models }) {
  return await models.User.getUser(userId);
}
