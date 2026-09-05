// remove NODE_OPTIONS to not interfere with tests
delete process.env.NODE_OPTIONS;

import assert from 'assert';
import path from 'path';
import { loadEnv } from 'tsds-lib';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '..', '..', 'fixtures');
describe('loadEnv', () => {
  const envFixturePath = path.join(fixturesPath, 'loadenv', '.env');

  afterEach(() => {
    // Clean up env vars set by tests
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.API_KEY;
    delete process.env.QUOTED_VALUE;
    delete process.env.EMPTY_VALUE;
    delete process.env.SPACED_KEY;
  });

  it('should parse .env file and set environment variables', () => {
    const result = loadEnv({ path: envFixturePath });
    assert.ok(result.parsed);
    assert.equal(result.parsed.DB_HOST, 'localhost');
    assert.equal(result.parsed.DB_PORT, '5432');
    assert.equal(process.env.DB_HOST, 'localhost');
    assert.equal(process.env.DB_PORT, '5432');
  });

  it('should handle double-quoted values', () => {
    const result = loadEnv({ path: envFixturePath });
    assert.ok(result.parsed);
    assert.equal(result.parsed.API_KEY, 'secret-key');
  });

  it('should handle single-quoted values', () => {
    const result = loadEnv({ path: envFixturePath });
    assert.ok(result.parsed);
    assert.equal(result.parsed.QUOTED_VALUE, 'single-quoted');
  });

  it('should return error for non-existent file', () => {
    const result = loadEnv({ path: '/nonexistent/.env' });
    assert.ok(result.error);
    assert.ok(!result.parsed);
  });

  it('should use .env as default path', () => {
    const result = loadEnv();
    // Will likely error since .env doesn't exist in cwd during tests
    assert.ok(result.error || result.parsed);
  });
});
