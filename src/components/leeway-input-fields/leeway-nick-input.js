import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';

import { LeewayInputMixin } from './leeway-input-mixin';
import inputStyles from './input-fields-styles.css';
import style from './leeway-nick-input.css';
import shared from '../shared-styles.css';

import { localUserVar } from '../../variables';

/**
 * ```graphql
 * mutation Join($nick: String!) {
 *   join(nick: $nick) {
 *     id
 *     nick
 *     status
 *     lastSeen
 *   }
 * }
 * ```
 * @typedef {import('../leeway-userlist/leeway-userlist.js').User} JoinMutationData
 */

/** @typedef {{nick: string}} JoinMutationVariables */

/**
 * <leeway-nick-input>
 * @customElement
 * @extends {ApolloMutation<JoinMutationData, JoinMutationVariables>}
 */
class LeewayNickInput extends LeewayInputMixin(ApolloMutation) {
  static get properties() {
    return {
      nick: { type: String },
      variables: { type: Object },
      closed: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [shared, inputStyles, style];
  }

  render() {
    return (html`
      ${this.error && this.error}

      <input id="input"
          aria-label="Username"
          placeholder="Set Your Username"
          @keyup="${this.onKeyup}"/>
      <mwc-button id="submit"
          icon="check"
          ?disabled="${!this.variables || !this.variables.nick}"
          @click="${this.onSubmit}">OK</mwc-button>
    `);
  }

  onSubmit() {
    if (this.input.value)
      this.mutate();
  }

  onKeyup({ key, target: { value: nick } }) {
    this.variables = { nick };
    if (key === 'Enter')
      this.mutate();
  }

  updater(_cache, { data: { join: { id, nick } } }) {
    localStorage.setItem('leeway-user', JSON.stringify({ id, nick }));
    localUserVar({ id, nick });
  }
}

customElements.define('leeway-nick-input', LeewayNickInput);
