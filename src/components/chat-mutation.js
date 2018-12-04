import { ApolloMutation, html } from 'lit-apollo';
import gql from 'graphql-tag';

import { client } from '../client.js';
import { style } from './shared-styles';

import '@material/mwc-button';

class ChatMutation extends ApolloMutation {
  render() {
    return html`
      ${style}
      <style>
        :host {
          max-width: 100%;
        }

        div {
          font-face: ubuntu arial sans;
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

      <div ?hidden="${this.username}">
        <input id="user-input"
            aria-label="Username"
            placeholder="Username"
            @keyup="${this.onUserKeyup}"/>
        <mwc-button id="submit-user"
            icon="check"
            ?disabled="${!this.userinput}"
            @click="${this.onSubmitUsername}">OK</mwc-button>
      </div>

      <div ?hidden="${!this.username}">
        <input id="message-input"
            aria-label="Message"
            placeholder="Message"
            @keyup="${this.onMessageKeyup}"/>
        <mwc-button id="submit-message"
            icon="send"
            @click="${this.send}">Send</mwc-button>
      </div>

    `;
  }

  static get properties() {
    return {
      userinput: { type: String },
      username: { type: String },
    };
  }

  $(id) {
    return this.shadowRoot && this.shadowRoot.getElementById(id) || null;
  }

  constructor() {
    super();
    this.userinput = '';
    this.client = client;
    this.mutation = gql`
      mutation sendMessage($user: String, $message: String) {
        sendMessage(user: $user, message: $message) {
          date
          message
          user
        }
      }
    `;
  }

  firstUpdated() {
    const input = this.$('user-input');
    input && input.focus();
  }

  onSubmitUsername(event) {
    this.username = this.userinput;
    setTimeout(() => {
      this.$('message-input').focus();
    });
  }

  onMessageKeyup({ key }) {
    if (key === 'Enter') this.send();
  }

  onUserKeyup({ key, target: { value: username } }) {
    (username && key === 'Enter')
      ? this.$('submit-user').click()
      : this.userinput = username;
  }

  async send() {
    const input = this.$('message-input');
    const user = this.username;
    const message = input.value;
    this.variables = { user, message };
    await this.mutate();
    input.value = '';
    input.focus();
  }
}

customElements.define('chat-mutation', ChatMutation);
