import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';

import { getUserStyleMap } from '../../lib/user-style-map';
import UserLastSeenUpdatedSubscription from '../../UserLastSeenUpdated.subscription.graphql';
import UserStatusUpdatedSubscription from '../../UserStatusUpdated.subscription.graphql';
import userPartedSubscription from '../../user-parted-subscription.graphql';
import userJoinedSubscription from '../../user-joined-subscription.graphql';

import shared from '../shared-styles.css';
import style from './leeway-userlist.css';

const userTemplate = ({ nick, status } = {}) => (html`
  <div class="user" style="${getUserStyleMap({ nick, status })}">
    <span aria-label="${status}" class="status ${classMap({ ...status && { [status.toLowerCase()]: true } })}"></span>
    ${nick}
  </div>
`);

const isNotParted =
  user =>
    user && user.status !== 'PARTED';

const onLastSeenUpdated = (prev, { subscriptionData: { data: { userLastSeenUpdated } } }) => {
  const users = [...prev.users];
  const index = users.findIndex(x => x.id === userLastSeenUpdated.id);
  users[index].lastSeen = userLastSeenUpdated.lastSeen;
  return { ...prev, users };
};

const onStatusUpdated = (prev, { subscriptionData: { data: { userStatusUpdated } } }) => ({
  ...prev,
  users: [
    userStatusUpdated,
    ...prev.users.filter(user => user.id !== userStatusUpdated.id),
  ].filter(isNotParted),
});

const onUserJoined = (prev, { subscriptionData: { data: { userJoined } } }) => ({
  ...prev,
  users: [
    userJoined,
    ...prev.users,
  ].filter(Boolean),
});

const onUserParted = (prev, { subscriptionData: { data: { userParted } } }) => ({
  ...prev,
  users: prev.users.map(user => ({
    ...user,
    ...(user.id === userParted.id ? userParted : {}),
  })),
});


/**
 * <leeway-userlist>
 * @customElement
 * @extends LitElement
 */
class LeewayUserlist extends ApolloQuery {
  static get styles() {
    return [shared, style];
  }

  static get properties() {
    return {
      open: { type: Boolean },
    };
  }

  render() {
    const { users = [], localUser = {} } = this.data || {};
    const myStatus = localUser && localUser.status && localUser.status.toLowerCase();
    return (html`
      ${this.error && this.error.message}
      <section id="links"><slot name="links"></slot></section>
      <section id="users">
        <header style="${getUserStyleMap(localUser)}" class="${classMap({ invisible: !localUser.id })}">
          <span role="presentation" class="status ${myStatus}"></span>
          <span class="nick">${localUser.nick}</span>
        </header>
        ${users.filter(user => user.id !== localUser.id).map(userTemplate)}
      </section>
    `);
  }

  firstUpdated() {
    const onError = this.onSubscriptionError.bind(this);
    // eslint-disable-next-line max-len
    this.subscribeToMore({ updateQuery: onStatusUpdated, document: UserStatusUpdatedSubscription, onError });
    // eslint-disable-next-line max-len
    this.subscribeToMore({ updateQuery: onLastSeenUpdated, document: UserLastSeenUpdatedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserJoined, document: userJoinedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserParted, document: userPartedSubscription, onError });
  }

  onSubscriptionError(error) {
    this.error = error;
  }
}

customElements.define('leeway-userlist', LeewayUserlist);
