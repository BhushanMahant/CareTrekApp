import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../contexts/theme/ThemeContext';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const pulseAnim = new Animated.Value(1);
  const { width } = Dimensions.get('window');
  const logoSize = width * 0.7;

  useEffect(() => {
    // Fade in and scale up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 30,
        useNativeDriver: true,
      })
    ]).start();

    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Navigate to Onboarding after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, pulseAnim]);

  const bgColor = isDark ? '#171923' : '#FFFBEF';
  const textColor = isDark ? '#E2E8F0' : '#2D3748';
  const accentColor = isDark ? '#48BB78' : '#2F855A';
  const mutedColor = isDark ? '#718096' : '#A0AEC0';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Animated.View 
        style={[
          styles.logoContainer,
          { 
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ]
          }
        ]}
      >
        <Svg width={logoSize} height={logoSize} viewBox="0 0 300 300">
          {/* Background Circle with Gradient */}
          <Circle 
            cx="150" 
            cy="150" 
            r="130" 
            fill={accentColor} 
            opacity={isDark ? 0.9 : 0.95}
          />
          
          {/* Inner Circle */}
          <Circle 
            cx="150" 
            cy="130" 
            r="80" 
            fill="white" 
            fillOpacity={isDark ? 0.2 : 0.9} 
          />
          
          {/* Abstract People Silhouette */}
          <G fill={isDark ? '#E2E8F0' : '#2F855A'}>
            <Path d="M150 90C167.673 90 182 75.6731 182 58C182 40.3269 167.673 26 150 26C132.327 26 118 40.3269 118 58C118 75.6731 132.327 90 150 90Z" />
            <Path d="M182 110H118C105.85 110 96 119.85 96 132V150C96 162.15 105.85 172 118 172H182C194.15 172 204 162.15 204 150V132C204 119.85 194.15 110 182 110Z" />
          </G>
          
          {/* Heart Pulse Effect */}
          <Path 
            d="M150 220C160 210 180 190 190 170C200 150 190 130 170 120C160 115 150 120 145 125C140 120 130 115 120 120C100 130 90 150 100 170C110 190 130 210 140 220" 
            fill="none" 
            stroke="white" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <Animate 
              attributeName="opacity" 
              values="0.7;1;0.7" 
              dur="2s" 
              repeatCount="indefinite" 
            />
          </Path>
        </Svg>
        
        <Animated.Text style={[
          styles.appName,
          { 
            opacity: fadeAnim,
            color: textColor,
            marginTop: 20,
          }
        ]}>
          <Text style={{ fontFamily: 'Inter_300Light' }}>CARE</Text>
          <Text style={{ fontFamily: 'Inter_700Bold' }}>TREK</Text>
        </Animated.Text>
        
        <Animated.Text style={[
          styles.tagline,
          { 
            opacity: fadeAnim,
            color: mutedColor,
          }
        ]}>
          Bridging Generations
        </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  appName: {
    fontSize: 36,
    marginTop: 30,
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Inter_300Light',
  },
});

export default SplashScreen;
