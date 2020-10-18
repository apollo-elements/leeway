import { html } from 'lit-html';

export function errorTemplate(error) {
  if (!error) return '';
  return html`
    <aside id="error">
      <h1>😢 Such Sad, Very Error! 😰</h1>
      <pre>${error.message || 'Unknown Error'}</pre>
    </aside>
  `;
}
