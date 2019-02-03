// so embarassed: graphql/jsutils/instanceOf.mjs:16
window.process = { env: { PRODUCTION: true } }
window.WebComponents.waitFor(async function resolveBody() {
  const client = await import('./client').then(({ getClient }) => getClient());
  window.__APOLLO_CLIENT__ = client;
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
