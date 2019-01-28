import '@material/mwc-button';

import gql from 'graphql-tag';
import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { css } from 'lit-element';

import { style } from './shared-styles.js';
import { updateLocalUser } from '../lib/update-local-user.js';
import _userQuery from '../user-query.graphql';
const userQuery = gql(_userQuery);

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
    return (html`
      ${this.error && this.error}

      <input id="input"
          aria-label="Username"
          placeholder="Username"
          @keyup="${this.onUserKeyup}"/>
      <mwc-button id="submit"
          icon="check"
          ?disabled="${!this.variables || !this.variables.nick}"
          @click="${this.onSubmit}">OK</mwc-button>
    `);
  }

  static get properties() {
    return {
      nick: { type: String },
      variables: { type: Object },
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

  connectedCallback() {
    super.connectedCallback();
    this.queryObservable = this.client.watchQuery({ query: userQuery });
    this.queryObservable.subscribe({
      next: ({ data: { id } }) =>
        id ? this.close() : null,
      error: error => this.error = error,
    });
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
    this.variables = { nick };
    if (key === 'Enter') this.mutate();
  }

  async onCompletedMutation({ data: { join: user } }) {
    if (user) await updateLocalUser(this.client, user);
    this.close();
  }

}

customElements.define('leeway-username-input', LeewayUsernameInput);
