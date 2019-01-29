const allComponents = [
  'leeway-input-fields',
  'leeway-messages',
  'leeway-status-notifier',
  // 'leeway-user-status-toast',
  'leeway-userlist',
];


window.WebComponents.waitFor(async function resolveBody() {
  const client = await (await import('./client').then(({ getClient }) => getClient()));
  window.__APOLLO_CLIENT__ = client;
  // await Promise.all(allComponents.map(component => import(`./components/${component}.js`).catch(console.error)))
  await Promise.all([
    import('./components/leeway-input-fields.js'),
    import('./components/leeway-messages.js'),
    import('./components/leeway-status-notifier.js'),
    // import('./components/leeway-user-status-toast.js'),
    import('./components/leeway-userlist.js'),
  ])
  document.body.removeAttribute('unresolved');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
