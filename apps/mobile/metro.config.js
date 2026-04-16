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

// 3. Use hoisted modules over project-local when both exist
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
