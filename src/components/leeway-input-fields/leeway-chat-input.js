import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { ifDefined } from 'lit-html/directives/if-defined';

import { $Mixin } from '../../lib/$-mixin';
import fields from './input-fields-styles.css';
import style from './leeway-chat-input.css';
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
class LeewayChatInput extends $Mixin(ApolloMutation) {
  static get styles() {
    return [shared, fields, style];
  }

  static get properties() {
    return {
      user: { type: Object },
    };
  }

  render() {
    const { nick } = this.user || {};
    const placeholder = nick ? 'Message the Channel' : undefined;
    return html`
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

    this.$input.value = '';
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

    this.$input.value = '';
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

  async submit(message) {
    if (message.startsWith('/')) return this.handleSlashCommand(message.substr(1));
    const { user: { id: userId } } = this;
    this.variables = { message, userId };
    const result = await this.mutate();
    this.$input.value = '';
    return result;
  }

  onClick() {
    this.submit(this.$input.value);
  }

  onKeyup({ key, target: { value: message } }) {
    this.ping(this.user.id);
    if (key === 'Enter') return this.submit(message);
  }

  onError(error) {
    this.dispatchEvent(new CustomEvent('mutation-error', {
      composed: true,
      bubbles: true,
      detail: { error, element: this },
    }));
  }
}

customElements.define('leeway-chat-input', LeewayChatInput);
