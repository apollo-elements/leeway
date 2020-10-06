import './leeway-chat-input.js';
import './leeway-nick-input.js';

import { ApolloQuery, html } from '@apollo-elements/lit-apollo';

import shared from '../shared-styles.css';
import style from './leeway-input-fields.css';

const isCustomElement = el => el.localName.includes('-');

const assignUser = user => el => el.user = user;

/**
 * ```graphql
 *  query LocalUser {
 *   localUser @client {
 *     id
 *     nick
 *     status
 *   }
 * }
 * ```
 * @typedef {object} LeewayInputFieldsData
 * @property {User} LocalUser
 */

/**
 * <leeway-input-fields>
 * @customElement
 * @extends {ApolloQuery<LeewayInputFieldsData, LeewayInputFieldsVariables>}
 */
class LeewayInputFields extends ApolloQuery {
  static get styles() {
    return [shared, style];
  }

  render() {
    const { localUser } = this.data;
    return html`
      <div id="nick" ?hidden="${localUser && localUser.id}"><slot name="nick-input"></slot></div>
      <div id="chat" ?hidden="${!localUser || !localUser.id}"><slot name="chat-input"></slot></div>
    `;
  }

  async focusInput() {
    const localId = this.data && this.data.localUser && this.data.localUser.id;
    const mutator = localId ? this.querySelector(`leeway-chat-input`) : this.querySelector('leeway-nick-input');
    const input = localId ? mutator.$input : mutator.$show;
    await mutator.updateComplete;
    setTimeout(input.focus.bind(input));
  }

  firstUpdated() {
    this.focusInput();
  }

  updated() {
    Array.from(this.children)
      .filter(isCustomElement)
      .forEach(assignUser(this.data.localUser));
    this.focusInput();
  }

  shouldUpdate() {
    return this.data || this.error || this.loading != null;
  }
}

customElements.define('leeway-input-fields', LeewayInputFields);
