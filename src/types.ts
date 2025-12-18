import type { SpawnOptions } from 'cross-spawn-cb';

export interface Package extends JSON {
  name: string;
  private?: boolean;
  version?: string;
  scripts?: Record<string, string>;
  tsds?: Config;
  source?: string;
}

// FileConfig is the subset of Config that can be specified in files
// This allows future expansion where some options are runtime-only
export interface FileConfig {
  source?: string;
  targets?: string[];
  // Commands mapping: command name -> module name
  // Use null to disable a default command
  commands?: Record<string, string | null>;
  globals?: Record<string, string>;
}

export interface Config extends FileConfig {
  // Future: runtime-only options can be added here
}

export interface CommandOptions extends SpawnOptions {
  cwd?: string | URL;
  config?: Config;
  package?: Package;
  installPath?: string;
}

export type CommandCallback = (error?: Error) => void;
