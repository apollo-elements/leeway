import style from './shared-styles.css';
import { ApolloSubscription, html } from '@apollo-elements/lit-apollo';
import userStatusToastStyle from './leeway-user-status-toast.css';

const getStatusMessage = ({ user: { status = '' } = {} } = {}) =>
  !status ? status
  : status === 'ONLINE' ? 'joined'
  : status === 'OFFLINE' ? 'left'
  : 'did something interesting';

const getUserNick = ({ user: { nick = '' } = {} } = {}) => nick;

class LeewayUserStatusToast extends ApolloSubscription {
  static get styles() {
    return [style, userStatusToastStyle];
  }

  render() {
    return html`
      <div id="toast" active>
        ${getUserNick(this.data)}
        ${getStatusMessage(this.data)}
      </div>
    `;
  }

  static get properties() {
    return {
      timeout: { type: Number }
    };
  }

  constructor() {
    super();
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

customElements.define('leeway-user-status-toast', LeewayUserStatusToast);
