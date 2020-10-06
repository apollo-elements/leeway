import '@material/mwc-button';
import '@material/mwc-dialog';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';
import { $Mixin } from '../../lib/$-mixin';

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
class LeewayNickInput extends $Mixin(ApolloMutation) {
  static get properties() {
    return {
      closed: { type: Boolean, reflect: true },
      nick: { type: String },
      user: { type: Object },
      variables: { type: Object },
    };
  }

  static get styles() {
    return [shared, inputStyles, style];
  }

  render() {
    return (html`
      <mwc-button id="show" label="Join" @click="${() => this.$dialog.show()}"></mwc-button>
      <mwc-dialog id="dialog" @closing="${this.onClosing}" heading="Set your Username">
        <input id="input"
            aria-label="Username"
            placeholder="Username"
            @keyup="${this.onKeyup}"/>
        <mwc-button id="submit"
            slot="primaryAction"
            icon="${this.loading ? 'hourglass_empty' : 'check'}"
            ?disabled="${this.loading || !this.variables || !this.variables.nick}"
            @click="${this.onSubmit}">OK</mwc-button>
      </mwc-dialog>
    `);
  }

  onClosing(event) {
    event.preventDefault();
  }

  onSubmit() {
    if (this.$input.value)
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

  onCompleted() {
    this.$input.value = '';
    this.$dialog.close();
  }

  onError(error) {
    this.dispatchEvent(new CustomEvent('mutation-error', {
      composed: true,
      bubbles: true,
      detail: { error, element: this },
    }));
  }
}

customElements.define('leeway-nick-input', LeewayNickInput);
