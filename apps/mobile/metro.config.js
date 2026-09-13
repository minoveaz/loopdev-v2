const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = path.resolve(__dirname, "../..");
const config = getDefaultConfig(__dirname);

config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRoot, "node_modules"),
];
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const sourceModule = path.resolve(projectRoot, "src", moduleName.slice(2));
    return (defaultResolveRequest ?? context.resolveRequest)(context, sourceModule, platform);
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
