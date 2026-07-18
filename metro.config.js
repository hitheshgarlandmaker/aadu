const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions to resolve wa-sqlite.wasm
config.resolver.assetExts.push('wasm');

module.exports = config;
