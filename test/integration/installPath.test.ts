// This suite runs a real `npm install` and reaches the npm registry over the network.
// remove NODE_OPTIONS to not interfere with tests
delete process.env.NODE_OPTIONS;

import assert from 'assert';
import { crossSpawn } from 'cross-spawn-cb';
import fs from 'fs';
import { link } from 'link-unlink';
import path from 'path';
import { installPath } from 'tsds-lib';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '..', '..');
const TMP = path.join(packagePath, '.tmp', `install-path-${process.pid}`);

// The fixture package is named wrappy and depends on once@1.4.0, which depends on wrappy:
// npm installs the published wrappy at node_modules/wrappy, the folder a link to the repository root used to occupy.
const NAME = 'wrappy';
const ROOT_ENTRIES = ['.git', 'src', 'test', 'package.json', 'package-lock.json', 'node_modules'];

function git(cwd: string, args: string[], cb: (err?: Error) => void) {
  const child = crossSpawn('git', args, { cwd, stdio: 'ignore' });
  child.on('error', cb);
  child.on('close', (code: number) => cb(code ? new Error(`git ${args.join(' ')} exited ${code}`) : undefined));
}

// npm 11 needs a current Node; this suite runs once on current Node, outside the engine sweep
const describeCurrent = parseInt(process.versions.node.split('.')[0], 10) >= 20 ? describe : describe.skip;

describeCurrent('installPath with a running npm install', () => {
  const cwd = path.join(TMP, NAME);
  const manifest = `${JSON.stringify({ name: NAME, version: '0.0.0', main: 'src/index.js', dependencies: { once: '1.4.0' } }, null, 2)}\n`;

  before((done) => {
    fs.rmSync(TMP, { recursive: true, force: true });
    fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
    fs.mkdirSync(path.join(cwd, 'test'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'package.json'), manifest);
    fs.writeFileSync(path.join(cwd, 'src', 'index.js'), 'module.exports = "local source";\n');
    fs.writeFileSync(path.join(cwd, 'test', 'index.test.js'), 'require("assert").equal(require("wrappy"), "local source");\n');
    git(cwd, ['init', '-q'], (err) => {
      if (err) return done(err);
      git(cwd, ['add', '.'], (err) => {
        if (err) return done(err);
        git(cwd, ['-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'fixture'], done);
      });
    });
  });

  after(() => {
    fs.rmSync(TMP, { recursive: true, force: true });
  });

  it('leaves the repository untouched when the link is made while npm installs', function (done) {
    this.timeout(120000);

    const target = installPath({ cwd });
    let linkError: Error | undefined;
    let linked = false;
    let linkDone: (() => void) | undefined;
    let linkFinished = false;
    let finished = false;

    const child = crossSpawn('npm', ['install', '--no-audit', '--no-fund'], { cwd, stdio: 'ignore' });
    child.on('error', (err: Error) => done(err));

    // the commands link while an install may be running: make the link as soon as npm creates node_modules
    (function wait() {
      if (finished || linked) return;
      if (!fs.existsSync(path.join(cwd, 'node_modules'))) return void setTimeout(wait, 2);
      linked = true;
      link(cwd, target, (err) => {
        linkError = err || undefined;
        linkFinished = true;
        if (linkDone) linkDone();
      });
    })();

    child.on('close', (code: number) => {
      finished = true;
      if (linked && !linkFinished) {
        linkDone = () => child.emit('close', code);
        return;
      }
      try {
        assert.equal(code, 0, 'npm install should succeed');
        assert.ok(linked, 'the link should have been made during the install');
        assert.ok(!linkError, `link should succeed: ${linkError && linkError.message}`);
        for (const entry of ['.git', 'src', 'test']) assert.ok(fs.existsSync(path.join(cwd, entry)), `${entry} should still exist`);
        assert.equal(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'), manifest, 'package.json should be unchanged');
        const foreign = fs.readdirSync(cwd).filter((name) => ROOT_ENTRIES.indexOf(name) < 0);
        assert.deepEqual(foreign, [], 'npm should not unpack into the repository root');
        assert.equal(fs.realpathSync(target), fs.realpathSync(cwd), 'the link should point at the repository root');
        done();
      } catch (err) {
        done(err as Error);
      }
    });
  });
});
