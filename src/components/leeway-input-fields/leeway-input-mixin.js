import { $Mixin } from '../../lib/$-mixin';

export const LeewayInputMixin = superclass => class extends $Mixin(superclass) {
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

  onCompleted() {
    this.input.value = '';
  }
};
