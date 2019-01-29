import '@material/mwc-button';

import { ApolloMutation, css, html } from '@apollo-elements/lit-apollo';

import { LeewayInputMixin } from './leeway-input-mixin';
import { inputStyles } from './input-fields-styles';
import { style } from './shared-styles.js';

class LeewayNickInput extends LeewayInputMixin(ApolloMutation) {
  static get styles() {
    return [style, inputStyles, css`
      input,
      input::placeholder {
        background: rebeccapurple;
        color: white;
        opacity: 1;
      }
    `];
  }

  render() {
    return (html`
      ${this.error && this.error}

      <input id="input"
          aria-label="Username"
          placeholder="Set Your Username"
          @keyup="${this.onUserKeyup}"/>
      <mwc-button id="submit"
          icon="check"
          ?disabled="${!this.variables || !this.variables.nick}"
          @click="${this.onSubmit}">OK</mwc-button>
    `);
  }

  static get properties() {
    return {
      nick: { type: String },
      variables: { type: Object },
      closed: { type: Boolean, reflect: true },
    };
  }

  onSubmit() {
    if (this.input.value) this.mutate();
  }

  onUserKeyup({ key, target: { value: nick } }) {
    this.variables = { nick };
    if (key === 'Enter') this.mutate();
  }

  onUpdate(cache, { data: { join: { id, nick } } }) {
    const data = { id, nick, status: navigator.onLine ? 'ONLINE' : 'OFFLINE' };
    cache.writeData({ data });
  }
}

customElements.define('leeway-nick-input', LeewayNickInput);
