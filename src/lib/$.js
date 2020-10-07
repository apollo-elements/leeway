/**
 * @param {string} selector
 * @param {Document|DocumentFragment} root
 * @return {Element}
 */
export function $(selector, root = document) {
  return root.querySelector(selector);
}
