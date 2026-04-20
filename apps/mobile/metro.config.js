// Monorepo-aware Metro config for Expo + pnpm workspaces.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo so @sabong/shared hot-reloads
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve modules from both the project and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Use hoisted modules over project-local when both exist, and follow
//    symlinks through pnpm's flat store to deduplicate module IDs.
//    Without enableSymlinks, Metro treats the symlinked path and the real
//    pnpm store path as two different modules — causing "main" to register
//    under one id while the runtime expects the other.
config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 4. Inject our SharedArrayBuffer shim at the very top of the bundle
//    (before any user module runs) by wrapping Expo's default getPolyfills.
//    Expo's getPolyfills takes `{ platform }` so we must preserve that
//    signature rather than replacing it outright.
const origGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (args) => {
  const base = origGetPolyfills ? origGetPolyfills(args) : [];
  return [...base, path.resolve(projectRoot, "polyfills.js")];
};

module.exports = config;
