import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';

import { getUserStyleMap } from '../../lib/user-style-map';
import userStatusUpdatedSubscription from './user-status-updated-subscription.graphql';
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
    const { users = [], localUser = {}, sidebarOpen } = this.data || {};
    const myStatus = localUser && localUser.status && localUser.status.toLowerCase();
    return (html`
      ${this.error && this.error.message}
      <details ?open="${sidebarOpen}">
        <summary @click="${this.onClick}">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </summary>
        <div>
          <section id="links"><slot name="links"></slot></section>
          <section id="users">
            <header style="${getUserStyleMap(localUser)}" class="${classMap({ invisible: !localUser.id })}">
              <span role="presentation" class="status ${myStatus}"></span>
              <span class="nick">${localUser.nick}</span>
            </header>
            ${users.filter(user => user.id !== localUser.id).map(userTemplate)}
          </section>
        </div>
      </details>
    `);
  }

  firstUpdated() {
    const onError = this.onSubscriptionError.bind(this);
    // eslint-disable-next-line max-len
    this.subscribeToMore({ updateQuery: onStatusUpdated, document: userStatusUpdatedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserJoined, document: userJoinedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserParted, document: userPartedSubscription, onError });
  }

  onSubscriptionError(error) {
    this.error = error;
  }

  onClick(event) {
    event.preventDefault();
    this.client.writeQuery({
      query: this.query,
      data: {
        ...this.data,
        sidebarOpen: !this.data.sidebarOpen,
      },
    });
  }
}

customElements.define('leeway-userlist', LeewayUserlist);
