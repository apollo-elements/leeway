import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { css } from 'lit-element';

import { client } from '../client.js';
import { get, set } from '../lib/storage';
import { style } from './shared-styles';

class LeewayUsernameInput extends ApolloMutation {
  static get styles() {
    return [style, css`
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
    `];
  }

  render() {
    return html`
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
    const user = get('user');
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
    set('user', join);
    this.close();
  }

}

customElements.define(LeewayUsernameInput.is, LeewayUsernameInput);
