import { ApolloMutation, html } from 'lit-apollo';

import { client } from '../client.js';
import { style } from './shared-styles';

import '@material/mwc-button';

class LeewayUsernameInput extends ApolloMutation {
  render() {
    return html`
      ${style}
      <style>
        :host {
          display: flex;
          align-items: center;
          padding: 28px;
          background: white;
          z-index: 10;
        }

        :host([closed]) {
          display: none;
        }

        div {
          font-family: ubuntu arial sans;
          display: flex;
        }

        input {
          flex: 1 1 auto;
        }

        mwc-button {
          width: 100%;
          flex: 0 1 54px;
        }
      </style>

      ${this.error && this.error}

      <input id="input"
          aria-label="Username"
          placeholder="Username"
          @keyup="${this.onUserKeyup}"/>
      <mwc-button id="submit"
          icon="check"
          ?disabled="${!this.userinput}"
          @click="${this.onSubmit}">OK</mwc-button>
    `;
  }

  static get is() {
    return 'leeway-username-input';
  }

  static get properties() {
    return {
      nick: { type: String },
      user: { type: Object },
      closed: { type: Boolean, reflect: true },
    };
  }

  get input() {
    return this.$('input');
  }

  $(id) {
    return this.shadowRoot && this.shadowRoot.getElementById(id) || null;
  }

  constructor() {
    super();
    this.userinput = '';
    this.client = client;
  }

  connectedCallback() {
    super.connectedCallback();
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) this.close();
  }

  firstUpdated() {
    this.input.focus();
  }

  close() {
    this.closed = true;
  }

  onSubmit() {
    if (this.input.value) this.mutate();
  }

  onUserKeyup({ key, target: { value: nick } }) {
    (nick && key === 'Enter')
      ? this.mutate()
      : this.variables = { nick };
  }

  onCompletedMutation({ data: { join, changeNickname } }) {
    this.user = join || changeNickname;
    localStorage.setItem('user', JSON.stringify(join));
    this.close();
  }

}

customElements.define(LeewayUsernameInput.is, LeewayUsernameInput);
