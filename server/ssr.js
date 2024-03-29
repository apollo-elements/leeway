import relativeDate from 'tiny-relative-date';

import { readFileSync } from 'fs';
import { gql } from 'apollo-server-express';
import { parse } from 'parse5';
import { toHtml } from 'hast-util-to-html';
import { select, selectAll } from 'hast-util-select';
import { fromParse5 } from 'hast-util-from-parse5';
import { h } from 'hastscript';
import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { SchemaLink } from '@apollo/client/link/schema';

import { server, context } from './server.js';

const query = gql`
{
  users {
    id
    nick
    status
    lastSeen
  }

  messages {
    date
    message
    user {
      id
      nick
      status
    }
  }
}
`;

const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;
const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  weekday: 'long',
  month: 'long',
  year: 'numeric',
});

function formatDate(iso) {
  const mtime = new Date(iso);
  const today = new Date();
  // @ts-expect-error: JS allows subtracting dates
  if (Math.abs(today - mtime) > ONE_WEEK)
    return longDateFormatter.format(mtime);
  else
    return relativeDate(mtime);
}

/* eslint-disable no-multi-spaces, max-len */
const html              = readFileSync(new URL('../public/index.html', import.meta.url), 'utf-8');
const drawerShadow      = readFileSync(new URL('shadowRoots/drawer.html', import.meta.url), 'utf-8');
const iconButtonShadow  = readFileSync(new URL('shadowRoots/drawer-toggle.html', import.meta.url), 'utf-8');
const showLoginShadow    = readFileSync(new URL('shadowRoots/show-login.html', import.meta.url), 'utf-8');
/* eslint-enable no-multi-spaces, max-len */

function attachShadow(tree, shadowRoot) {
  tree.children.push(h('template', { shadowroot: 'open' }, [shadowRoot]));
}

export async function ssr(req, res) {
  const cache = new InMemoryCache();
  const link = new SchemaLink({ schema: server.schema, context: context({ req, res }) });
  const client = new ApolloClient({ cache, link, ssrMode: true });
  const result = await client.query({ query });
  const tree = fromParse5(parse(html));

  attachShadow(select('#drawer-toggle', tree), fromParse5(parse(iconButtonShadow)));
  attachShadow(select('#drawer', tree), fromParse5(parse(drawerShadow)));
  attachShadow(select('#show-login', tree), fromParse5(parse(showLoginShadow)));

  const messages = select('#leeway-messages', tree);
  attachShadow(messages, h(null, [
    ...selectAll('link', select('template', messages).content),
    h('ol', [
      result.data.messages.map(item => h(`li.user.message.${item.user.status.toLowerCase()}`, {
        dataInitial: item.user.nick.substring(0, 1).toUpperCase(),
        style: `--hue-coeff:${item.user.nick.length || 1};`,
      }, [
        h('span.nick', [item.user.nick]),
        h('time', { datetime: item.date }, [formatDate(item.date)]),
        h('span.text', [item.message]),
      ])),
    ]),
  ]));

  const userlist = select('#leeway-userlist', tree);
  attachShadow(userlist, h(null, [
    ...selectAll('link', select('template', userlist).content),
    h('header', [
      h('span.status.offline', { role: 'presentation' }),
      h('span.nick', 'Users'),
    ]),
    ...result.data.users.map(item => h('div.user', [
      h(`span.status.${item.status.toLowerCase()}`, { 'aria-label': item.status }),
      item.nick,
    ])),
  ]));

  return toHtml(tree);
}
