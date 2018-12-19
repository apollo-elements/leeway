import { ApolloMutation, html } from 'lit-apollo';

import { client } from '../client.js';
import { style } from './shared-styles';

import gql from 'graphql-tag';
import '@material/mwc-button';

class LeewayInput extends ApolloMutation {
  render() {
    return html`
      ${style}
      <style>
        :host {
          max-width: 100%;
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
          aria-label="Message"
          placeholder="${this.user.nick}: "
          @keyup="${this.onKeyup}"/>
      <mwc-button id="submit-message"
          icon="send"
          @click="${this.mutate}">Send</mwc-button>
    `;
  }

  static get is() {
    return 'leeway-input';
  }

  static get properties() {
    return {
      user: { type: Object },
      userinput: { type: String },
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
    this.user = {};
  }

  connectedCallback() {
    super.connectedCallback();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;
    this.user = user;
  }

  firstUpdated() {
    this.input.focus();
  }

  async changeUsername() {
    const nick = this.input.value.replace('/nick ', '');
    const variables = { nick };
    const mutation = gql`
      mutation ChangeNickname($id: ID!, $nick: String!) {
        join(id: $id, nick: $nick) {
          id
          nick
          status
        }
      }`;
    const user = await this.mutate({ mutation, variables });
    localStorage.setItem('user', JSON.stringify(user));
    this.input.value = '';
    this.input.focus();
  }

  onKeyup({ key, target: { value: message } }) {
    if (key !== 'Enter') return;
    if (this.input.value.startsWith('/nick ')) return this.changeUsername();
    const { id: user } = this.user;
    this.variables = { message, user };
    this.mutate();
  }

  onUserKeyup({ key, target: { value } }) {
    (value && key === 'Enter')
      ? this.mutate()
      : this.userinput = value;
  }

  onCompletedMutation({ data }) {
    this.input.value = '';
  }

}

customElements.define(LeewayInput.is, LeewayInput);
