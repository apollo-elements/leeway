/* eslint-disable max-len */

import type { HyDrawer } from 'hy-drawer/lib';
import type { Snackbar } from '@material/mwc-snackbar';

import type { NormalizedCacheObject, TypedDocumentNode } from '@apollo/client/core';

import type { ApolloQueryElement } from '@apollo-elements/components';

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

export interface MessageSentSubscriptionData {
  messageSent: Message;
}

export interface UserJoinedSubscriptionData {
  userJoined: User;
}

export interface UserPartedSubscriptionData {
  userParted: User;
}

export type ChangeNickMutation = TypedDocumentNode<ChangeNickMutationData, ChangeNickMutationVariables>;
export type JoinMutation = TypedDocumentNode<JoinMutationData, JoinMutationVariables>;
export type MessagesQuery = TypedDocumentNode<MessagesQueryData, null>;
export type UsersQuery = TypedDocumentNode<UsersQueryData, null>;
export type MessagesElType = ApolloQueryElement<MessagesQuery>;
export type UsersElType = ApolloQueryElement<UsersQuery>;

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
