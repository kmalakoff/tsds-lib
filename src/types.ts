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
  commands?: JSON;
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

export type CommandCallback = (error?: Error) => undefined;

export type Wrapper = (version: string, ...args: unknown[]) => undefined;
export type WrapperCallback = (error?: Error, result?: unknown) => undefined;
