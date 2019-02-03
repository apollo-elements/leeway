import { css } from 'lit-element';

export const inputStyles = css`
:host {
  max-width: 100%;
  display: flex;
  align-items: center;
}

input {
  flex: 1 1 auto;
  padding-left: 12px;
  height: 100%;
  box-sizing: border-box;
  border: none;
}

mwc-button {
  width: 100%;
  flex: 0 1 54px;
}
`;