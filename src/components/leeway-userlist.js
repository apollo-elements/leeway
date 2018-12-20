import { ApolloQuery, html } from 'lit-apollo';
import { styleMap } from 'lit-html/directives/style-map';
import gql from 'graphql-tag';

import compose from 'crocks/helpers/compose';
import map from 'crocks/pointfree/map';
import propOr from 'crocks/helpers/propOr';

import { style } from './shared-styles';

const getStyleMap = compose(styleMap, ({ nick, status }) => ({
  '--hue-coeff': nick.length,
  '--saturation': status === 'ONLINE' ? '0%' : '50%'
}));

const userTemplate = ({ nick, status } = {}) => (html`
  <div class="user-border" style=${getStyleMap({ nick, status })}>${nick}</div>
`);

const showUsers = compose(map(userTemplate), propOr([], 'users'));

const updateQuery = (prev, { subscriptionData: { data: { userStatusUpdated: user } } }) => ({
  ...prev,
  users: [
    ...(prev.users || []).filter(({ id }) => id !== user.id),
    user,
  ]
});

/**
 * <leeway-userlist>
 * @customElement
 * @extends LitElement
 */
class LeewayUserlist extends ApolloQuery {
  render() {
    return html`
      ${style}
      <style>
        .user-border {
          padding: 4px;
        }
      </style>
      <slot></slot>
      ${this.error && this.error}
      ${showUsers(this.data)}
    `;
  }

  static get is() {
    return 'leeway-userlist';
  }

  firstUpdated() {
    this.subscribeToMore({
      updateQuery,
      document: gql`
        subscription {
          userStatusUpdated {
            id
            nick
            status
          }
        }`
    });
  }

}

customElements.define(LeewayUserlist.is, LeewayUserlist);
