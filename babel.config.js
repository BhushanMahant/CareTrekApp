// Simplified babel configuration for Firebase database only
module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            // Only include necessary Firebase modules
            '@react-native-firebase/app': './src/config/firebase',
            '@react-native-firebase/firestore': './src/config/firebase',
            'firebase': './src/config/firebase',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};