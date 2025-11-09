// Learn more: https://docs.expo.dev/guides/environment-variables/
module.exports = {
  expo: {
    name: 'CareTrek',
    slug: 'caretrek',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    android: {
      package: 'com.humeshdeshmukh.caretrek',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF'
      }
    },
    ios: {
      bundleIdentifier: 'com.humeshdeshmukh.caretrek',
      buildNumber: '1.0.0'
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static'
          },
          android: {
            enableShrinkResourcesInReleaseBuild: false,
            enableProguardInReleaseBuild: false
          }
        }
      ],
      [
        "@react-native-firebase/app",
        {
          "disableAutoInit": true
        }
      ]
    ],
    extra: {
      // Add your Google Cloud Translation API key here
      // In production, use EAS secrets or a similar service
      // DO NOT commit your actual API key to version control
      GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY || '',
      eas: {
        projectId: 'a9d5cfd0-23cb-447a-a5dd-bc71a6711fd6'
      }
    },
  },
};
