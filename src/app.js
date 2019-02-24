import '@power-elements/service-worker';

async function onServiceWorkerChanged({ detail: { state }}) {
  const dialog = document.getElementById('update-dialog');
  const dialogReload = document.getElementById('dialog-reload');

  if (state === 'installed') {
    await import('details-dialog-element');
    dialog.hidden = false;
    // open the dialog
    dialog.firstElementChild.click();
  }
}

// so embarassed: graphql/jsutils/instanceOf.mjs:16
window.process = { env: { PRODUCTION: true } };

window.WebComponents.waitFor(async function resolveBody() {
  const serviceWorker = document.getElementById('service-worker');
  serviceWorker.addEventListener('service-worker-changed', onServiceWorkerChanged);

  const { getClient } = await import('./client');

  window.__APOLLO_CLIENT__ = await getClient();

  await Promise.all([
    import('./components/leeway-input-fields/leeway-input-fields.js'),
    import('./components/leeway-messages/leeway-messages.js'),
    import('./components/leeway-status-notifier/leeway-status-notifier.js'),
    import('./components/leeway-userlist/leeway-userlist.js'),
  ])

  document.body.removeAttribute('unresolved');
});
