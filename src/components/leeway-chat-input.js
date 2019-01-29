import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import gql from 'graphql-tag';
import { ifDefined } from 'lit-html/directives/if-defined';

import { LeewayInputMixin } from './leeway-input-mixin';
import { inputStyles } from './input-fields-styles';
import { style } from './shared-styles.js';

import _changeNicknameMutation from '../change-nickname-mutation.graphql';
const changeNicknameMutation = gql(_changeNicknameMutation);

class LeewayChatInput extends LeewayInputMixin(ApolloMutation) {
  static get styles() {
    return [style, inputStyles];
  }

  render() {
    const { nick } = this.user || {};
    const placeholder = nick ? 'Message the Channel' : undefined;
    return html`
      ${this.error && this.error}

      <input id="input"
          aria-label="Message"
          placeholder="${ifDefined(placeholder)}"
          ?disabled="${!nick}"
          @keyup="${this.onKeyup}"/>
      <mwc-button id="submit-message"
          icon="send"
          @click="${this.onClick}">Send</mwc-button>
    `;
  }

  static get properties() {
    return {
      userinput: { type: String },
    };
  }

  constructor() {
    super();
    this.userinput = '';
  }

  async changeUsername(nick) {
    const { user: { id } } = this;
    const variables = { nick, id };
    const mutation = changeNicknameMutation;
    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    const update = (cache, { data: { changeNickname: { id, nick } } }) =>
      cache.writeData({ id, nick, status });
    await this.mutate({ mutation, variables, update });
    this.user = { nick, id, status };
  }

  async part() {
    const { id } = this.user;
    const mutation = gql`mutation Part($id: ID!) { part(id: $id) }`;
    const variables = { id };
    const user = { id: null, nick: null, status: navigator.onLine ? 'ONLINE' : 'OFFLINE' };
    const update = cache => cache.writeData(user);
    await this.mutate({ mutation, variables, update });
  }

  handleSlashCommand(message) {
    const [command, ...args] = message.split(' ');
    switch (command) {
    case 'nick': return this.changeUsername(args[0]);
    case 'part': return this.part();
    }
  }

  submit(message) {
    if (message.startsWith('/')) return this.handleSlashCommand(message.substr(1));
    const { user: { id: userId } } = this;
    this.variables = { message, userId };
    return this.mutate();
  }

  onClick() {
    this.submit(this.input.value);
  }

  onKeyup({ key, target: { value: message } }) {
    if (key === 'Enter') return this.submit(message);
  }

}

customElements.define('leeway-chat-input', LeewayChatInput);
