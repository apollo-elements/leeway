import { localUserVar } from './variables';
import { debounce } from 'mini-debounce';

import { $ } from './lib/$';

import { gql } from '@apollo/client/core';

function onLocalUserChanged() {
  const id = localUserVar() && localUserVar().id;
  const userActive = !!id;
  $('#nick-inputs').hidden = userActive;
  $('#message-inputs').hidden = !userActive;
  $('#nick-inputs').inert = userActive;
  $('#message-inputs').inert = !userActive;
  $('#user-id-input').value = id;
  if (userActive)
    $('#message-input').focus();
  else
    $('#nick-input').focus();
}

function onSubmit(event) {
  event.preventDefault();
}

async function part() {
  const element = $('#part-mutation');
  const { id } = localUserVar();
  const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
  await element.mutate({
    variables: { id },
    update(cache) {
      cache.writeFragment({
        id: `User:${id}`,
        fragment: gql`fragment userStatus on user { status }`,
        data: { status: 'OFFLINE' },
      });
    },
    optimisticResponse: {
      __typename: 'Mutation',
      part: {
        __typename: 'User',
        id: null,
        nick: null,
        status,
      },
    },
  });

  localUserVar({ id: null, nick: null, status });

  localStorage.removeItem('leeway-user');

  $('#message-input').value = '';
  $('#message-input').blur();
  $('#message-inputs').inert = true;
  $('#nick-inputs').inert = false;
  await new Promise(r => setTimeout(r));
  $('#nick-show').focus();
}

async function changeUsername(nick) {
  const element = $('#change-nick-mutation');
  const { id } = localUserVar();
  await element.mutate({
    variables: { id, nick },
    optimisticResponse: {
      __typename: 'Mutation',
      changeNickname: { __typename: 'User', id, nick, status },
    },
    update(_cache, { data: { changeNickname: { id, nick } } }) {
      localUserVar({ id, nick, status });
    },
  });

  localUserVar({ nick, id, status });

  localStorage.setItem('leeway-user', JSON.stringify({ nick, id, status }));

  $('#message-input').value = '';
}

function handleSlashCommand(message) {
  const [command, ...args] = message.split(' ');
  switch (command) {
    case 'nick': return changeUsername(...args);
    case 'part': return part();
  }
}

async function submitMessage() {
  const element = $('#message-mutation');
  await element.mutate();
  $('#message-input').value = '';
}

function submit() {
  const element = $('#message-mutation');
  const { message } = element.variables;

  if (message.startsWith('/'))
    return handleSlashCommand(message.substr(1));
  else
    return submitMessage(message);
}

function onMessageKeyup(event) {
  $('#ping-mutation').mutate({ variables: { userId: localUserVar().id } });
  if (event.key === 'Enter')
    submit();
}

$('#local-user-query')
  .addEventListener('data-changed', onLocalUserChanged);

$('#inputs')
  .addEventListener('submit', onSubmit);

$('#message-input')
  .addEventListener('keyup', onMessageKeyup);

$('#message-submit')
  .addEventListener('click', submit);

$('#ping-mutation').mutate =
  debounce($('#ping-mutation').mutate.bind($('#ping-mutation')), 1000);

onLocalUserChanged();
