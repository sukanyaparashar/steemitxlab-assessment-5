const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const helperPath = path.resolve(__dirname, '../providers/helper.js');
const modelPath = path.resolve(__dirname, '../models/property.js');

function loadHelperWithMockedModel(mockModel) {
  delete require.cache[helperPath];
  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: mockModel,
  };
  return require(helperPath);
}

test('isKeyMissing returns the first missing required key', () => {
  const helpers = require('../providers/helper');
  const missing = helpers.isKeyMissing({ email: 'a@example.com' }, ['email', 'password', 'name']);
  assert.equal(missing, 'password');
});

test('slugGenerator appends an increment for duplicate slugs', async () => {
  const helpers = loadHelperWithMockedModel({
    findOne: ({ slug }) => ({
      select: async () => (slug === 'my-home' ? { slug } : null),
    }),
  });

  const slug = await helpers.slugGenerator('My Home', 'title', 'property');
  assert.equal(slug, 'my-home-1');
});
