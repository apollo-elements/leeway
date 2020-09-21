import { ApolloMutation } from '@apollo-elements/lit-apollo';

import userQuery from '../LocalUser.query.graphql';

const { host } = location;
const protocol = host.includes('localhost') ? 'http' : 'https';
const uri = `${protocol}://${host}/graphql`;

const partMutation = 'mutation Part($id: ID!) { part(id: $id) }';
const updateQuery = `
  mutation UpdateUserStatus($id: ID!, $status: Status!) {
    updateUserStatus(id: $id, status: $status)
  }
`;

function sendBeacon({ query, variables }) {
  const body = JSON.stringify({ query, variables });
  const blob = new Blob([body], { type: 'application/json' });

  // chrome... https://bugs.chromium.org/p/chromium/issues/detail?id=490015
  try {
    navigator.sendBeacon(uri, blob);
  } catch (e) {
    fetch(uri, {
      body,
      headers: { 'Content-Type': 'application/json' },
      mode: 'same-origin',
      method: 'POST',
    });
  }
}

class LeewayStatusNotifier extends ApolloMutation {
  render() {
    !this.data ? '' : '';
  }

  constructor() {
    super();
    this.onNetworkChange = this.onNetworkChange.bind(this);
    this.onBeforeunload = this.onBeforeunload.bind(this);
    this.onUserUpdated = this.onUserUpdated.bind(this);
    window.addEventListener('beforeunload', this.onBeforeunload);
    window.addEventListener('offline', this.onNetworkChange);
    window.addEventListener('online', this.onNetworkChange);
  }

  firstUpdated() {
    this.client
      .watchQuery({ query: userQuery })
      .subscribe({ next: this.onUserUpdated });
  }

  onBeforeunload() {
    if (!this.user) return;
    const { id } = this.user;
    sendBeacon({ query: partMutation, variables: { id } });
  }

  onNetworkChange() {
    if (!this.user || !this.user.id) return;
    const { id } = this.user;
    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    if (status === this.user.status) return;
    this.mutate({ variables: { id, status } });
  }

  onUserUpdated({ data: { id, nick, status } }) {
    if (!id) return this.user = null;
    if (JSON.stringify({ id, nick, status }) === JSON.stringify(this.user)) return;
    this.user = { id, nick, status };
    sendBeacon({ query: updateQuery, variables: { id, status } });
  }
}

customElements.define('leeway-status-notifier', LeewayStatusNotifier);
