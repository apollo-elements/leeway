import { isISOLessThanOneWeekAgo } from '../lib.js';

export function status({ status, lastSeen }) {
  switch (status) {
    case 'PARTED':
    case 'OFFLINE':
      return isISOLessThanOneWeekAgo(lastSeen) ? 'PARTED' : 'AWAY';
    default: return status;
  }
}
