import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { ifDefined } from 'lit-html/directives/if-defined';

import { LeewayInputMixin } from './leeway-input-mixin';
import style from './input-fields-styles.css';
import shared from '../shared-styles.css';

import ChangeNicknameMutation from './ChangeNickname.mutation.graphql';
import PartMutation from './Part.mutation.graphql';
import UpdateLastSeenMutation from './UpdateUserLastSeen.mutation.graphql';

import { localUserVar } from '../../variables';

import { gql } from '@apollo/client/core';

import { debounce } from 'mini-debounce';

/**
 * ```graphql
 * mutation sendMessage($userId: ID!, $message: String!) {
 *   sendMessage(userId: $userId, message: $message) {
 *     date
 *     message
 *     userId
 *   }
 * }
 * ```
 * @typedef {object} LeewayChatInputMutationData
 * @property {string} date
 * @property {string} message
 * @property {string} userId
 */

/**
 * @typedef {object} LeewayChatInputMutationVariables
 * @property {string} userId
 * @property {string} message
 */

/**
 * @customElement leeway-chat-input
 * @extends {ApolloMutation<LeewayChatInputMutationData, LeewayInputMutationVariables>}
 */
class LeewayChatInput extends LeewayInputMixin(ApolloMutation) {
  static get styles() {
    return [shared, style];
  }

  render() {
    const { nick } = this.user || {};
    const placeholder = nick ? 'Message the Channel' : undefined;
    return html`
      <aside id="error" ?hidden="${!this.error}">
        <h1>😢 Such Sad, Very Error! 😰</h1>
        <pre>${this.error && this.error.message || 'Unknown Error'}</pre>
      </aside>

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

  constructor() {
    super();
    this.ping = debounce(this.ping.bind(this), 1000);
  }

  async changeUsername(nick) {
    const { user: { id } } = this;
    const variables = { nick, id };
    const mutation = ChangeNicknameMutation;
    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';

    await this.mutate({
      mutation,
      variables,
      update(_cache, { data: { changeNickname: { id, nick } } }) {
        localUserVar({ id, nick, status });
      },
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
    const mutation = PartMutation;
    const variables = { id };

    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';

    await this.mutate({
      mutation,
      variables,
      update(cache) {
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
    });

    localUserVar({ id: null, nick: null, status });

    localStorage.removeItem('leeway-user');
  }

  handleSlashCommand(message) {
    const [command, ...args] = message.split(' ');
    switch (command) {
      case 'nick': return this.changeUsername(...args);
      case 'part': return this.part();
    }
  }

  ping(userId = this.user.id) {
    if (userId)
      this.mutate({ mutation: UpdateLastSeenMutation, variables: { userId } });
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
    this.ping(this.user.id);
    if (key === 'Enter') return this.submit(message);
  }
}

customElements.define('leeway-chat-input', LeewayChatInput);
