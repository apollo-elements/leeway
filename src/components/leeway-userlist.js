import { LitElement, html } from '@polymer/lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import compose from 'crocks/helpers/compose';

const getStyleMap = compose(styleMap, ({ nick, status }) => ({
  '--hue-coeff': nick.length,
  '--saturation': status === 'ONLINE' ? '0%' : '50%'
}));

const userTemplate = ({ nick, status }) => (html`
  <div style=${getStyleMap({ nick, status })}>${nick}</div>
`);

/**
 * <leeway-userlist>
 * @customElement
 * @extends LitElement
 */
class LeewayUserlist extends LitElement {
  render() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      ${this.users.map(userTemplate)}
    `;
  }

  static get is() {
    return 'leeway-userlist';
  }

  static get properties() {
    return {
      users: { type: Array }
    };
  }

  constructor() {
    super();
    this.users = [];
  }
}

customElements.define(LeewayUserlist.is, LeewayUserlist);
