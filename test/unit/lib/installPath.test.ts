// remove NODE_OPTIONS to not interfere with tests
delete process.env.NODE_OPTIONS;

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { installPath } from 'tsds-lib';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '..', '..', '..');
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
