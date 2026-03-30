module.exports = {
  slugGenerator: async (title, fieldName, tableName) => {
    const safeTitle = title || 'Property listing';
    const baseSlug = safeTitle
      .trim()
      .toLowerCase()
      .split(' ')
      .join('-')
      .replace(/[,"$!^@%*&]+/g, '');

    const table = require(`../models/${tableName}`);
    let incrementer = 0;

    if (!table) {
      return `${Date.now()}`;
    }

    do {
      const candidate = incrementer ? `${baseSlug}-${incrementer}` : baseSlug;
      const result = await table.findOne({ slug: candidate }).select('slug');

      if (result && result.slug) {
        incrementer += 1;
      } else {
        return candidate;
      }
    } while (true);
  },

  isKeyMissing: (data, requiredArray) => {
    for (const element of requiredArray) {
      if (!data[element]) {
        return element;
      }
    }
    return false;
  },
};
