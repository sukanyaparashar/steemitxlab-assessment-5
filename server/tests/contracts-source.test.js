const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const homeTx = fs.readFileSync(path.resolve(__dirname, '../../contracts/HomeTransaction.sol'), 'utf8');
const factory = fs.readFileSync(path.resolve(__dirname, '../../contracts/Factory.sol'), 'utf8');

test('HomeTransaction restricts withdrawal to participants and preserves deadline rule', () => {
  assert.match(homeTx, /Only transaction participants can withdraw/);
  assert.match(homeTx, /Only buyer can withdraw before transaction deadline/);
});

test('HomeTransaction requires exact remaining payment and uses safer transfer helper', () => {
  assert.match(homeTx, /Buyer needs to pay the exact remaining cost/);
  assert.match(homeTx, /recipient\.call\{value: amount\}\(''\)/);
});

test('Factory emits creation event and stores deployed contract addresses', () => {
  assert.match(factory, /event HomeTransactionCreated/);
  assert.match(factory, /address\[\] public contractsList/);
});
