import './leeway-chat-input.js';
import './leeway-nick-input.js';

import { ApolloQuery, html } from '@apollo-elements/lit-apollo';

import shared from '../shared-styles.css';
import style from './leeway-input-fields.css';

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
    return [shared, style];
  }

  render() {
    return this.error ? errorTemplate(this.error) : html`
      <div id="nick" ?hidden="${this.data.id}"><slot name="nick-input"></slot></div>
      <div id="chat" ?hidden="${!this.data.id}"><slot name="chat-input"></slot></div>
    `;
  }

  async focusInput() {
    const mutator = this.querySelector(`leeway-${this.data.id ? 'chat' : 'nick'}-input`);
    const { input } = mutator;
    await mutator.updateComplete;
    setTimeout(input.focus.bind(input));
  }

  firstUpdated() {
    this.focusInput();
  }

  updated() {
    Array.from(this.children)
      .filter(isCustomElement)
      .forEach(assignUser(this.data));
    this.focusInput();
  }

  shouldUpdate() {
    return this.data || this.error || this.loading != null;
  }
}

customElements.define('leeway-input-fields', LeewayInputFields);
