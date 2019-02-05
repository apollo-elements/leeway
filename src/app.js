import { getClient } from './client';

window.WebComponents.waitFor(async function resolveBody() {
  window.__APOLLO_CLIENT__ = await getClient();
  await Promise.all([
    import('./components/leeway-input-fields/leeway-input-fields.js'),
    import('./components/leeway-messages/leeway-messages.js'),
    import('./components/leeway-status-notifier/leeway-status-notifier.js'),
    import('./components/leeway-userlist/leeway-userlist.js'),
  ])
  document.body.removeAttribute('unresolved');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
