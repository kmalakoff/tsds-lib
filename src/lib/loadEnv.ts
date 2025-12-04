import fs from 'fs';

export interface LoadEnvOptions {
  path?: string;
}

export interface LoadEnvResult {
  parsed?: Record<string, string>;
  error?: Error;
}

export default function loadEnv(options?: LoadEnvOptions): LoadEnvResult {
  const envPath = options?.path || '.env';

  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const parsed: Record<string, string> = {};

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line[0] === '#') continue;

      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;

      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();

      // Remove surrounding quotes if present
      if ((value[0] === '"' && value[value.length - 1] === '"') || (value[0] === "'" && value[value.length - 1] === "'")) {
        value = value.slice(1, -1);
      }

      parsed[key] = value;
      process.env[key] = value;
    }

    return { parsed: parsed };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
