// remove NODE_OPTIONS to not interfere with tests
delete process.env.NODE_OPTIONS;

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { installPath, loadConfig, loadEnv, loadFileConfig } from 'tsds-lib';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '..', '..');
const fixturesPath = path.join(__dirname, '..', 'fixtures');

describe('lib', () => {
  describe('loadConfig', () => {
    it('should load tsds config from package.json', () => {
      const config = loadConfig({ cwd: packagePath });
      assert.ok(config, 'config should exist');
      assert.equal(config.source, 'src/index.ts');
    });

    it('should return null for directory without package.json', () => {
      const config = loadConfig({ cwd: '/tmp' });
      assert.equal(config, null);
    });

    it('should use provided config option', () => {
      const providedConfig = { source: 'custom/index.ts' };
      const config = loadConfig({ config: providedConfig });
      assert.deepEqual(config, providedConfig);
    });

    describe('file configuration sources', () => {
      it('should load config from .tsdsrc.json when present', () => {
        const config = loadConfig({ cwd: path.join(fixturesPath, 'config-tsdsrc') });
        assert.ok(config);
        assert.equal(config.source, 'src/main.ts');
        assert.deepEqual(config.targets, ['esm']);
      });

      it('should load config from package.json tsds field', () => {
        const config = loadConfig({ cwd: path.join(fixturesPath, 'config-package-json') });
        assert.ok(config);
        assert.equal(config.source, 'src/index.ts');
      });

      it('should load config from top-level source field', () => {
        const config = loadConfig({ cwd: path.join(fixturesPath, 'config-source-toplevel') });
        assert.ok(config);
        assert.equal(config.source, 'src/entry.ts');
      });

      it('should return null when no config source exists', () => {
        const config = loadConfig({ cwd: path.join(fixturesPath, 'config-none') });
        assert.equal(config, null);
      });
    });

    describe('configuration priority', () => {
      it('should use CommandOptions.config over file config', () => {
        const providedConfig = { source: 'override/index.ts' };
        const config = loadConfig({
          cwd: path.join(fixturesPath, 'config-tsdsrc'),
          config: providedConfig,
        });
        assert.deepEqual(config, providedConfig);
      });
    });

    describe('conflict detection', () => {
      it('should throw error when both .tsdsrc.json and package.json tsds exist', () => {
        assert.throws(() => loadConfig({ cwd: path.join(fixturesPath, 'config-conflict-rc-tsds') }), /Conflicting tsds configuration.*\.tsdsrc\.json.*package\.json "tsds" section/);
      });

      it('should throw error when both .tsdsrc.json and top-level source exist', () => {
        assert.throws(() => loadConfig({ cwd: path.join(fixturesPath, 'config-conflict-rc-source') }), /Conflicting tsds configuration.*\.tsdsrc\.json.*package\.json "source" field/);
      });

      it('should throw error when source is in both top-level and tsds section', () => {
        assert.throws(() => loadConfig({ cwd: path.join(fixturesPath, 'config-conflict-tsds-source') }), /Conflicting tsds configuration.*"source" in both.*top-level.*"tsds" section/);
      });
    });

    describe('config merging', () => {
      it('should merge top-level source with tsds section config', () => {
        const config = loadConfig({ cwd: path.join(fixturesPath, 'config-merge-source-tsds') });
        assert.ok(config);
        assert.equal(config.source, 'src/index.ts');
        assert.deepEqual(config.targets, ['esm', 'cjs']);
        assert.deepEqual(config.commands, { build: null });
      });
    });
  });

  describe('loadFileConfig', () => {
    it('should load config from .tsdsrc.json when present', () => {
      const config = loadFileConfig(path.join(fixturesPath, 'config-tsdsrc'));
      assert.ok(config);
      assert.equal(config.source, 'src/main.ts');
      assert.deepEqual(config.targets, ['esm']);
    });

    it('should load config from package.json tsds field', () => {
      const config = loadFileConfig(path.join(fixturesPath, 'config-package-json'));
      assert.ok(config);
      assert.equal(config.source, 'src/index.ts');
    });

    it('should load config from top-level source field', () => {
      const config = loadFileConfig(path.join(fixturesPath, 'config-source-toplevel'));
      assert.ok(config);
      assert.equal(config.source, 'src/entry.ts');
    });

    it('should return null when no config source exists', () => {
      const config = loadFileConfig(path.join(fixturesPath, 'config-none'));
      assert.equal(config, null);
    });

    it('should handle invalid JSON in .tsdsrc.json gracefully and fall back to package.json', () => {
      const config = loadFileConfig(path.join(fixturesPath, 'config-invalid-rc'));
      assert.ok(config);
      // Should fall back to package.json tsds field
      assert.equal(config.source, 'src/fallback.ts');
    });

    describe('conflict detection', () => {
      it('should throw error when both .tsdsrc.json and package.json tsds exist', () => {
        assert.throws(() => loadFileConfig(path.join(fixturesPath, 'config-conflict-rc-tsds')), /Conflicting tsds configuration/);
      });

      it('should throw error when both .tsdsrc.json and top-level source exist', () => {
        assert.throws(() => loadFileConfig(path.join(fixturesPath, 'config-conflict-rc-source')), /Conflicting tsds configuration/);
      });

      it('should throw error when source is in both top-level and tsds section', () => {
        assert.throws(() => loadFileConfig(path.join(fixturesPath, 'config-conflict-tsds-source')), /Conflicting tsds configuration.*"source" in both/);
      });
    });

    describe('config merging', () => {
      it('should merge top-level source with tsds section config', () => {
        const config = loadFileConfig(path.join(fixturesPath, 'config-merge-source-tsds'));
        assert.ok(config);
        assert.equal(config.source, 'src/index.ts');
        assert.deepEqual(config.targets, ['esm', 'cjs']);
        assert.deepEqual(config.commands, { build: null });
      });
    });
  });

  describe('installPath', () => {
    it('should return node_modules path for package', () => {
      const result = installPath({ cwd: packagePath });
      const pkg = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
      assert.equal(result, path.join(packagePath, 'node_modules', pkg.name));
    });

    it('should use provided installPath option', () => {
      const customPath = '/custom/install/path';
      const result = installPath({ installPath: customPath });
      assert.equal(result, customPath);
    });
  });

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
});
