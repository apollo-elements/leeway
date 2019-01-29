import './leeway-chat-input.js';
import './leeway-nick-input.js';

import { ApolloQuery, css, html } from '@apollo-elements/lit-apollo';

import { style } from './shared-styles';

const isCustomElement = el => el.localName.includes('-');

const assignUser = user => el => el.user = user;

const errorTemplate = ({ message = 'Unknown Error' } = {}) => html`
  <h1>😢 Such Sad, Very Error! 😰</h1>
  <div>${message}</div>
`;

/**
 * <leeway-input-fields>
 * @customElement
 * @extends ApolloQuery
 */
class LeewayInputFields extends ApolloQuery {
  static get styles() {
    return [style, css`
      div,
      #nick ::slotted(*),
      #chat ::slotted(*) {
        height: 100%;
      }
    `];
  }

  render() {
    return this.error ? errorTemplate(this.error) : html`
      <div id="nick" ?hidden="${this.data.id}"><slot name="nick-input"></slot></div>
      <div id="chat" ?hidden="${!this.data.id}"><slot name="chat-input"></slot></div>
    `;
  }

  updated() {
    Array.from(this.children)
      .filter(isCustomElement)
      .forEach(assignUser(this.data));
    this.querySelector(`leeway-${this.data.id ? 'chat' : 'nick'}-input`).input.focus();
  }

  shouldUpdate() {
    return this.data || this.error || this.loading != null;
  }
}

customElements.define('leeway-input-fields', LeewayInputFields);
