// src/components/GradientButton.tsx
import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  startColor?: string;
  endColor?: string;
  style?: ViewStyle; // 👈 allow custom styles
}

export default function GradientButton({
  children,
  onPress,
  startColor = '#0D47A1', // default dark blue
  endColor = '#1976D2',   // default blue
  style,
}: GradientButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[{ borderRadius: 10 }, style]}>
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Text style={styles.text}>{children}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
