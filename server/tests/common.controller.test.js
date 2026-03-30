const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const controllerPath = path.resolve(__dirname, '../controllers/common.controller.js');
const cityModelPath = path.resolve(__dirname, '../models/city.js');
const stateModelPath = path.resolve(__dirname, '../models/state.js');
const usersModelPath = path.resolve(__dirname, '../models/users.js');

function createRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    send(body) {
      this.payload = body;
      return this;
    },
  };
}

function loadController({ cityModel, stateModel, usersModel }) {
  delete require.cache[controllerPath];
  require.cache[cityModelPath] = { id: cityModelPath, filename: cityModelPath, loaded: true, exports: cityModel };
  require.cache[stateModelPath] = { id: stateModelPath, filename: stateModelPath, loaded: true, exports: stateModel || {} };
  require.cache[usersModelPath] = { id: usersModelPath, filename: usersModelPath, loaded: true, exports: usersModel || {} };
  return require(controllerPath);
}

test('addCity returns 200 when save succeeds', async () => {
  function FakeCity(body) {
    this.body = body;
  }
  FakeCity.prototype.save = async function save() {
    return { _id: 'city123', ...this.body };
  };

  const controller = loadController({ cityModel: FakeCity });
  const res = createRes();

  await controller.addCity({ body: { name: 'Guwahati' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { message: 'City added successfully' });
});

test('removeCity uses deleteOne and returns success payload', async () => {
  const controller = loadController({
    cityModel: {
      deleteOne: async ({ _id }) => ({ acknowledged: true, deletedCount: _id === 'abc' ? 1 : 0 }),
    },
  });
  const res = createRes();

  await controller.removeCity({ params: { cityId: 'abc' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.message, 'City removed successfully');
  assert.equal(res.payload.data.deletedCount, 1);
});
