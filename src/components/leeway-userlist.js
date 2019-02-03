import { ApolloQuery, css, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';

import and from 'crocks/logic/and';
import assign from 'crocks/helpers/assign';
import compose from 'crocks/helpers/compose';
import isSame from 'crocks/predicates/isSame';
import not from 'crocks/logic/not';
import propOr from 'crocks/helpers/propOr';
import when from 'crocks/logic/when';

import { getUserStyleMap } from '../lib/user-style-map';
import { isSameById } from '../lib/is-same-by';
import userStatusUpdatedSubscription from '../user-status-updated-subscription.graphql';
import userPartedSubscription from '../user-parted-subscription.graphql';
import userJoinedSubscription from '../user-joined-subscription.graphql';

import { style } from './shared-styles';

const userTemplate = localUser => ({ id, nick, status } = {}) => (html`
  <div class="${classMap({ user: true, me: localUser.id === id })}"
       style="${getUserStyleMap({ nick, status })}">
    <span aria-label="${status}" class="${classMap({ status: true, ...status && { [status.toLowerCase()]: true } })}"></span>
    ${nick}
  </div>
`);

const isNotParted = compose(not(isSame('PARTED')), propOr(null, 'status'));

const onStatusUpdated = (prev, { subscriptionData: { data: { userStatusUpdated } } }) => ({
  ...prev,
  users: [
    userStatusUpdated,
    ...prev.users.filter(not(isSameById(userStatusUpdated))),
  ].filter(and(Boolean, isNotParted))
});

const onUserJoined = (prev, { subscriptionData: { data: { userJoined } } }) => ({
  ...prev,
  users: [
    userJoined,
    ...prev.users,
  ].filter(Boolean)
});

const onUserParted = (prev, { subscriptionData: { data: { userParted } } }) => ({
  ...prev,
  users: prev.users.map(when(isSameById(userParted), assign(userParted)))
});


/**
 * <leeway-userlist>
 * @customElement
 * @extends LitElement
 */
class LeewayUserlist extends ApolloQuery {
  static get styles() {
    return [style, css`
      :host {
        display: flex;
      }

      section {
        height: 100%;
      }

      #users {
        padding: 8px;
      }

      .user {
        padding: 4px;
        align-items: center;
        color: white;
      }

      .me {
        font-weight: bold;
      }

      .status {
        border-radius: 100%;
        display: inline-block;
        font-size: 12px;
        font-weight: lighter;
        height: 14px;
        margin-right: 4px;
        text-transform: lowercase;
        width: 14px;
      }

      .status::first-letter {
        text-transform: uppercase;
      }

      .online {
        background: limegreen;
      }

      .offline {
        background: lightgrey;
      }

      header {
        color: white;
        display: flex;
        flex-flow: row wrap;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 12px;
        padding: 4px;
      }

      .nick {
        flex: 1 0 100%;
      }
    `];
  }

  render() {
    const { users = [], id, nick, status } = this.data;
    return (html`
      ${this.error && this.error}
      <section id="links"><slot name="links"></slot></section>
      <section id="users">
        <header style="${getUserStyleMap({ nick, status })}">
          <span class="nick">${nick}</span>
          <span role="presentation" class="${classMap({ status: true, ...status && { [status.toLowerCase()]: true } })}"></span>
          <span class="status">${status}</span>
        </header>
        ${users
        .filter(not(isSameById({ id })))
        .map(userTemplate({ id, nick, status }))}
      </section>
    `);
  }

  firstUpdated() {
    const onError = this.onSubscriptionError.bind(this);
    this.subscribeToMore({ updateQuery: onStatusUpdated, document: userStatusUpdatedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserJoined, document: userJoinedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserParted, document: userPartedSubscription, onError });
  }

  onSubscriptionError(error) {
    console.error(error);
    this.error = error;
  }

}

customElements.define('leeway-userlist', LeewayUserlist);
