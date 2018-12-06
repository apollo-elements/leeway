import { ApolloQuery, html } from 'lit-apollo';

import { client } from '../client';
import { style } from './shared-styles';

import { format } from 'date-fns/fp';
import { styleMap } from 'lit-html/directives/style-map';
import gql from 'graphql-tag';

const msgTime = format('HH:mm');

const errorTemplate = ({ message = 'Unknown Error' } = {}) => html`
  <h1>😢 Such Sad, Very Error! 😰</h1>
  <div>${message}</div>`;

const messageTemplate = ({ message, user, date }) => html`
  <div style=${styleMap({ '--hue-coeff': user.length })}>
    <dt><time>${msgTime(date)}</time> ${user}:</dt>
    <dd>${message}</dd>
  </div>
`;

/**
 * <chat-query>
 * @customElement
 * @extends ApolloQuery
 */
class ChatQuery extends ApolloQuery {
  render() {
    return html`
    ${style}
    <style>
      dl > div {
        display: flex;
        border-radius: 4px;
        margin: 10px;
        padding: 14px;
        background: hsla(calc(var(--hue-coeff) * var(--primary-hue)) 50% 50% / 0.3);
      }

      time {
        font-family: monospace;
      }
    </style>

    ${(
    this.loading ? html`Loading...`
    : this.error ? errorTemplate(this.error)
    : html`<dl>${this.data.messages.map(messageTemplate)}</dl>`
  )}
    `;

  }

  static get is() {
    return 'chat-query';
  }

  constructor() {
    super();
    this.client = client;
  }

  updateQuery(prev, { subscriptionData }) {
    if (!subscriptionData.data) return prev;
    return {
      ...prev,
      messages: [...prev.messages, subscriptionData.data.messageSent]
    };
  }

  firstUpdated() {
    const { updateQuery } = this;
    this.subscribeToMore({
      updateQuery,
      document: gql`
        subscription {
          messageSent {
            date
            message
            user
          }
        }`
    });
  }

  shouldUpdate() {
    return this.data || this.error || this.loading != null;
  }
}

customElements.define(ChatQuery.is, ChatQuery);
