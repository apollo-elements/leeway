import { LitElement, html } from '@polymer/lit-element';

/**
 * <info-box>
 * @customElement
 * @extends LitElement
 */
class InfoBox extends LitElement {
  render() {
    return html`
      <style>
        :host {
          display: block;
          padding: 14px;
        }

        section {
          padding: 14px;
          border-radius: 4px;
          background-color: hsla(var(--primary-hue) 50% 50% / 0.3);
          box-shadow: 2px 2px 2px hsla(0 0% 0% / 0.3);
        }
      </style>
      <section>
        <h2>${this.heading}</h2>
        <slot></slot>
      </section>
    `;
  }

  static get is() {
    return 'info-box';
  }

  static get properties() {
    return {
      heading: { type: String },
    };
  }
}

customElements.define(InfoBox.is, InfoBox);
