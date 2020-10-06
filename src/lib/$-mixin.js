export const $Mixin = superclass => class extends superclass {
  $(id) {
    return (
      this.shadowRoot &&
      this.shadowRoot.getElementById(id) ||
      null
    );
  }

  firstUpdated() {
    for (const el of this.shadowRoot.querySelectorAll('[id]'))
      this[`$${el.id}`] = el;
  }
};
