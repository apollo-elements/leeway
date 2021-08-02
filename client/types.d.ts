/* eslint-disable max-len */

import type { HyDrawer } from 'hy-drawer/lib';
import type { Snackbar } from '@material/mwc-snackbar';

import type { MutationUpdaterFunction, NormalizedCacheObject, TypedDocumentNode } from '@apollo/client/core';

import type { ApolloMutationElement, ApolloQueryElement, ApolloSubscriptionElement } from '@apollo-elements/components';
import { IconButton } from '@material/mwc-icon-button';
import { ServiceWorkerElement } from '@power-elements/service-worker';
import { Button } from '@material/mwc-button';
import { Dialog } from '@material/mwc-dialog';
import { Switch } from '@material/mwc-switch';

export interface User {
  id: number;
  nick: string;
  /** ISO 8601 Date Format String */
  lastSeen?: string
  status: 'PARTED'|'ONLINE'|'OFFLINE'|'AWAY';
}

export interface UsersQueryData {
  localUser: User;
  users: User[];
  me: User;
}

export interface Message {
  date: string;
  message: string;
  user: User;
}

export interface SendMessageMutationData {
  sendMessage: Message;
}

export interface SendMessageMutationVariables {
  userId: number;
  message: string;
}

export interface MessagesQueryData {
  messages: Message[];
}

export interface ChangeNickMutationData {
  changeNickname: User;
}

export interface ChangeNickMutationVariables {
  id: number;
  nick: string;
}

export interface JoinMutationData {
  join: User;
}

export interface JoinMutationVariables {
  nick: string;
}

export interface MessageEditedSubscriptionData {
  messageEdited: Message;
}

export interface MessageSentSubscriptionData {
  messageSent: Message;
}

export interface UserJoinedSubscriptionData {
  userJoined: User;
}

export interface UserPartedSubscriptionData {
  userParted: User;
}

export interface UpdateUserLastSeenMutationData {
  id: string;
  lastSeen: string;
  isMe: boolean;
}

export type ChangeNickMutation = TypedDocumentNode<ChangeNickMutationData, ChangeNickMutationVariables>;
export type UpdateUserLastSeenMutation = TypedDocumentNode<UpdateUserLastSeenMutationData>;
export type JoinMutation = TypedDocumentNode<JoinMutationData, JoinMutationVariables>;
export type MessagesQuery = TypedDocumentNode<MessagesQueryData>;
export type UsersQuery = TypedDocumentNode<UsersQueryData>;
export type SendMessageMutation = TypedDocumentNode<SendMessageMutationData, SendMessageMutationVariables>;
export type UserJoinedSubscription = TypedDocumentNode<UserJoinedSubscriptionData>;
export type UserPartedSubscription = TypedDocumentNode<UserPartedSubscriptionData>;
export type MessageSentSubscription = TypedDocumentNode<MessageSentSubscriptionData>;
export type MessageEditedSubscription = TypedDocumentNode<MessageEditedSubscriptionData>;
export type UsersElType = ApolloQueryElement<UsersQuery>;
export type MessagesElType = ApolloQueryElement<MessagesQuery> & {
  editing: boolean;
  onToggleEditMessage: (event: Event) => void
  editMessageUpdater: MutationUpdaterFunction<any, any, any, any>;
};

declare global {
  interface Window {
    __APOLLO_STATE__: NormalizedCacheObject;
    WebComponents: { waitFor(fn: () => void|Promise<void>): void };
  }

  interface HTMLElementTagNameMap {
    'hy-drawer': HTMLElement & HyDrawer;
    'mwc-snackbar': Snackbar;
  }
}

export interface $ {
  changeNickMutation: ApolloMutationElement<ChangeNickMutation>;
  drawer: HyDrawer;
  userJoinedSubscription: ApolloSubscriptionElement<UserJoinedSubscription>;
  joinInputs: HTMLElement;
  inputs: HTMLElement;
  messageInput: HTMLInputElement;
  messageInputs: HTMLElement;
  messageMutation: ApolloMutationElement<SendMessageMutation>;
  messageSentSubscription: ApolloSubscriptionElement<MessageSentSubscription>;
  messageEditedSubscription: ApolloSubscriptionElement<MessageEditedSubscription>;
  leewayMessages: MessagesElType;
  loginNick: HTMLInputElement;
  passwordInput: HTMLInputElement;
  joinMutation: ApolloMutationElement<JoinMutation>;
  changeNickMutation: ApolloMutationElement<ChangeNickMutation>;
  showLogin: IconButton;
  userPartedSubscription: ApolloSubscriptionElement<UserPartedSubscription>;
  pingMutation: ApolloMutationElement<UpdateUserLastSeenMutation>;
  leewayUserlist: UsersElType;
  sw: ServiceWorkerElement;
  versionDialog: Dialog;
  loginDialog: Dialog;
  versionButton: Button;
  settingsDialog: Dialog;
  legalDialog: Dialog;
  drawerToggle: IconButton;
  settingsToggle: IconButton;
  legalToggle: IconButton;
  snackbar: Snackbar;
  notificationsSwitch: Switch;
}
