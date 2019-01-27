import { style } from './shared-styles';
import { client } from '../client.js';
import { ApolloSubscription, html } from '@apollo-elements/lit-apollo';
import { css } from 'lit-element';

const getStatusMessage = ({ user: { status = '' } = {} } = {}) =>
  !status ? status
  : status === 'ONLINE' ? 'joined'
  : status === 'OFFLINE' ? 'left'
  : 'did something interesting';

const getUserNick = ({ user: { nick = '' } = {} } = {}) => nick;

class LeewayUserStatusToast extends ApolloSubscription {
  static get styles() {
    return [style, css`
      div {
        visibility: hidden;
        z-index: -1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      [active] {
        visibility: visible;
        z-index: auto;
        pointer-events: auto;
        opacity: 1;
      }
    `];
  }

  render() {
    return html`
      <div id="toast" active>
        ${getUserNick(this.data)}
        ${getStatusMessage(this.data)}
      </div>
    `;
  }

  static get is() {
    return 'leeway-user-status-toast';
  }

  static get properties() {
    return {
      timeout: { type: Number }
    };
  }

  constructor() {
    super();
    this.client = client;
    this.timeout = 5000;
  }

  get toast() {
    return (
      this.shadowRoot &&
      this.shadowRoot.getElementById('toast')
    );
  }

  updated() {
    this.scrollIntoView(false);
    setTimeout(this.toast.removeAttribute.bind(this.toast, 'active'), this.timeout);
  }
}

customElements.define(LeewayUserStatusToast.is, LeewayUserStatusToast);
