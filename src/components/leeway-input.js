import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { css } from 'lit-element';
import gql from 'graphql-tag';

import { style } from './shared-styles.js';
import { updateLocalUser } from '../lib/update-local-user.js';
import _changeNicknameMutation from '../change-nickname-mutation.graphql';
const changeNicknameMutation = gql(_changeNicknameMutation);
import _userQuery from '../user-query.graphql';
const userQuery = gql(_userQuery);

class LeewayInput extends ApolloMutation {
  static get styles() {
    return [style, css`
      :host {
        max-width: 100%;
        display: flex;
        align-items: center;
      }

      input {
        flex: 1 1 auto;
        height: 100%;
      }

      mwc-button {
        width: 100%;
        flex: 0 1 54px;
      }
    `];
  }

  render() {
    const { nick } = this.user || {};
    return html`
      ${this.error && this.error}

      <input id="input"
          aria-label="Message"
          placeholder="${nick ? `${nick}: ` : ''}"
          ?disabled="${!nick}"
          @keyup="${this.onKeyup}"/>
      <mwc-button id="submit-message"
          icon="send"
          @click="${this.onClick}">Send</mwc-button>
    `;
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
    this.user = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this.queryObservable = this.client.watchQuery({ query: userQuery });
    this.queryObservable.subscribe({
      next: ({ data: { id, nick, status } }) => this.user = { id, nick, status },
      error: error => this.error = error,
    });
  }

  firstUpdated() {
    this.input.focus();
  }

  async changeUsername() {
    const nick = this.input.value.replace('/nick ', '');
    const { user: { id } } = this;
    const variables = { nick, id };
    const { graphQLErrors = [], networkError, data } =
      // will fire onCompletedMutation
      await this.mutate({ mutation: changeNicknameMutation, variables });
    if (graphQLErrors.length) throw new Error(graphQLErrors);
    if (networkError) throw new Error(networkError);
    if (!data) throw new Error('Unexpected error');
    await updateLocalUser(this.client, { id, nick });
    this.input.value = '';
    this.input.focus();
  }

  submit(message) {
    const { user: { id: user } } = this;
    this.variables = { message, user };
    return this.mutate();
  }

  onClick() {
    this.submit(this.input.value);
  }

  onKeyup({ key, target: { value: message } }) {
    if (key !== 'Enter') return;
    if (this.input.value.startsWith('/nick ')) return this.changeUsername();
    return this.submit(message);
  }

  onCompletedMutation() {
    this.input.value = '';
  }

}

customElements.define('leeway-input', LeewayInput);
