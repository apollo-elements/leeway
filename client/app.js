// @ts-expect-error: ugh
window.process ??= { env: '' };

import { ApolloClient, InMemoryCache, HttpLink, split, makeVar } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import relativeDate from 'tiny-relative-date';

import { ApolloClientElement } from '@apollo-elements/components/apollo-client';

import 'hy-drawer/src/webcomponent/module';

/** @type {typeof document.querySelector} */
const $ = selector => document.querySelector(selector);
const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;
const { host } = location;

class Leeway extends ApolloClientElement {
  /** @type {Leeway} */
  static instance;

  isWideScreen = window.matchMedia('(min-width: 500px)');
  /** @type {import('@apollo-elements/components').ApolloMutationElement} */
  changeNickMut = $('#change-nick-mutation');
  drawer = $('hy-drawer');
  /** @type {import('@apollo-elements/components').ApolloSubscriptionElement} */
  joinedSub = $('#user-joined-subscription');
  /** @type {HTMLElement} */
  joinInputs = $('#join-inputs');
  /** @type {HTMLElement} */
  inputs = $('#inputs');
  /** @type {HTMLInputElement} */
  messageInput = $('#message-input');
  /** @type {HTMLElement} */
  messageInputs = $('#message-inputs');
  /** @type {import('@apollo-elements/components').ApolloMutationElement} */
  messageMut = $('#message-mutation');
  /** @type {import('@apollo-elements/components').ApolloSubscriptionElement} */
  messageSentSub = $('#message-sent-subscription');
  /** @type {import("./types").MessagesElType} */
  messagesQuery = $('#leeway-messages');
  /** @type {HTMLInputElement} */
  nickInput = $('#nick-input');
  /** @type {HTMLElement} */
  nickInputs = $('#nick-inputs');
  /** @type {import('@apollo-elements/components').ApolloMutationElement} */
  joinMut = $('#join-mutation');
  /** @type {import('@apollo-elements/components').ApolloMutationElement} */
  nickMut = $('#change-nick-mutation');
  /** @type {import('@material/mwc-icon-button').IconButton} */
  nickShow = $('#nick-show');
  /** @type {import('@apollo-elements/components').ApolloSubscriptionElement} */
  partedSub = $('#user-parted-subscription');
  /** @type {import('@apollo-elements/components').ApolloMutationElement} */
  pingMut = $('#ping-mutation');
  /** @type {import('@apollo-elements/components').ApolloMutationElement} */
  partMut = $('#part-mutation')
  /** @type {import('./types').UsersElType} */
  userListQuery = $('#leeway-userlist');
  sw = $('service-worker');
  /** @type {import('@material/mwc-dialog').Dialog} */
  versionDiag = $('#version-dialog');
  /** @type {import('@material/mwc-button').Button} */
  versionButton = $('#version-button');
  /** @type {import('@material/mwc-dialog').Dialog} */
  settingsDiag = $('#settings-dialog');
  /** @type {import('@material/mwc-dialog').Dialog} */
  legalDiag = $('#legal-dialog');
  /** @type {import('@material/mwc-icon-button').IconButton} */
  drawerToggle = $('#drawer-toggle');
  /** @type {import('@material/mwc-icon-button').IconButton} */
  settingsToggle = $('#settings-toggle');
  /** @type {import('@material/mwc-icon-button').IconButton} */
  legalToggle = $('#legal-toggle');
  snackbar = $('mwc-snackbar');
  notificationsSwitch = $('mwc-switch');

