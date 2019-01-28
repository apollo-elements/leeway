import { ApolloQuery, css, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';
import gql from 'graphql-tag';

import and from 'crocks/logic/and';
import assign from 'crocks/helpers/assign';
import compose from 'crocks/helpers/compose';
import isSame from 'crocks/predicates/isSame';
import not from 'crocks/logic/not';
import propOr from 'crocks/helpers/propOr';
import when from 'crocks/logic/when';

import { getUserStyleMap } from '../lib/user-style-map';
import { isSameById } from '../lib/is-same-by';
import _userStatusUpdatedSubscription from '../user-status-updated-subscription.graphql';

const userStatusUpdatedSubscription = gql(_userStatusUpdatedSubscription);

import _userPartedSubscription from '../user-parted-subscription.graphql';
const userPartedSubscription = gql(_userPartedSubscription);

import _userJoinedSubscription from '../user-joined-subscription.graphql';
const userJoinedSubscription = gql(_userJoinedSubscription);

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
      .user {
        padding: 4px;
        align-items: center;
      }

      .me {
        font-weight: bold;
      }

      .status {
        border-radius: 100%;
        display: inline-block;
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }

      .online {
        background: limegreen;
      }

      .offline {
        background: lightgrey;
      }
    `];
  }

  render() {
    const { users = [], id, nick, status } = this.data;
    return (html`
      <slot></slot>
      ${this.error && this.error}
      ${users.map(userTemplate({ id, nick, status }))}
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
