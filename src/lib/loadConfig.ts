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
  const hasTsdsSource = hasTsdsSection && pkg.tsds.source && typeof pkg.tsds.source === 'string';

  // .tsdsrc.json is exclusive - cannot coexist with package.json config
  if (hasRcFile && (hasTsdsSection || hasTopLevelSource)) {
    const pkgSources = [hasTsdsSection && 'package.json "tsds" section', hasTopLevelSource && 'package.json "source" field'].filter(Boolean);
    throw new Error(`Conflicting tsds configuration: found .tsdsrc.json and ${pkgSources.join(' and ')}. Use only one configuration method.`);
  }

  // Error if source is defined in both top-level and inside tsds section
  if (hasTopLevelSource && hasTsdsSource) {
    throw new Error('Conflicting tsds configuration: found "source" in both package.json top-level and "tsds" section. Use only one.');
  }

  // Return .tsdsrc.json config if present
  if (hasRcFile) return rcConfig;

  // Merge top-level source with tsds section
  if (hasTsdsSection || hasTopLevelSource) {
    return {
      ...(hasTsdsSection ? pkg.tsds : {}),
      ...(hasTopLevelSource ? { source: pkg.source } : {}),
    };
  }

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
