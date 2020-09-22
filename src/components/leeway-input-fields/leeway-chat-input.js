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

class LeewayChatInput extends LeewayInputMixin(ApolloMutation) {
  static get styles() {
    return [shared, style];
  }

  static get properties() {
    return {
      userinput: { type: String },
    };
  }

  get input() {
    return this.shadowRoot && this.shadowRoot.getElementById('input');
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

  constructor() {
    super();
    this.userinput = '';
    this.ping = debounce(this.ping.bind(this), 1000);
  }

  async changeUsername(nick) {
    const { user: { id } } = this;
    const variables = { nick, id };
    const mutation = ChangeNicknameMutation;
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
    const mutation = PartMutation;
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

  ping() {
    this.mutate({ mutation: UpdateLastSeenMutation, variables: { userId: this.user.id } });
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
    this.ping();
    if (key === 'Enter') return this.submit(message);
  }
}

customElements.define('leeway-chat-input', LeewayChatInput);
