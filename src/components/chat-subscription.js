import { style } from './shared-styles';

import { format } from 'date-fns/fp';
import gql from 'graphql-tag';
import { client } from '../client.js';
import { ApolloSubscription, html } from 'lit-apollo';
import { styleMap } from 'lit-html/directives/style-map';

const msgTime = format('HH:mm');

const errorTemplate = ({ message = 'Unknown Error' } = {}) => html`
  <h1>😢 Such Sad, Very Error! 😰</h1>
  <div>${message}</div>`;

const messageTemplate = ({ message, user, date }) => html`
  <div style=${styleMap({ '--hue-coeff': user.length })}>
    <dt><time>${msgTime(date)}</time> ${user}:</dt>
    <dd>${message}</dd>
  </div>
`;

class ChatSubscription extends ApolloSubscription {
  render() {
    const view =
      this.loading ? html`Loading...`
      : this.error ? errorTemplate(this.error)
      : html`<dl>${this.data.messageSent.map(messageTemplate)}</dl>`;

    return html`
    ${style}
    <style>
      dl > div {
        display: flex;
        border-radius: 4px;
        margin: 10px;
        padding: 14px;
        background: hsla(calc(var(--hue-coeff) * var(--primary-hue)) 50% 50% / 0.3);
      }

      time {
        font-family: monospace;
      }
    </style>
    ${view}`;

  }

  constructor() {
    super();
    this.client = client;
    this.subscription = gql`
      subscription {
        messageSent {
          date
          message
          user
        }
      }
    `;
  }

  updated() {
    this.scrollIntoView(false);
  }
}

customElements.define('chat-subscription', ChatSubscription);
