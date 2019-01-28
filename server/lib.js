import curry from 'crocks/helpers/curry';

// eslint-disable-next-line no-console
export const trace = curry((tag, x) => console.log(tag, x) || x);

// eslint-disable-next-line no-console
export const traceMap = curry((f, tag, x) => console.log(tag, f(x)) || x);
