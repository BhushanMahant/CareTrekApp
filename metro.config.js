// Get the default Metro config for Expo projects
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default configuration
const config = getDefaultConfig(__dirname);

// List of Firebase modules to mock
const firebaseModules = [
  '@react-native-firebase/app',
  '@react-native-firebase/auth',
  '@react-native-firebase/firestore',
  '@react-native-firebase/storage',
  'react-native-firebase',
  'firebase',
];

// Create a resolver that points to our mock for Firebase modules
const { resolver } = config;
const { sourceExts } = resolver;

config.resolver = {
  ...resolver,
  sourceExts: [...sourceExts, 'mjs', 'cjs'],
  extraNodeModules: new Proxy(
    {},
    {
      get: (target, name) => {
        if (firebaseModules.includes(name)) {
          return path.join(__dirname, 'src/config/mockFirebase');
        }
        // Forward other modules to the default resolver
        return path.join(process.cwd(), `node_modules/${name}`);
      },
    }
  ),
};

// Ensure we're watching the mock directory
config.watchFolders = [
  ...new Set([
    ...(config.watchFolders || []),
    path.resolve(__dirname, './'),
    path.resolve(__dirname, './src/config'),
  ]),
];

// Disable minification for better debugging
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  compress: {
    ...config.transformer.minifierConfig?.compress,
    drop_console: false,
  },
};

module.exports = config;
