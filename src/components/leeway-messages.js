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
const msgTime = compose(format('hh:mm aaa'), parseISO);

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
  loading ? html`Loading...`
  : error ? errorTemplate(error)
  : html`<ol>${data && data.users && data.messages.map(messageTemplate(data))}</ol>`;

/**
 * <leeway-messages>
 * @customElement
 * @extends ApolloQuery
 */
class LeewayMessages extends ApolloQuery {
  static get styles() {
    return [style, css`
      .user {
        flex-flow: row wrap;
      }

      .user::before {
        align-items: center;
        background: hsla(calc(var(--hue-coeff) * var(--primary-hue)) var(--saturation, 50%) 50% / 0.3);
        border-radius: 5px;
        content: attr(data-initial);
        display: flex;
        font-weight: bold;
        height: 40px;
        justify-content: center;
        text-align: center;
        width: 40px;
      }

      ol {
        list-style-type: none;
        margin: 0;
        padding-left: 12px;
      }

      article {
        display: flex;
        flex-flow: row wrap;
        flex: 1 0 auto;
        margin-left: 6px;
      }

      .nick-time {
        font-weight: bold;
        width: 100%
      }

      time {
        font-size: 80%;
        font-weight: lighter;
        opacity: 0.9;
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
