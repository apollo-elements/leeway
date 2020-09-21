import '@material/mwc-button';

import { ApolloMutation, html } from '@apollo-elements/lit-apollo';

import { LeewayInputMixin } from './leeway-input-mixin';
import inputStyles from './input-fields-styles.css';
import style from './leeway-nick-input.css';
import shared from '../shared-styles.css';

import { localUserVar } from '../../variables';

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
    if (this.input.value) this.mutate();
  }

  onKeyup({ key, target: { value: nick } }) {
    this.variables = { nick };
    if (key === 'Enter') this.mutate();
  }

  updater(cache, { data: { join: { id, nick } } }) {
    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    localUserVar({ id, nick, status });
  }
}

customElements.define('leeway-nick-input', LeewayNickInput);
