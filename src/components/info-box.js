import { LitElement, css, html } from 'lit-element';

/**
 * <info-box>
 * @customElement
 * @extends LitElement
 */
class InfoBox extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }

      section {
        padding: 14px;
        position: relative;
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

      ::slotted(h2) {
        font-size: 18px;
      }
    `;
  }

  render() {
    return html`
      <section>
        <h2 ?hidden="${!this.heading}">${this.heading}</h2>
        <button @click=${this.close} aria-label="close">x</button>
        <slot></slot>
      </section>
    `;
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

customElements.define('info-box', InfoBox);
