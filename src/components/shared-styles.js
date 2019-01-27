import { css } from 'lit-element';

export const style = css`
  :host {
    display: block;
  }

  [hidden] {
    display: none !important;
  }

  .user {
    display: flex;
    padding: 14px;
    background: hsla(calc(var(--hue-coeff) * var(--primary-hue)) var(--saturation, 50%) 50% / 0.3);
  }
`;
