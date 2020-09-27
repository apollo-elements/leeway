import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';
import { $Mixin } from '../../lib/$-mixin';

import '@material/mwc-snackbar';

import { getUserStyleMap } from '../../lib/user-style-map';
import UserLastSeenUpdatedSubscription from '../../UserLastSeenUpdated.subscription.graphql';
import UserStatusUpdatedSubscription from '../../UserStatusUpdated.subscription.graphql';
import userPartedSubscription from '../../user-parted-subscription.graphql';
import userJoinedSubscription from '../../user-joined-subscription.graphql';

import shared from '../shared-styles.css';
import style from './leeway-userlist.css';

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} nick
 * @property {'OFFLINE'|'ONLINE'|'PARTED'} status
 * @property {string} lastSeen
 */

/**
 * @typedef {Omit<User, 'lastSeen'>} LocalUser
 */

const isNotParted =
  user =>
    user && user.status !== 'PARTED';

const onLastSeenUpdated = (prev, { subscriptionData: { data: { userLastSeenUpdated } } }) => {
  const users = [...prev.users];
  const index = users.findIndex(x => x.id === userLastSeenUpdated.id);
  users[index] = { ...users[index], ...userLastSeenUpdated };
  return { ...prev, users };
};

const onStatusUpdated = (prev, { subscriptionData: { data: { userStatusUpdated } } }) => ({
  ...prev,
  users: [
    userStatusUpdated,
    ...prev.users.filter(user => user.id !== userStatusUpdated.id),
  ].filter(isNotParted),
});

/**
 * ```graphql
 * query Users {
 *   localUser @client {
 *     id
 *     nick
 *     status
 *   }
 *   users {
 *     id
 *     nick
 *     status
 *     lastSeen
 *   }
 * }
 * ```
 * @typedef {Object} LeewayUserlistQueryData
 * @property {LocalUser} localUser
 * @property {readonly User[]} users
 */

/**
 * <leeway-userlist>
 * @customElement
 * @extends {ApolloQuery<LeewayUserlistQueryData, null}
 */
class LeewayUserlist extends $Mixin(ApolloQuery) {
  static get styles() {
    return [shared, style];
  }

  render() {
    const users = this.data && this.data.users || [];
    const localUser = this.data && this.data.localUser || { nick: '', status: 'OFFLINE', id: '' };
    const myStatus = localUser.status.toLowerCase();
    return (html`
      <aside id="error" ?hidden="${!this.error}">
        <h1>😢 Such Sad, Very Error! 😰</h1>
        <pre>${this.error && this.error.message || 'Unknown Error'}</pre>
      </aside>

      <section id="links"><slot name="links"></slot></section>
      <section id="users">
        <header style="${getUserStyleMap(localUser)}" class="${classMap({ invisible: !localUser.id })}">
          <span role="presentation" class="status ${myStatus}"></span>
          <span class="nick">${localUser.nick}</span>
        </header>
        ${users.filter(user => user.id !== localUser.id).map(({ nick, status } = {}) => (html`
        <div class="user" style="${getUserStyleMap({ nick, status })}">
          <span aria-label="${status}" class="status ${classMap({ ...status && { [status.toLowerCase()]: true } })}"></span>
          ${nick}
        </div>
      `))}
      </section>
    `);
  }

  firstUpdated() {
    const onError = error => this.error = error;
    const userJoined = this.userJoined.bind(this);
    const userParted = this.userParted.bind(this);
    // eslint-disable-next-line max-len
    this.subscribeToMore({ updateQuery: onStatusUpdated, document: UserStatusUpdatedSubscription, onError });
    // eslint-disable-next-line max-len
    this.subscribeToMore({ updateQuery: onLastSeenUpdated, document: UserLastSeenUpdatedSubscription, onError });
    this.subscribeToMore({ updateQuery: userJoined, document: userJoinedSubscription, onError });
    this.subscribeToMore({ updateQuery: userParted, document: userPartedSubscription, onError });
  }

  userJoined(prev, { subscriptionData: { data: { userJoined } } }) {
    document.getElementById('snackbar').labelText = `${userJoined.nick} joined!`;
    document.getElementById('snackbar').show();
    return {
      ...prev,
      users: [
        userJoined,
        ...prev.users,
      ].filter(Boolean),
    };
  }

  userParted(prev, { subscriptionData: { data: { userParted } } }) {
    document.getElementById('snackbar').labelText = `${prev.users.find(x => x.id === userParted.id).nick} left!`;
    document.getElementById('snackbar').show();
    return {
      ...prev,
      users: prev.users.map(user => ({
        ...user,
        ...(user.id === userParted.id ? userParted : {}),
      })),
    };
  }
}

customElements.define('leeway-userlist', LeewayUserlist);
