import { styleMap } from 'lit-html/directives/style-map';
import compose from 'crocks/helpers/compose';

export const getUserStyleMap = compose(styleMap, ({ nick, status }) => ({
  '--hue-coeff': (nick && nick.length) || 1,
  '--saturation': status === 'ONLINE' ? '50%' : '20%',
}));
