export const LeewayInputMixin = superclass => class extends superclass {
  static get properties() {
    return {
      user: { type: Object },
    };
  }

  get input() {
    return this.$('input');
  }

  constructor() {
    super();
    this.user = {};
  }

  $(id) {
    return (
      this.shadowRoot &&
      this.shadowRoot.getElementById(id)
      || null
    );
  }

  onCompleted() {
    this.input.value = '';
    // this.input.focus();
  }
};
