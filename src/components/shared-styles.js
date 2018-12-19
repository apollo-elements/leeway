import { html } from 'lit-apollo';

export const style = html`
  <style>
    :host {
      display: block;
      margin: 10px;
    }

    [hidden] {
      display: none !important;
    }

    .user-border {
      display: flex;
      border-radius: 4px;
      margin: 10px;
      padding: 14px;
      background: hsla(calc(var(--hue-coeff) * var(--primary-hue)) 50% 50% / 0.3);
    }

  </style>
`;
