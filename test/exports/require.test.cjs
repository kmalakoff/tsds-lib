const assert = require('assert');
const lib = require('tsds-lib');

describe('exports .cjs', () => {
  it('exports', () => {
    assert.equal(typeof lib.installPath, 'function');
    assert.equal(typeof lib.loadConfig, 'function');
    assert.equal(typeof lib.loadEnv, 'function');
  });
});
