// so embarassed: graphql/jsutils/instanceOf.mjs:16
window.process = { env: { PRODUCTION: true } };
window.exports = {};

import '@power-elements/service-worker';
import 'hy-drawer/src/webcomponent/module';

import 'wicg-inert';

import { $ } from './lib/$';

const isWideScreen =
  window.matchMedia('(min-width: 500px)');

function onMediaChange(event) {
  $('#drawer').persistent = event.matches;
  $('#drawer').opened = event.matches;
}

function onDrawerToggle() {
  if (!isWideScreen.matches)
    return;
  else if ($('#drawer').opened)
    document.body.setAttribute('menu-open', '');
  else
    document.body.removeAttribute('menu-open', '');
}

function onClickDrawerToggle() {
  $('#drawer').toggle();
  onDrawerToggle();
}

function onUserParted(event) {
  $('#snackbar').labelText = `${event.detail.nick} left!`;
  $('#snackbar').show();
}

function onUserJoined(event) {
  $('#snackbar').labelText = `${event.detail.nick} joined!`;
  $('#snackbar').show();
}

function onMutationError(event) {
  $('#snackbar').labelText = event.detail.error && event.detail.error.message || `Unknown Error in ${event.detail.element.tagName.toLowerCase()}`;
  $('#snackbar').show();
}

async function resolveBody() {
  const { getClient } = await import('./client');

  window.__APOLLO_CLIENT__ = await getClient();

  await import('./components');

  await Promise.all([
    customElements.whenDefined('apollo-mutation'),
    customElements.whenDefined('apollo-query'),
    customElements.whenDefined('leeway-messages'),
    customElements.whenDefined('leeway-userlist'),
    customElements.whenDefined('hy-drawer'),
  ]);

  await import('./modules');

  $('#nick-show').focus();
  $('#inputs').classList.remove('loading');
  document.body.removeAttribute('unresolved');
}

isWideScreen
  .addEventListener('change', onMediaChange);

document
  .addEventListener('user-parted', onUserParted);

document
  .addEventListener('user-joined', onUserJoined);

document
  .addEventListener('mutation-error', onMutationError);

$('#drawer-toggle')
  .addEventListener('click', onClickDrawerToggle);

onMediaChange(isWideScreen);

onDrawerToggle();

window.WebComponents.waitFor(resolveBody);
