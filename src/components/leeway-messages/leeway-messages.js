import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';

import relativeDate from 'tiny-relative-date';

import { getUserStyleMap } from '../../lib/user-style-map';

import shared from '../shared-styles.css';
import style from './leeway-messages.css';

import messageSentSubscription from './message-sent-subscription.graphql';
import userJoinedSubscription from '../../user-joined-subscription.graphql';
import userPartedSubscription from '../../user-parted-subscription.graphql';
import UserLastSeenUpdatedSubscription from '../../UserLastSeenUpdated.subscription.graphql';

import { ONE_WEEK } from '../../lib/constants';

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} nick
 * @property {'OFFLINE'|'ONLINE'|'PARTED'} status
 * @property {string} lastSeen
 */

/**
 * @typedef {object} Message
 * @property {string} date
 * @property {string} message
 * @property {string} userId
 * @property {string} nick
 */

/**
 * ```graphql
 * query Messages {
 *
 *   localUser @client {
 *     id
 *     nick
 *     status
 *   }
 *
 *   messages {
 *     date
 *     message
 *     userId
 *     nick
 *   }
 *
 *   users {
 *     id
 *     nick
 *     status
 *     lastSeen
 *   }
 * }
 * ```
 * @typedef {object} LeewayMessagesQuery
 * @property {LocalUser} localUser
 * @property {readonly Message[]} messages
 * @property {readonly User[]} users
 */

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  weekday: 'long',
  month: 'long',
  year: 'numeric',
});

/**
 * msgTime :: String -> String
 * @param {string} iso
 * @return {string} formatted string
 */
function msgTime(iso) {
  const mtime = new Date(iso);
  const today = new Date();
  if (Math.abs(today - mtime) > ONE_WEEK)
    return longDateFormatter.format(mtime);
  else
    return relativeDate(mtime);
}

const errorTemplate = ({ message = 'Unknown Error' } = {}) => html`
  <h1>😢 Such Sad, Very Error! 😰</h1>
  <div>${message}</div>
`;

const getUserWithId = ({ id: localId, users }, id) => ({
  ...users.find(user => user.id === id),
  me: localId === id,
});

const onMessageSent = (prev, { subscriptionData: { data: { messageSent } } }) => ({
  ...prev,
  messages: [...prev.messages, messageSent],
});

/**
 * <leeway-messages>
 * @customElement
 * @extends {ApolloQuery<LeewayMessagesQuery, null>}
 */
class LeewayMessages extends ApolloQuery {
  static get styles() {
    return [shared, style];
  }

  render() {
    const { data, error, loading } = this;
    return (
      loading ? html`Loading...` : html`
      ${error && errorTemplate(error)}
      <ol>
      ${data && data.users && data.messages.map(({ message, userId, nick: original, date }) => {
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
      })}
      </ol>
      `
    );
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
    this.subscribeToMore({ document: UserLastSeenUpdatedSubscription, onError });
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
