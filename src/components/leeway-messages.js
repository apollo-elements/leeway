import { ApolloQuery, css, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';
import { format, parseISO } from 'date-fns/fp';
import gql from 'graphql-tag';

import compose from 'crocks/helpers/compose';

import { getUserStyleMap } from '../lib/user-style-map';
import { isSameById } from '../lib/is-same-by';
import { style } from './shared-styles';
import _messageSentSubscription from '../message-sent-subscription.graphql';

const messageSentSubscription = gql(_messageSentSubscription);

import _userJoinedSubscription from '../user-joined-subscription.graphql';
const userJoinedSubscription = gql(_userJoinedSubscription);

import _userPartedSubscription from '../user-parted-subscription.graphql';
const userPartedSubscription = gql(_userPartedSubscription);

/** msgTime :: String -> String */
const msgTime = compose(format('HH:mm'), parseISO);

const errorTemplate = ({ message = 'Unknown Error' } = {}) => html`
  <h1>😢 Such Sad, Very Error! 😰</h1>
  <div>${message}</div>
`;

const getUserWithId = ({ id: localId, users }, id) => ({
  ...users.find(isSameById({ id })),
  me: localId === id
});

const onMessageSent = (prev, { subscriptionData: { data: { messageSent } } }) => ({
  ...prev,
  messages: [...prev.messages, messageSent],
});

const messageTemplate = data => ({ message, userId, date }) => {
  const { nick, status, me } = getUserWithId(data, userId);
  return html`
      <div class="${classMap({ user: true, me })}"
           style="${getUserStyleMap({ nick, status })}">
      <dt><time>${msgTime(date)}</time> ${nick}:</dt>
      <dd>${message}</dd>
    </div>
  `;
};

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

  render() {
    return html`${viewTemplate(this)}`;
  }

  constructor() {
    super();
    this.onError = this.onError.bind(this);
  }

  shouldUpdate() {
    return this.data || this.error || this.loading != null;
  }

  firstUpdated() {
    const onError = this.onError;
    this.subscribeToMore({ updateQuery: onMessageSent, document: messageSentSubscription, onError });
    this.subscribeToMore({ document: userJoinedSubscription, onError });
    this.subscribeToMore({ document: userPartedSubscription, onError });
    this.scrollTop = this.scrollHeight;
  }

  updated(changedProps) {
    if (changedProps.has('data')) this.scrollTo({
      behavior: 'smooth',
      top: this.scrollHeight,
    });
  }

  onError(error) {
    this.error = error;
  }
}

customElements.define('leeway-messages', LeewayMessages);
