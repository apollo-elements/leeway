import { localUserVar } from './variables';
import { $ } from './lib/$';

function onNickInputKeyup(event) {
  if (event.key === 'Enter')
    event.target.closest('apollo-mutation').mutate();
}

function onNickMutationCompleted() {
  $('#nick-input').value = '';
  $('#nick-dialog').close();
  const { data = null } = $('#nick-mutation');
  const user = data && data.join || null;
  localUserVar(user);
  if (!user) return;
  localStorage.setItem('leeway-user', JSON.stringify(user));
  $('#message-input').tabindex = 0;
  $('#message-input').focus();
}

function onNickSubmit() {
  if ($('#nick-input').value)
    $('#nick-mutation').mutate();
}

function onNickDialogShowButtonClick() {
  $('#nick-inputs').inert = false;
  $('#nick-dialog').show();
}

function onNickDialogClosing(event) {
  event.preventDefault();
  $('#nick-input').blur();
  $('#nick-inputs').inert = true;
  $('#message-inputs').inert = false;
}

function onNickDialogClosed(event) {
  event.preventDefault();
  $('#message-input').focus();
}

function onNickDialogOpened(event) {
  event.target.querySelector('input').focus();
}

$('#nick-show')
  .addEventListener('click', onNickDialogShowButtonClick);

$('#nick-dialog')
  .addEventListener('opened', onNickDialogOpened);

$('#nick-dialog')
  .addEventListener('closing', onNickDialogClosing);

$('#nick-dialog')
  .addEventListener('closed', onNickDialogClosed);

$('#nick-input')
  .addEventListener('keyup', onNickInputKeyup);

$('#nick-submit')
  .addEventListener('click', onNickSubmit);

$('#nick-mutation')
  .addEventListener('mutation-completed', onNickMutationCompleted);
