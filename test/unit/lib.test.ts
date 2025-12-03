// remove NODE_OPTIONS from ts-dev-stack
delete process.env.NODE_OPTIONS;

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { installPath, loadConfig, loadFileConfig } from 'tsds-lib';
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

      it('should throw error when both package.json tsds and top-level source exist', () => {
        assert.throws(() => loadConfig({ cwd: path.join(fixturesPath, 'config-conflict-tsds-source') }), /Conflicting tsds configuration.*package\.json "tsds" section.*package\.json "source" field/);
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

      it('should throw error when both package.json tsds and top-level source exist', () => {
        assert.throws(() => loadFileConfig(path.join(fixturesPath, 'config-conflict-tsds-source')), /Conflicting tsds configuration/);
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
});
