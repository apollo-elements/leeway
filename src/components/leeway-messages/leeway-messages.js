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
 * @property {import('../leeway-userlist/leeway-userlist').LocalUser} localUser
 * @property {readonly Message[]} messages
 * @property {readonly import('../leeway-userlist/leeway-userlist').User[]} users
 */

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  weekday: 'long',
  month: 'long',
  year: 'numeric',
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
    const { data, error } = this;
    const messages = data && data.users && data.messages || [];
    return html`
      <aside id="error" ?hidden="${!error}">
        <h1 >😢 Such Sad, Very Error! 😰</h1>
        <pre>${error && error.message || 'Unknown Error'}</pre>
      </aside>
      <ol>
      ${messages.map(msg => {
        const { message, userId, nick: original, date } = msg;
        const messageUser = data.users.find(user => user.id === userId);
        const nick = messageUser.nick || original;
        const me = messageUser.userId === this.data.localUser.id;
        return html`
          <li data-initial="${nick.substring(0, 1).toUpperCase()}"
              class="user ${classMap({ me })}"
              style="${getUserStyleMap({ nick, status })}">
            <article>
              <span class="nick-time">${nick} <time>${this.msgTime(date)}</time></span>
              <span>${message}</span>
            </article>
          </li>
        `;
      })}
      </ol>
    `;
  }

  firstUpdated() {
    const onError = error => this.error = error;
    this.scrollTop = this.scrollHeight;
    this.subscribeToMore({ document: userJoinedSubscription, onError });
    this.subscribeToMore({ document: userPartedSubscription, onError });
    this.subscribeToMore({ document: UserLastSeenUpdatedSubscription, onError });
    this.subscribeToMore({
      document: messageSentSubscription,
      onError,
      updateQuery(prev, { subscriptionData: { data: { messageSent } } }) {
        return {
          ...prev,
          messages: [...prev.messages, messageSent],
        };
      },
    });
  }

  updated(changedProps) {
    if (changedProps.has('data'))
      this.scrollToLatest();
  }

  /**
   * msgTime :: String -> String
   * @param {string} iso
   * @return {string} formatted string
   */
  msgTime(iso) {
    const mtime = new Date(iso);
    const today = new Date();
    if (Math.abs(today - mtime) > ONE_WEEK)
      return longDateFormatter.format(mtime);
    else
      return relativeDate(mtime);
  }

  scrollToLatest() {
    this.scrollTo({
      behavior: 'smooth',
      top: this.scrollHeight,
    });
  }
}

customElements.define('leeway-messages', LeewayMessages);
