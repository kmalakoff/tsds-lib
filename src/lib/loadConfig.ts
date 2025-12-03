import fs from 'fs';
import path from 'path';

import type { CommandOptions, Config, FileConfig, Package } from '../types.ts';

const CONFIG_FILE_NAME = '.tsdsrc.json';

export function loadFileConfig(cwd: string): FileConfig | null {
  const packageJsonPath = path.join(cwd, 'package.json');
  const rcPath = path.join(cwd, CONFIG_FILE_NAME);

  let pkg: Package | null = null;
  let hasRcFile = false;
  let rcConfig: FileConfig | null = null;

  // Check for .tsdsrc.json
  if (fs.existsSync(rcPath)) {
    try {
      const content = fs.readFileSync(rcPath, 'utf8');
      rcConfig = JSON.parse(content) as FileConfig;
      hasRcFile = true;
    } catch {
      // Invalid JSON - treat as non-existent
    }
  }

  // Read package.json
  if (fs.existsSync(packageJsonPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Package;
    } catch {
      // Invalid package.json
    }
  }

  const hasTsdsSection = pkg?.tsds && typeof pkg.tsds === 'object';
  const hasTopLevelSource = pkg?.source && typeof pkg.source === 'string';

  // Count config sources
  const sources: string[] = [];
  if (hasRcFile) sources.push('.tsdsrc.json');
  if (hasTsdsSection) sources.push('package.json "tsds" section');
  if (hasTopLevelSource) sources.push('package.json "source" field');

  // Error if multiple sources
  if (sources.length > 1) {
    throw new Error(`Conflicting tsds configuration: found ${sources.join(' and ')}. Use only one configuration method.`);
  }

  // Return the single source (if any)
  if (hasRcFile) return rcConfig;
  if (hasTsdsSection) return pkg.tsds;
  if (hasTopLevelSource) return { source: pkg.source };

  return null;
}

export default function loadConfig(options: CommandOptions = {}): Config {
  // 1. Return pre-provided config if available (highest priority)
  if (options.config) return options.config;

  // 2. Load from file sources
  const cwd: string = (options.cwd as string) || process.cwd();
  const config = loadFileConfig(cwd);

  // Cache in options for subsequent calls
  options.config = config;
  return config;
}
