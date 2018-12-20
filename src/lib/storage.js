export const get = key => JSON.parse(localStorage.getItem(key));
export const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
