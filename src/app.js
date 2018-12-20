import { get } from './lib/storage';

import './components/leeway-input.js';
import './components/leeway-messages.js';
import './components/leeway-userlist.js';
import './components/leeway-user-status-toast.js';
import './components/leeway-username-input.js';
import './components/info-box.js';

const input = document.body.querySelector('leeway-input');
const usernameInput = document.body.querySelector('leeway-username-input');
const notifier = document.body.querySelector('leeway-status-notifier');
const onNetworkChange = () => notifier.mutate({
  variables: {
    online: navigator.onLine,
    id: get('user').id,
  }
});

const onBeforeunload = () => {
  const { id } = get('user');
  const variables = { id, status: 'OFFLINE' };
  notifier.mutate({ variables });
};

window.WebComponents.waitFor(async function resolveBody() {
  await Promise.all([
    customElements.whenDefined('leeway-input'),
    customElements.whenDefined('leeway-messages'),
    customElements.whenDefined('leeway-userlist'),
    customElements.whenDefined('info-box'),
  ]);
  document.body.removeAttribute('unresolved');
  const user = get('user');
  if (user) input.input.focus();
  else usernameInput.input.focus();
  window.addEventListener('beforeunload', onBeforeunload);
  window.addEventListener('offline', onNetworkChange);
  window.addEventListener('online', onNetworkChange);
});
