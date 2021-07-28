export async function user({ userId }, _, { user }) {
  return await user.getUser(userId);
}
