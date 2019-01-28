import gql from 'graphql-tag';
import _userQuery from './user-query.graphql';
const userQuery = gql(_userQuery);

import { getClient } from './client';

const input = document.body.querySelector('leeway-input');
const usernameInput = document.body.querySelector('leeway-username-input');
const allComponents = [
  'leeway-input',
  'leeway-messages',
  'leeway-status-notifier',
  // 'leeway-user-status-toast',
  'leeway-userlist',
  'leeway-username-input',
  'info-box',
];


const whenDefined = customElements.whenDefined.bind(customElements);
window.WebComponents.waitFor(async function resolveBody() {
  const client = await getClient();
  window.__APOLLO_CLIENT__ = client;
  // await Promise.all(allComponents.map(component => import(`./components/${component}.js`).catch(console.error)))
  await Promise.all([
    import('./components/leeway-input.js'),
    import('./components/leeway-messages.js'),
    import('./components/leeway-status-notifier.js'),
    // import('./components/leeway-user-status-toast.js'),
    import('./components/leeway-userlist.js'),
    import('./components/leeway-username-input.js'),
    import('./components/info-box.js'),
  ])
  await Promise.all(allComponents.map(whenDefined));
  document.body.removeAttribute('unresolved');
  const { nick } = client.cache.readQuery({ query: userQuery });
  if (nick) input.input.focus();
  else usernameInput.input.focus();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
