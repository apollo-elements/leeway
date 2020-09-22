// so embarassed: graphql/jsutils/instanceOf.mjs:16
window.process = { env: { PRODUCTION: true } };
window.exports = {};

import '@power-elements/service-worker';
import 'hy-drawer/src/webcomponent/module';

const updateDialog =
  document.getElementById('update-dialog');

const drawer =
  document.getElementById('drawer');

const drawerToggle =
  document.getElementById('drawer-toggle');

const serviceWorker =
  document.getElementById('service-worker');

const isWideScreen =
  window.matchMedia('(min-width: 500px)');

async function onServiceWorkerChanged(event) {
  if (event.detail.state !== 'installed') return
  await import('details-dialog-element');
  updateDialog.removeAttribute('hidden');
}

function onMediaChange(event) {
  drawer.persistent = event.matches;
  drawer.opened = event.matches;
}

function onDrawerToggle() {
  if (!isWideScreen.matches)
    return
  else if (drawer.opened)
    document.body.setAttribute('menu-open', '')
  else
    document.body.removeAttribute('menu-open', '')
}

function onClickDrawerToggle() {
  drawer.toggle();
  onDrawerToggle();
}

async function resolveBody() {
  const { getClient } = await import('./client');

  window.__APOLLO_CLIENT__ = await getClient();

  await import('./components');

  await Promise.all([
    customElements.whenDefined('leeway-input-fields'),
    customElements.whenDefined('leeway-messages'),
    customElements.whenDefined('leeway-status-notifier'),
    customElements.whenDefined('leeway-userlist'),
    customElements.whenDefined('hy-drawer'),
  ])

  document.body.removeAttribute('unresolved');
}

isWideScreen.addEventListener('change', onMediaChange);

drawerToggle.addEventListener('click', onClickDrawerToggle);

serviceWorker.addEventListener('change', onServiceWorkerChanged);

onMediaChange(isWideScreen);

onDrawerToggle();

window.WebComponents.waitFor(resolveBody);
