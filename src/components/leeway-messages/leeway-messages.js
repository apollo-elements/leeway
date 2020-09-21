import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';
import format from 'date-fns/esm/fp/format';
import parseISO from 'date-fns/esm/fp/parseISO';

import compose from 'crocks/helpers/compose';

import { getUserStyleMap } from '../../lib/user-style-map';
import { isSameById } from '../../lib/is-same-by';

import shared from '../shared-styles.css';
import style from './leeway-messages.css';

import messageSentSubscription from './message-sent-subscription.graphql';
import userJoinedSubscription from '../../user-joined-subscription.graphql';
import userPartedSubscription from '../../user-parted-subscription.graphql';

/** msgTime :: String -> String */
const msgTime = compose(format('EEEE hh:mm aaa'), parseISO);

const errorTemplate = ({ message = 'Unknown Error' } = {}) => html`
  <h1>😢 Such Sad, Very Error! 😰</h1>
  <div>${message}</div>
`;

const getUserWithId = ({ id: localId, users }, id) => ({
  ...users.find(isSameById({ id })),
  me: localId === id,
});

const onMessageSent = (prev, { subscriptionData: { data: { messageSent } } }) => ({
  ...prev,
  messages: [...prev.messages, messageSent],
});

const messageTemplate = data => ({ message, userId, nick: original, date }) => {
  const { nick: current, status, me } = getUserWithId(data, userId);
  const nick = current || original;
  return html`
    <li data-initial="${nick.substring(0, 1).toUpperCase()}"
        class="${classMap({ user: true, me })}"
        style="${getUserStyleMap({ nick, status })}">
      <article>
        <span class="nick-time">${nick} <time>${msgTime(date)}</time></span>
        <span>${message}</span>
      </article>
    </li>
  `;
};

const viewTemplate = ({ data, error, loading }) =>
  loading ? html`Loading...` : html`
  ${error && errorTemplate(error)}
  <ol>${data && data.users && data.messages.map(messageTemplate(data))}</ol>
`;

/**
 * <leeway-messages>
 * @customElement
 * @extends ApolloQuery
 */
class LeewayMessages extends ApolloQuery {
  static get styles() {
    return [shared, style];
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
    const { onError } = this;
    const updateQuery = onMessageSent;
    this.subscribeToMore({ document: messageSentSubscription, onError, updateQuery });
    this.subscribeToMore({ document: userJoinedSubscription, onError });
    this.subscribeToMore({ document: userPartedSubscription, onError });
    this.scrollTop = this.scrollHeight;
  }

  updated(changedProps) {
    if (changedProps.has('data')) {
      this.scrollTo({
        behavior: 'smooth',
        top: this.scrollHeight,
      });
    }
  }

  onError(error) {
    this.error = error;
  }
}

customElements.define('leeway-messages', LeewayMessages);
