import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { ifDefined } from 'lit-html/directives/if-defined';

import { LeewayInputMixin } from './leeway-input-mixin';
import style from './input-fields-styles.css';
import shared from '../shared-styles.css';

import changeNicknameMutation from './change-nickname-mutation.graphql';
import partMutation from './part-mutation.graphql';

import { localUserVar } from '../../variables';

import { gql } from '@apollo/client/core';

class LeewayChatInput extends LeewayInputMixin(ApolloMutation) {
  static get styles() {
    return [shared, style];
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
      localUserVar({ id, nick, status });

    await this.mutate({
      mutation,
      variables,
      update,
      optimisticResponse: {
        __typename: 'Mutation',
        changeNickname: {
          __typename: 'User',
          id,
          nick,
          status,
        },
      },
    });

    this.user = { nick, id, status };
    localStorage.setItem('leeway-user', JSON.stringify(this.user));
  }

  async part() {
    const { id } = this.user;
    const mutation = partMutation;
    const variables = { id };

    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';

    await this.mutate({
      mutation,
      variables,
      update: cache => {
        cache.writeFragment({
          id: `User:${id}`,
          fragment: gql`fragment userStatus on user { status }`,
          data: { status: 'OFFLINE' },
        });
      },
      optimisticResponse: {
        __typename: 'Mutation',
        part: {
          __typename: 'User',
          id: null,
          nick: null,
          status,
        },
      },
    }).then(() => {
      localUserVar({ id: null, nick: null, status });
      localStorage.removeItem('leeway-user');
    });
  }

  handleSlashCommand(message) {
    const [command, ...args] = message.split(' ');
    switch (command) {
      case 'nick': return this.changeUsername(...args);
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
