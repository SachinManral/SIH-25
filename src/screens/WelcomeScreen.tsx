// src/screens/WelcomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import GradientButton from '../components/GradientButton';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Upper image */}
      <Image
        source={require('../../assets/welcome.jpeg')}
        style={styles.upperImage}
      />

      <View style={styles.lowerSection}>
        <View style={styles.contentContainer}>
          {/* Logo overlapping upper image */}
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />

          <Text style={styles.title}>NagarNigrani</Text>
          <Text style={styles.subtitle}>
            Report civic issues in your neighbourhood{'\n'}
            <Text style={styles.subtitleEmphasis}>Quick • Easy • Transparent</Text>
          </Text>

          <View style={styles.buttonWrapper}>
            <GradientButton
              startColor="#0D47A1"
              endColor="#1976D2"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Login
            </GradientButton>

            <GradientButton
              startColor="#F57C00"
              endColor="#FB8C00"
              onPress={() => navigation.navigate('Signup')}
              style={styles.signupButton}
            >
              Create Account
            </GradientButton>
          </View>

          <Text style={styles.footer}>Built for citizens • Simple • Secure</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  upperImage: {
    width: width,
    height: height * 0.55,
    resizeMode: 'cover',
  },
  lowerSection: {
    position: 'absolute',
    bottom: -40, 
    width: width,
    height: height * 0.52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10, 
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#0D47A1',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginTop: -30,  // overlap upper image
    marginBottom: -30,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  subtitleEmphasis: {
    fontSize: 14,
    color: '#BBDEFB',
    fontWeight: '600',
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  loginButton: {
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  footer: {
    color: '#B3E5FC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});
