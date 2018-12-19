import { ApolloQuery, html } from 'lit-apollo';

import { client } from '../client';
import { style } from './shared-styles';

import { format } from 'date-fns/fp';
import { styleMap } from 'lit-html/directives/style-map';
import gql from 'graphql-tag';
import compose from 'crocks/helpers/compose';
import propOr from 'crocks/helpers/propOr';
import isSame from 'crocks/predicates/isSame';

const msgTime = format('HH:mm');

const errorTemplate = ({ message = 'Unknown Error' } = {}) => html`
  <h1>😢 Such Sad, Very Error! 😰</h1>
  <div>${message}</div>`;

const isSameUserId = user => compose(isSame(user), propOr(null, 'id'));

const messageTemplate = cache => ({ message, user, date }) => {
  const { query } = document.querySelector('leeway-userlist');
  const { nick } = cache.readQuery({ query }).users.find(isSameUserId(user));
  return html`
    <div class="user-border" style=${styleMap({ '--hue-coeff': nick.length })}>
      <dt><time>${msgTime(date)}</time> ${nick}:</dt>
      <dd>${message}</dd>
    </div>
  `;
};

const updateQuery = (prev, { subscriptionData: { data } }) => !data ? prev : ({
  ...prev,
  messages: [
    ...prev.messages,
    data.messageSent
  ]
});

/**
 * <leeway-messages>
 * @customElement
 * @extends ApolloQuery
 */
class LeewayMessages extends ApolloQuery {
  render() {
    return html`
    ${style}
    <style>
      time {
        font-family: monospace;
      }
    </style>

    ${(
    this.loading ? html`Loading...`
    : this.error ? errorTemplate(this.error)
    : html`<dl>${this.data && this.data.messages.map(messageTemplate(this.client.cache))}</dl>`
  )}
    `;

  }

  static get is() {
    return 'leeway-messages';
  }

  constructor() {
    super();
    this.client = client;
  }

  firstUpdated() {
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

customElements.define(LeewayMessages.is, LeewayMessages);
