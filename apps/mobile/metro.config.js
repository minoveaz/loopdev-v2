const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = path.resolve(__dirname, "../..");
const config = getDefaultConfig(__dirname);

config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(projectRoot, "node_modules"),
];
module.exports = config;
