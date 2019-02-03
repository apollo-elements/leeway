window.WebComponents.waitFor(async function resolveBody() {
  const client = await (await import('./client').then(({ getClient }) => getClient()));
  window.__APOLLO_CLIENT__ = client;
  await Promise.all([
    import('@apollo-elements/lit-apollo/apollo-query'),
    import('@apollo-elements/lit-apollo/apollo-mutation'),
    import('./components/leeway-input-fields.js'),
    import('./components/leeway-messages.js'),
    import('./components/leeway-status-notifier.js'),
    import('./components/leeway-userlist.js'),
  ])
  document.body.removeAttribute('unresolved');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
