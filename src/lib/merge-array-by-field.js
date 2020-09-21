export function mergeArrayByField(field) {
  return function merge(existing, incoming, { readField, mergeObjects }) {
    const merged = existing ? existing.slice(0) : [];
    const indexes = Object.create(null);

    if (existing) {
      existing.forEach((item, index) => {
        indexes[readField(field.toString(), item)] = index;
      });
    }

    incoming.forEach(item => {
      const name = readField(field.toString(), item);
      const index = indexes[name];
      if (typeof index === 'number')
        merged[index] = mergeObjects(merged[index], item);
      else {
        indexes[name] = merged.length;
        merged.push(item);
      }
    });

    return merged;
  };
}
