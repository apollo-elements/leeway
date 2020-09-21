export const not = p => x => !p(x);
export const and = (p, q) => x => p(x) && q(x);
export const or = (p, q) => x => p(x) || q(x);
