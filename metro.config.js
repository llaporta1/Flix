const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

module.exports = {
    resolver: {
      useWatchman: false,
    },
  };
  
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
