// @ts-expect-error: ugh
window.process ??= { env: '' };

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
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

  /** @type{import('./types').$} */
  $ = {
    changeNickMutation: $('#change-nick-mutation'),
    drawer: $('hy-drawer'),
    drawerToggle: $('#drawer-toggle'),
    inputs: $('#inputs'),
    joinInputs: $('#join-inputs'),
    joinMutation: $('#join-mutation'),
    leewayMessages: $('#leeway-messages'),
    leewayUserlist: $('#leeway-userlist'),
    legalDialog: $('#legal-dialog'),
    legalToggle: $('#legal-toggle'),
    loginDialog: $('#login-dialog'),
    loginNick: $('#login-nick'),
    messageEditedSubscription: $('#message-edited-subscription'),
    messageInput: $('#message-input'),
    messageInputs: $('#message-inputs'),
    messageMutation: $('#message-mutation'),
    messageSentSubscription: $('#message-sent-subscription'),
    notificationsSwitch: $('mwc-switch'),
    passwordInput: $('#login-password'),
    pingMutation: $('#ping-mutation'),
    settingsDialog: $('#settings-dialog'),
    settingsToggle: $('#settings-toggle'),
    showLogin: $('#show-login'),
    snackbar: $('mwc-snackbar'),
    sw: $('service-worker'),
    userJoinedSubscription: $('#user-joined-subscription'),
    userPartedSubscription: $('#user-parted-subscription'),
    versionButton: $('#version-button'),
    versionDialog: $('#version-dialog'),
  }

  static longDateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  });

  static splitter({ query }) {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  }

  link = split(
    Leeway.splitter,
    new WebSocketLink({
      uri: `ws${'PROTOCOL_SUFFIX'}://${host}/graphql`,
      options: { reconnect: true },
    }),
    new HttpLink({ uri: `http${'PROTOCOL_SUFFIX'}://${host}/graphql` }),
  );

  /** @override */
  async createApolloClient() {
    const { link } = this;
    const cache = new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
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
        Message: {
          keyFields: ['date'],
        },
        User: {
          keyFields: ['id'],
          fields: {
            status: (prev, { readField }) => {
              if (prev === 'PARTED') return prev;
              if (readField('isMe'))
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
    this.client = new ApolloClient({
      cache,
      link,
      credentials: 'same-origin',
      ssrForceFetchDelay: 100,
    });
    return this.client;
  }

  async connectedCallback() {
    this.scrollMessages('auto');
    this.initUI();
    this.initOperations();
    await this.initWebComponents();

    this.$.showLogin.focus();
    document.body.removeAttribute('unresolved');
    document.getElementById('show-login').removeAttribute('disabled');
    document.getElementById('show-login').innerHTML = '';
    document.getElementById('drawer-toggle').removeAttribute('disabled');

    window.__APOLLO_CLIENT__ = this.client;

    super.connectedCallback();

    this.onMediaChange(this.isWideScreen);
    this.onDrawerToggle();
    this.onUserListUpdate();
  }

  initUI() {
    window.addEventListener('mutation-error', this.onMutationError.bind(this));
    this.$.versionDialog.addEventListener('closed', this.onVersionDialogClosed.bind(this));
    this.$.settingsToggle.addEventListener('click', this.openSettingsDiag.bind(this));
    this.$.sw.addEventListener('change', this.onServiceWorkerChanged.bind(this));
    this.$.versionButton.addEventListener('click', () => this.$.versionDialog.show());
    this.$.drawerToggle.addEventListener('click', this.onClickDrawerToggle.bind(this));
    this.isWideScreen.addEventListener('change', this.onMediaChange);
    this.$.legalToggle.addEventListener('click', this.openLegalDiag.bind(this));
    this.$.notificationsSwitch.addEventListener('click', this.onNotificationsSwitch.bind(this));
    this.$.notificationsSwitch.checked = this.notificationPermission === 'granted';
    for (const form of this.querySelectorAll('form'))
      form.addEventListener('submit', e => e.preventDefault());
    for (const el of this.querySelectorAll('apollo-query'))
      // @ts-expect-error: I know, but I'm adding it to the prototype lookup
      el.formatDate = Leeway.formatDate;
    this.$.leewayMessages.onToggleEditMessage = this.onToggleEditMessage;
  }

  initOperations() {
    const MUT_EVT = 'mutation-completed';
    const QUR_EVT = 'apollo-query-result';
    const SUB_EVT = 'apollo-subscription-result';
    this.$.joinMutation.addEventListener(MUT_EVT, this.onJoinMutation.bind(this));
    this.$.joinMutation.updater = this.joinUpdater.bind(this);
    this.$.leewayMessages.addEventListener(QUR_EVT, () => this.scrollMessages());
    this.$.leewayUserlist.addEventListener(QUR_EVT, this.onUserListUpdate.bind(this));
    this.$.loginDialog.addEventListener('opened', this.onLoginDialogOpened.bind(this));
    this.$.loginNick.addEventListener('keyup', this.onNickInputKeyup.bind(this));
    this.$.messageEditedSubscription.addEventListener(SUB_EVT, this.onMessageEdited.bind(this));
    this.$.messageInput.addEventListener('keyup', this.onMessageKeyup.bind(this));
    this.$.messageMutation.addEventListener(MUT_EVT, this.onMessageMutation.bind(this));
    this.$.messageMutation.updater = this.messageUpdater.bind(this);
    this.$.messageSentSubscription.addEventListener(SUB_EVT, this.onMessageSent.bind(this));
    this.$.showLogin.addEventListener('click', this.onClickJoin.bind(this));
    this.$.userJoinedSubscription.addEventListener(SUB_EVT, this.onUserJoined.bind(this));
    this.$.userPartedSubscription.addEventListener(SUB_EVT, this.onUserParted.bind(this));
  }

  async initWebComponents() {
    await import('./components/register.js');

    await Promise.all([
      customElements.whenDefined('apollo-mutation'),
      customElements.whenDefined('apollo-query'),
      customElements.whenDefined('hy-drawer'),
    ]);

    await Promise.all([
      this.$.leewayMessages.updateComplete,
      this.$.leewayUserlist.updateComplete,
    ]);
  }

  /** @param {MediaQueryList|MediaQueryListEvent} event */
  onMediaChange(event) {
    this.$.drawer.persistent = event.matches;
    this.$.drawer.opened = event.matches;
  }

  onDrawerToggle() {
    if (this.isWideScreen.matches)
      document.body.toggleAttribute('menu-open', this.$.drawer.opened);
  }

  /** @param {Event & { target: import('@material/mwc-dialog').Dialog } } event */
  onLoginDialogOpened(event) {
    event.target.querySelector('input').focus();
  }

  onClickDrawerToggle() {
    this.$.drawer.toggle();
    this.onDrawerToggle();
  }

  /** @param {import('@apollo-elements/components/events').MutationErrorEvent} event */
  async onMutationError(event) {
    await event.detail.element.updateComplete;
    const error = event.detail.element.errors?.[0] ?? event.detail.error;
    const { message } = error;
    this.$.snackbar.labelText = message || `Unknown Error in ${event.detail.element.tagName.toLowerCase()}`;
    this.$.snackbar.show();
  }

  /**
   * Scroll to latest message
   * @param  {ScrollBehavior}  [behavior='smooth']
   */
  async scrollMessages(behavior = 'smooth') {
    // wait on next task just to be safe
    await new Promise(r => setTimeout(r));
    await this.$.leewayMessages.updateComplete;
    this.$.leewayMessages.scroll({ behavior, top: this.$.leewayMessages.scrollHeight });
  }

  async onUserListUpdate() {
    await this.$.leewayUserlist.updateComplete;
    await this.$.leewayMessages.updateComplete;

    const { me } = this.$.leewayUserlist.data ?? {};

    this.$.joinInputs.hidden = !!me;
    this.$.showLogin.hidden = !!me;
    this.$.messageInputs.hidden = !me;
    this.$.joinInputs.setAttribute('aria-hidden', this.$.joinInputs.hidden.toString());
    this.$.showLogin.setAttribute('aria-expanded', (!!me).toString());

    if (me) {
      this.$.messageInput.focus();
      this.updateId(me.id);
    } else {
      this.$.messageInput.value = '';
      this.$.messageInput.blur();
      await new Promise(r => setTimeout(r));
      this.$.showLogin.focus();
    }

    this.$.settingsDialog.querySelector('input').value = me?.nick ?? '';
    this.scrollMessages('auto');
  }

  updateId(id) {
    this.$.changeNickMutation.setAttribute('data-id', id);
    this.$.messageMutation.setAttribute('data-user-id', id);
    this.$.pingMutation.setAttribute('data-user-id', id);
  }

  /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
  onMessageKeyup(event) {
    // @ts-expect-error: little white lie
    this.$.pingMutation.debouncedMutate();
    switch (event.key) {
      case 'Enter':
        this.$.messageMutation.mutate();
        break;
      case 'ArrowUp': {
        if (event.target.value) return;
        const last = this.$.leewayMessages.$('li[data-is-me="true"]:last-of-type');
        if (last)
          this.onToggleEditMessage({ target: last });
        break;
      }
    }
  }

  /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
  onNickInputKeyup(event) {
    if (event.key === 'Enter')
      event.target.closest('apollo-mutation').mutate();
  }

  async onClickJoin() {
    await import('./components/dialog.js');
    this.$.loginDialog.show();
  }

  onMessageMutation() {
    this.$.messageInput.value = '';
  }

  /**
   * @param  {import('@apollo/client/core').InMemoryCache} cache
   * @param  {import('@apollo/client/core').ApolloQueryResult<import('./types').JoinMutationData>} result
   */
  joinUpdater(cache, result) {
    const { query } = this.$.leewayUserlist;
    cache.writeQuery({ query, data: {
      ...cache.readQuery({ query }),
      me: result.data.join,
    } });
  }

  /**
   * @param  {import('@apollo/client/core').InMemoryCache} cache
   * @param  {import('@apollo/client/core').ApolloQueryResult<import('./types').SendMessageMutationData>} result
   */
  messageUpdater(cache, result) {
    const { query } = this.$.leewayUserlist;
    cache.writeQuery({ query, data: {
      ...cache.readQuery({ query }),
      me: result.data.sendMessage.user,
    } });

    if (result.data.sendMessage.message) {
      const { query } = this.$.leewayMessages;
      const cached = cache.readQuery({ query });
      cache.writeQuery({ query, data: {
        ...cached,
        messages: [...cached.messages, result.data.sendMessage],
      } });
    }

    this.onUserListUpdate();
  }

  editMessageUpdater(cache, result) {
    const { query } = this.$.leewayMessages;
    const cached = cache.readQuery({ query }) ?? this.$.leewayMessages.data;
    const { editMessage } = result.data;
    cache.writeQuery({ query, data: {
      ...cached,
      messages: cached.messages.map(x =>
          x.date !== editMessage.date ? x
        : ({ ...x, ...editMessage })),
    } });
    const item = this.$.leewayMessages.shadowRoot.querySelector(`li[data-message-date="${editMessage.date}"]`);
    item.classList.remove('editing');
  }

  /** @param {import('@apollo-elements/core/events').ApolloMutationResultEvent<import('./types').JoinMutationData>} event */
  onJoinMutation(event) {
    const id = event.detail.data.join.id.toString();
    this.updateId(id);
    this.$.messageInputs.hidden = false;
    this.$.loginNick.value = '';
    this.$.passwordInput.value = '';
    const { data } = this.$.joinMutation;
    const user = data?.join ?? null;
    if (!user) return;
    this.$.messageInput.tabIndex = 0;
    this.$.loginDialog.close();
    this.$.messageInput.focus();
  }

  /** @param {import('@apollo-elements/core/events').ApolloSubscriptionResultEvent<import('./types').MessageSentSubscriptionData>} event */
  onMessageSent(event) {
    // update the query element
    const { client, subscriptionData } = event.detail;
    const { data: { messageSent } } = subscriptionData;
    const { query } = this.$.leewayMessages;
    const cached = client.readQuery({ query }) ?? this.$.leewayMessages.data;
    const messages = [...cached.messages, messageSent];
    client.writeQuery({ query, data: { messages } });
    this.scrollMessages();
    if (document.hidden)
      this.notify(`${messageSent.user.nick} sent a message`, messageSent.message);
  }

  /** @param {import('@apollo-elements/core/events').ApolloSubscriptionResultEvent<import('./types').MessageEditedSubscriptionData>} event */
  onMessageEdited(event) {
    // update the query element
    const { client, subscriptionData } = event.detail;
    const { data: { messageEdited } } = subscriptionData;
    const { query } = this.$.leewayMessages;
    const cached = client.readQuery({ query }) ?? this.$.leewayMessages.data;
    client.writeQuery({
      query,
      data: {
        messages: cached.messages.map(x =>
            x.date !== messageEdited.date ? x
          : ({ ...x, ...messageEdited })),
      },
    });
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

  /** @param {import('@apollo-elements/core/events').ApolloSubscriptionResultEvent<import('./types').UserJoinedSubscriptionData> & { target: Leeway['$']['userJoinedSubscription'] }} event */
  onUserJoined(event) {
    // update the query element
    const { client, subscriptionData } = event.detail;
    const { userJoined } = subscriptionData.data;
    const { query } = this.$.leewayUserlist;
    const cached = client.readQuery({ query }) ?? this.$.leewayUserlist.data;
    let updatedExistingUser = false;
    const users = [];
    // sometimes you just don't want to iterate twice
    // eslint-disable-next-line easy-loops/easy-loops
    for (const user of cached.users) {
      if (user.id === userJoined.id)
        users.push((updatedExistingUser = true, userJoined));
      else
        users.push(user);
    }
    if (!updatedExistingUser)
      users.push(userJoined);
    client.writeQuery({ query, data: { ...cached, users } });
    this.notify(event.target);
  }

  /** @param {import('@apollo-elements/core/events').ApolloSubscriptionResultEvent<import('./types').UserPartedSubscriptionData> & { target: Leeway['$']['userPartedSubscription'] }} event */
  onUserParted(event) {
    // update the query element
    const { client, subscriptionData } = event.detail;
    const { query } = this.$.leewayUserlist;
    const { userParted } = subscriptionData.data;
    const cached = client.readQuery({ query }) ?? this.$.leewayUserlist.data;
    client.writeQuery({ query, data: {
      ...cached,
      users: cached.users.map(x => x.id !== userParted.id ? x : ({
        ...x,
        status: 'PARTED',
      })),
    } });
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
    this.$.versionButton.hidden = false;
  }

  async openSettingsDiag() {
    await import('./components/dialog.js');
    this.maybeCloseDrawer();
    this.$.settingsDialog.show();
  }

  async openLegalDiag() {
    await import('./components/dependencies.js');
    this.maybeCloseDrawer();
    this.$.legalDialog.show();
  }

  maybeCloseDrawer() {
    if (!this.isWideScreen.matches) {
      this.$.drawer.close();
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

    this.$.notificationsSwitch.checked = this.notificationPermission === 'granted';
  }

  onToggleEditMessage = e => {
    const item = e.target.closest('li');
    const mutation = item.querySelector('apollo-mutation');
    const input = item.querySelector('input');
    mutation.updater ??= this.editMessageUpdater.bind(this);
    item.classList.toggle('editing');
    if (!item.classList.contains('editing'))
      input.blur();
    else {
      input.focus();
      input.addEventListener('keyup', this.onEditKeyup);
    }
  };

  onEditKeyup = event => {
    const { key, target } = event;
    const mutation = target.closest('li').querySelector('apollo-mutation');
    switch (key) {
      case 'Enter':
        target.removeEventListener('keyup', this.onEditKeyup);
        return mutation.mutate();
      case 'Escape':
        target.removeEventListener('keyup', this.onEditKeyup);
        return this.onToggleEditMessage(event);
    }
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
