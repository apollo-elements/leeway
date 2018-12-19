import './components/leeway-input.js';
import './components/leeway-messages.js';
import './components/leeway-userlist.js';
import './components/leeway-user-status-toast.js';
import './components/leeway-username-input.js';
import './components/info-box.js';

const usernameInput = document.body.querySelector('leeway-username-input');
const notifier = document.body.querySelector('leeway-status-notifier');
const onNetworkChange = event => notifier.mutate({
  variables: {
    online: navigator.onLine,
    id: JSON.parse(localStorage.getItem('user')).id,
  }
});

window.WebComponents.waitFor(async function resolveBody() {
  await Promise.all([
    customElements.whenDefined('leeway-input'),
    customElements.whenDefined('leeway-messages'),
    customElements.whenDefined('leeway-userlist'),
    customElements.whenDefined('info-box'),
  ]);
  document.body.removeAttribute('unresolved');
  usernameInput.input.focus();
  window.addEventListener('offline', onNetworkChange);
  window.addEventListener('online', onNetworkChange);
});
