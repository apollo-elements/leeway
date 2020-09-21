import { styleMap } from 'lit-html/directives/style-map';

export const getUserStyleMap =
  ({ nick, status }) =>
    styleMap({
      '--hue-coeff': (nick && nick.length) || 1,
      '--saturation': status === 'ONLINE' ? '50%' : '20%',
    });
