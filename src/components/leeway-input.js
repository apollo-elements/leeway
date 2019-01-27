import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { css } from 'lit-element';
import gql from 'graphql-tag';

import { client } from '../client.js';
import { get, set } from '../lib/storage';
import { style } from './shared-styles';

class LeewayInput extends ApolloMutation {
  static get styles() {
    return [style, css`
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
    `];
  }

  render() {
    return html`
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
    const user = get('user');
    if (!user || !user.id) return;
    this.user = user;
  }

  firstUpdated() {
    this.input.focus();
  }

  async changeUsername() {
    const nick = this.input.value.replace('/nick ', '');
    const { id } = get('user');
    const variables = { nick, id };
    const mutation = gql`
      mutation ChangeNickname($id: ID!, $nick: String!) {
        changeNickname(id: $id, nick: $nick) {
          id
          nick
          status
        }
      }`;
    const { graphQLErrors = [], networkError, data } = await this.mutate({ mutation, variables });
    if (graphQLErrors.length) throw new Error(graphQLErrors);
    if (networkError) throw new Error(networkError);
    if (!data) throw new Error('Unexpected error');
    const { status } = data.changeNickname;
    set('user', { id, nick, status });
    this.user = { id, nick, status };
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
