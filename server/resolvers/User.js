import { isISOLessThanOneWeekAgo } from '../lib.js';

export function status({ status, lastSeen }) {
  switch (status) {
    case 'PARTED':
    case 'OFFLINE':
      return isISOLessThanOneWeekAgo(lastSeen) ? 'PARTED' : 'AWAY';
    default: return status;
  }
}

export async function isMe({ id }, __, context) {
  if (!context)
    throw new Error('no context!');
  await context.wsSessionReady;
  return context.user?.id && id === context.user.id;
}