  static longDateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  });

  localUserVar = makeVar({
    id: null,
    nick: null,
    status: null,
    ...JSON.parse(localStorage.getItem('leeway-user')),
  });

  get localUser() {
    return this.localUserVar();
  }

  set localUser(user) {
    this.localUserVar(user);
    localStorage.setItem('leeway-user', JSON.stringify(user));
  }

  static splitter({ query }) {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  }

  link = split(
    Leeway.splitter,
    new WebSocketLink({ uri: `ws${'PROTOCOL_SUFFIX'}://${host}/graphql`, options: { reconnect: true } }),
    new HttpLink({ uri: `http${'PROTOCOL_SUFFIX'}://${host}/graphql` }),
  );

  /** @override */
  async createApolloClient() {
    const { link } = this;
    const cache = new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            localUser: {
              merge: true,
              read: () => {
                const cached = this.localUserVar() || {};
                const status = !navigator.onLine ? 'OFFLINE' : cached.status || 'ONLINE';
                return { ...cached, status };
              },
            },
            users: {
              /** @type {import('@apollo/client/core').FieldMergeFunction<import('@apollo/client/core').StoreObject[]>} */
              merge: (prev, next, { readField, mergeObjects }) => {
                const existing = prev ?? [];
                const merged = existing ? existing.slice(0) : [];
                const indexes = Object.create(null);

                existing.forEach((item, index) => {
                  /** @type {number} */
                  const id = readField('id', item);
                  indexes[id] = index;
                });

                next.forEach(item => {
                  /** @type {number} */
                  const id = readField('id', item);
                  const index = indexes[id];
                  if (typeof index === 'number')
                    merged[index] = mergeObjects(merged[index], item);
                  else {
                    indexes[id] = merged.length;
                    merged.push(item);
                  }
                });

                return merged;
              },
            },
          },
        },
        User: {
          keyFields: ['id'],
          fields: {
            status: (prev, { readField }) => {
              if (prev === 'PARTED') return prev;
              const id = readField('id');
              if (id === this.localUserVar()?.id)
                return navigator.onLine ? 'ONLINE' : 'OFFLINE';
              const lastSeen = readField('lastSeen');
              // @ts-expect-error: JS can subtract dates
              const timeDelta = Math.abs(new Date() - new Date(lastSeen));
              return (
                  timeDelta < (ONE_HOUR / 4) ? 'ONLINE'
                : timeDelta < ONE_HOUR ? 'AWAY'
                : 'OFFLINE'
              );
            },
          },
        },
      },
    });
    cache.restore(window.__APOLLO_STATE__);
    this.client = new ApolloClient({ cache, link, ssrForceFetchDelay: 100 });
    return this.client;
  }

  /** @param {MediaQueryList|MediaQueryListEvent} event */
  onMediaChange(event) {
    this.drawer.persistent = event.matches;
    this.drawer.opened = event.matches;
  }

  onDrawerToggle() {
    if (this.isWideScreen.matches)
      document.body.toggleAttribute('menu-open', this.drawer.opened);
  }

  onClickDrawerToggle() {
    this.drawer.toggle();
    this.onDrawerToggle();
  }

  /** @param {import('@apollo-elements/components/events').MutationErrorEvent} event */
  async onMutationError(event) {
    await event.detail.element.updateComplete;
    const error = event.detail.element.errors?.[0] ?? event.detail.error;
    const { message } = error;
    this.snackbar.labelText = message || `Unknown Error in ${event.detail.element.tagName.toLowerCase()}`;
    this.snackbar.show();
  }

  /**
   * Scroll to latest message
   * @param  {ScrollBehavior}  [behavior='smooth']
   */
  async scrollMessages(behavior = 'smooth') {
    // wait on next task just to be safe
    await new Promise(r => setTimeout(r));
    await this.messagesQuery.updateComplete;
    this.messagesQuery.scroll({ behavior, top: this.messagesQuery.scrollHeight });
    if (this.messagesQuery.shadowRoot?.querySelectorAll?.('li')?.length)
      this.didInitialScroll = true;
  }

  async onLocalUserChanged() {
    const local = this.localUser;
    const id = local?.id?.toString?.();
    const userActive = !!id;

    this.joinInputs.hidden = userActive;
    this.nickShow.hidden = userActive;
    this.messageInputs.hidden = !userActive;
    this.joinInputs.setAttribute('aria-hidden', this.joinInputs.hidden.toString());
    this.nickShow.setAttribute('aria-expanded', userActive.toString());
    this.updateId(id);

    await this.userListQuery.updateComplete;
    await this.messagesQuery.updateComplete;

    if (userActive)
      this.messageInput.focus();
    else {
      this.messageInput.value = '';
      this.messageInput.blur();
      await new Promise(r => setTimeout(r));
      this.nickShow.focus();
    }

    this.settingsDiag.querySelector('input').value = local.nick || '';
    this.scrollMessages('auto');
  }

  updateId(id) {
    this.changeNickMut.setAttribute('data-id', id);
    this.messageMut.setAttribute('data-user-id', id);
    this.pingMut.setAttribute('data-user-id', id);
  }

  async part() {
    const { id, nick } = this.localUser;
    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    await this.partMut.mutate({
      variables: { id },
      optimisticResponse: { part: { id, nick, status } },
    });

    this.localUser = ({ id: null, nick: null, status });
  }

  /** @param {string} nick */
  async changeUsername(nick) {
    const { id } = this.localUser;
    if (!this.changeNickMut) return;
    const status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    await this.changeNickMut.mutate({
      variables: { id, nick },
      optimisticResponse: {
        __typename: 'Mutation',
        changeNickname: { __typename: 'User', id, nick, status },
      },
      update: (_, { data: { changeNickname: { id, nick } } }) => {
        this.localUser = ({ id, nick, status });
      },
    });

    this.messageInput.value = '';
  }

  /** @param {string} message */
  handleSlashCommand(message) {
    const [command, ...args] = message.split(' ');
    switch (command) {
      case 'nick': return this.changeUsername(args.join(' '));
      case 'part': return this.part();
    }
  }

  /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
  onMessageKeyup(event) {
    // @ts-expect-error: little white lie
    this.pingMut.debouncedMutate();
    if (event.key === 'Enter') {
      if (this.onWillSendMessage(event.target.value))
        this.messageMut.mutate();
    }
  }

  /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
  onNickInputKeyup(event) {
    if (event.key === 'Enter')
      event.target.closest('apollo-mutation').mutate();
  }

  onClickJoin() {
    const { nickInput, nickInputs, nickShow } = this;
    nickInputs.hidden = false;
    nickInputs.setAttribute('aria-hidden', 'false');
    nickShow.hidden = true;
    nickShow.setAttribute('aria-hidden', 'true');
    nickInput.focus();
  }

  /**
   * @param  {import('@apollo/client/core').InMemoryCache} cache
   * @param  {import('@apollo/client/core').ApolloQueryResult<import('./types').SendMessageMutationData>} result
   */
  messageUpdater(cache, result) {
    const { query } = this.messagesQuery;
    const cached = cache.readQuery({ query }) ?? this.messagesQuery.data;
    cache.writeQuery({ query, data: {
      ...cached,
      messages: [...cached.messages, result.data.sendMessage],
    } });
  }

  /** @param {string|import('@apollo-elements/components/events').WillMutateEvent} [evOrString] */
  onWillSendMessage(evOrString) {
    const message =
        typeof evOrString === 'string' ? evOrString
      : evOrString?.detail?.variables.message;

    if (!message.startsWith('/'))
      return true;
    else {
      this.handleSlashCommand(message.substr(1));
      return false;
    }
  }

  /** @param {import('@apollo-elements/core/events').ApolloMutationResultEvent<import('./types').JoinMutationData>} event */
  onJoinMutation(event) {
    const id = event.detail.data.join.id.toString();
    this.updateId(id);
    this.nickInputs.hidden = true;
    this.messageInputs.hidden = false;
    this.nickInput.value = '';
    const { data } = this.joinMut;
    const user = data?.join ?? null;
    if (!user) return;
    this.localUser = (user);
    localStorage.setItem('leeway-user', JSON.stringify(user));
    this.messageInput.tabIndex = 0;
    this.messageInput.focus();
  }

  /** @param {import('@apollo-elements/core/events').ApolloMutationResultEvent<import('./types').ChangeNickMutationData>} event */
  onChangeNickname(event) {
    this.localUser = event.detail.data.changeNickname;
  }

  /** @param {import('@apollo-elements/core/events').ApolloSubscriptionResultEvent<import('./types').MessageSentSubscriptionData>} event */
  onMessageSent(event) {
    // update the query element
    const { client, subscriptionData } = event.detail;
    const { data: { messageSent } } = subscriptionData;
    const { query } = this.messagesQuery;
    const cached = client.readQuery({ query }) ?? this.messagesQuery.data;
    const messages = [...cached.messages, messageSent];
    client.writeQuery({ query, data: { messages } });
    this.scrollMessages();
    if (document.hidden)
      this.notify(`${messageSent.user.nick} sent a message`, messageSent.message);
  }

  /** @param {import('@apollo-elements/components').ApolloSubscriptionElement|string} el */
  async notify(el, body) {
    let snack;
    // Display the notification
    if (el instanceof HTMLElement) {
      await el.updateComplete;
      snack = (/** @type {import("@material/mwc-snackbar").Snackbar} */(el.$('mwc-snackbar')));
      await snack.updateComplete;
    }

    if (document.hidden)
      this.attemptNotification(typeof el === 'string' ? el : snack.labelText, body);
    else
      snack?.show?.();
  }

  attemptNotification(text, body) {
    const icon = /** @type {HTMLLinkElement} */(document.head.querySelector('[rel="icon"]')).href;
    if (this.notificationPermission !== 'granted')
      return;
    else {
      const n = new Notification(text, { body, icon });
      setTimeout(n.close.bind(n), 4000);
    }
  }

  /** @param {import('@apollo-elements/core/events').ApolloSubscriptionResultEvent<import('./types').UserJoinedSubscriptionData> & { target: Leeway['joinedSub'] }} event */
  onUserJoined(event) {
    // update the query element
    const { client, subscriptionData } = event.detail;
    const { query } = this.userListQuery;
    const cached = client.readQuery({ query }) ?? this.userListQuery.data;
    const users = [...cached.users, subscriptionData.data.userJoined];
    client.writeQuery({ query, data: { ...cached, users } });
    this.notify(event.target);
  }

  /** @param {import('@apollo-elements/core/events').ApolloSubscriptionResultEvent<import('./types').UserPartedSubscriptionData> & { target: Leeway['partedSub'] }} event */
  onUserParted(event) {
    // update the query element
    const { client, subscriptionData } = event.detail;
    const { query } = this.userListQuery;
    const cached = client.readQuery({ query }) ?? this.userListQuery.data;
    const users = cached.users.filter(x => x.id !== subscriptionData.data.userParted.id);
    client.writeQuery({ query, data: { ...cached, users } });
    this.notify(event.target);
  }

  /** @param {import('@material/dialog').MDCDialogCloseEvent} event */
  onVersionDialogClosed({ detail: { action } }) {
    switch (action) {
      case 'ok': return location.reload();
      case 'cancel': return;
    }
  }

  /** @param {CustomEvent<{ value: ServiceWorker }>} event */
  async onServiceWorkerChanged(event) {
    if (event.detail.value.state !== 'installed') return;
    await import('./components/dialog.js');
    this.versionButton.hidden = false;
  }

  async openSettingsDiag() {
    await import('./components/dialog.js');
    this.maybeCloseDrawer();
    this.settingsDiag.show();
  }

  async openLegalDiag() {
    await import('./components/dependencies.js');
    this.maybeCloseDrawer();
    this.legalDiag.show();
  }

  maybeCloseDrawer() {
    if (!this.isWideScreen.matches) {
      this.drawer.close();
      this.onDrawerToggle();
    }
  }

  get notificationPermission() {
    if (!localStorage.getItem('notifications-permission'))
      localStorage.setItem('notifications-permission', Notification.permission);
    return localStorage.getItem('notifications-permission');
  }

  set notificationPermission(perm) {
    localStorage.setItem('notifications-permission', perm);
  }

  async onNotificationsSwitch() {
    if (this.notificationPermission !== 'granted')
      this.notificationPermission = await Notification.requestPermission();
    else
      this.notificationPermission = 'denied';

    this.notificationsSwitch.checked = this.notificationPermission === 'granted';
  }

  didInitialScroll = false;

  async connectedCallback() {
    const SUB_EVT = 'apollo-subscription-result';
    const MUT_EVT = 'mutation-completed';
    const QUR_EVT = 'apollo-query-result';
    this.versionButton.addEventListener('click', () => this.versionDiag.show());
    this.drawerToggle.addEventListener('click', this.onClickDrawerToggle.bind(this));
    this.isWideScreen.addEventListener('change', this.onMediaChange);
    this.joinedSub.addEventListener(SUB_EVT, this.onUserJoined.bind(this));
    this.joinMut.addEventListener(MUT_EVT, this.onJoinMutation.bind(this));
    this.messageInput.addEventListener('keyup', this.onMessageKeyup.bind(this));
    this.messageMut.addEventListener(MUT_EVT, () => this.messageInput.value = '');
    this.messageMut.addEventListener('will-mutate', this.onWillSendMessage.bind(this));
    this.messageMut.updater = this.messageUpdater.bind(this);
    this.messageSentSub.addEventListener(SUB_EVT, this.onMessageSent.bind(this));
    this.messagesQuery.addEventListener(QUR_EVT, () =>
      this.scrollMessages(this.didInitialScroll ? 'smooth' : 'auto'));
    this.nickInput.addEventListener('keyup', this.onNickInputKeyup.bind(this));
    this.nickShow.addEventListener('click', this.onClickJoin.bind(this));
    this.nickMut.addEventListener(MUT_EVT, this.onChangeNickname.bind(this));
    this.partedSub.addEventListener(SUB_EVT, this.onUserParted.bind(this));
    this.sw.addEventListener('change', this.onServiceWorkerChanged.bind(this));
    this.userListQuery.addEventListener(QUR_EVT, this.onLocalUserChanged.bind(this));
    this.versionDiag.addEventListener('closed', this.onVersionDialogClosed.bind(this));
    this.settingsToggle.addEventListener('click', this.openSettingsDiag.bind(this));
    this.legalToggle.addEventListener('click', this.openLegalDiag.bind(this));
    this.notificationsSwitch.addEventListener('click', this.onNotificationsSwitch.bind(this));
    this.notificationsSwitch.checked = this.notificationPermission === 'granted';

    for (const form of this.querySelectorAll('form'))
      form.addEventListener('submit', e => e.preventDefault());

    for (const el of this.querySelectorAll('apollo-query'))
      // @ts-expect-error: I know, but I'm adding it to the prototype lookup
      el.formatDate = Leeway.formatDate;

    window.addEventListener('mutation-error', this.onMutationError.bind(this));

    await import('./components/register.js');

    await Promise.all([
      customElements.whenDefined('apollo-mutation'),
      customElements.whenDefined('apollo-query'),
      customElements.whenDefined('hy-drawer'),
    ]);

    await Promise.all([
      this.messagesQuery.updateComplete,
      this.userListQuery.updateComplete,
    ]);

    this.nickShow.focus();
    document.body.removeAttribute('unresolved');
    document.getElementById('nick-show').removeAttribute('disabled');
    document.getElementById('nick-show').innerHTML = '';
    document.getElementById('drawer-toggle').removeAttribute('disabled');

    window.__APOLLO_CLIENT__ = this.client;

    super.connectedCallback();

    this.onMediaChange(this.isWideScreen);
    this.onDrawerToggle();
    this.onLocalUserChanged();
  }

  static formatDate(iso) {
    const mtime = new Date(iso);
    const today = new Date();
    // @ts-expect-error: JS allows subtracting dates
    if (Math.abs(today - mtime) > ONE_WEEK)
      return Leeway.longDateFormatter.format(mtime);
    else
      return relativeDate(mtime);
  }
}

customElements.define('leeway-chat', Leeway);
