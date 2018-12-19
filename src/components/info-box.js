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
          position: relative;
          border-radius: 4px;
          background-color: hsla(var(--primary-hue) 50% 50% / 0.3);
          box-shadow: 2px 2px 2px hsla(0 0% 0% / 0.3);
        }

        button {
          float: right;
          border: none;
          background: none;
        }

        :host([closed]) {
          height: 0px;
          overflow: hidden;
          opacity: 0;
          z-index: -1000;
        }

        :host([closed]) section {
          opacity: 0;
        }
      </style>
      <section>
        <h2 ?hidden="${!this.heading}">${this.heading}</h2>
        <button @click=${this.close} aria-label="close">x</button>
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
      closed: { type: Boolean, reflect: true }
    };
  }

  close() {
    this.closed = true;
  }
}

customElements.define(InfoBox.is, InfoBox);
