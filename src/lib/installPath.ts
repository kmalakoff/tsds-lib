import fs from 'fs';
import path from 'path';

import { LINK_FOLDER } from '../constants.ts';
import type { CommandOptions } from '../types.ts';

export default function installPath(options: CommandOptions): string {
  if (options?.installPath) return options.installPath;
  const cwd: string = (options?.cwd as string) || process.cwd();
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  return path.join(cwd, LINK_FOLDER, 'node_modules', pkg.name);
}
