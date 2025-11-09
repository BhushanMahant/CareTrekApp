const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// List of Firebase modules to mock
const firebaseModules = [
  '@react-native-firebase/app',
  '@react-native-firebase/auth',
  '@react-native-firebase/firestore',
  '@react-native-firebase/storage',
  'react-native-firebase',
  'firebase',
];

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      ...defaultConfig.resolver.extraNodeModules,
      ...firebaseModules.reduce((acc, name) => ({
        ...acc,
        [name]: __dirname + '/src/config/mockFirebase',
      }), {}),
    },
  },
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  },
};
