const updateDialog =
  document.getElementById('update-dialog');

const serviceWorker =
  document.getElementById('service-worker');

async function onServiceWorkerChanged(event) {
  if (event.detail.state !== 'installed') return;
  await import('details-dialog-element');
  updateDialog.removeAttribute('hidden');
}

serviceWorker.addEventListener('change', onServiceWorkerChanged);
