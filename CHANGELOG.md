# Changelog

## [1.23.0] - 2026-10-08

### Changed

- Removed the `loadEnv` export and its `LoadEnvOptions` and `LoadEnvResult` types. Callers that need environment-file loading must import `loadEnv` from `portable-env/node` and pass the file path directly, instead of an options object. This is a breaking API removal in this maintainer-selected minor release.
