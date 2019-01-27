import { ApolloQuery, html } from 'lit-apollo';
import { styleMap } from 'lit-html/directives/style-map';
import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { css } from 'lit-element';
import gql from 'graphql-tag';

import compose from 'crocks/helpers/compose';
import map from 'crocks/pointfree/map';
import propOr from 'crocks/helpers/propOr';


const getStyleMap = compose(styleMap, ({ nick, status }) => ({
  '--hue-coeff': nick.length,
  '--saturation': status === 'ONLINE' ? '0%' : '50%'
}));

const userTemplate = ({ nick, status } = {}) => (html`
  <div class="user-border" style=${getStyleMap({ nick, status })}>${nick}</div>
`);
import { style } from './shared-styles';

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
  static get styles() {
    return [style, css`
      .user {
        padding: 4px;
        align-items: center;
      }

      .me {
        font-weight: bold;
      }

      .status {
        border-radius: 100%;
        display: inline-block;
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }

      .online {
        background: limegreen;
      }

      .offline {
        background: lightgrey;
      }
    `];
  }

  render() {
    return html`
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
