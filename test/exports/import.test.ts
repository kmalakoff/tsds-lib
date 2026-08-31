import assert from 'assert';
import * as lib from 'tsds-lib';
import { installPath, loadConfig, loadEnv } from 'tsds-lib';

describe('exports .ts', () => {
  it('exports on default', () => {
    assert.equal(typeof lib, 'object');
    assert.equal(typeof lib.installPath, 'function');
    assert.equal(typeof lib.loadConfig, 'function');
    assert.equal(typeof lib.loadEnv, 'function');
  });

  it('named exports', () => {
    assert.equal(typeof installPath, 'function');
    assert.equal(typeof loadConfig, 'function');
    assert.equal(typeof loadEnv, 'function');
  });
});
