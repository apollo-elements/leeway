import { style } from './shared-styles';

import { client } from '../client.js';
import { ApolloSubscription } from 'lit-apollo';
class ChatSubscription extends ApolloSubscription {
  render() {
  }

  constructor() {
    super();
    this.client = client;
  }

  updated() {
    this.scrollIntoView(false);
  }
}

customElements.define('chat-subscription', ChatSubscription);
