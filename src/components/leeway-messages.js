import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { css } from 'lit-element';

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
  <div>${message}</div>
`;

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

const viewTemplate = ({ data, error, loading }) =>
  loading ? html`Loading...`
  : error ? errorTemplate(error)
  : html`<dl>${data && data.users && data.messages.map(messageTemplate(data))}</dl>`;

/**
 * <leeway-messages>
 * @customElement
 * @extends ApolloQuery
 */
class LeewayMessages extends ApolloQuery {
  static get styles() {
    return [style, css`
      time {
        font-family: monospace;
      }

      dl {
        margin: 0;
      }
    `];
  }

  static get is() {
    return 'leeway-messages';
  }

  render() {
    return html`${viewTemplate(this)}`;
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
