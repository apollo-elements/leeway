export const $Mixin = superclass => class extends superclass {
  $(id) {
    return (
      this.shadowRoot &&
      this.shadowRoot.getElementById(id) ||
      null
    );
  }
};
