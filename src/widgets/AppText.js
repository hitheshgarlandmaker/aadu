import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { COLORS } from '../theme/theme';

/**
 * A wrapper around React Native's Text component that defaults to Noto Sans Tamil typography
 * and maps standard styles to the loaded Google Font weights.
 */
export function AppText({ style, children, ...props }) {
  const flattenedStyle = StyleSheet.flatten(style) || {};

  const isBold =
    flattenedStyle.fontWeight === 'bold' ||
    flattenedStyle.fontWeight === '700' ||
    flattenedStyle.fontWeight === '800' ||
    flattenedStyle.fontWeight === '900';

  const baseStyle = {
    fontFamily: isBold ? 'NotoSansTamil_700Bold' : 'NotoSansTamil_400Regular',
    color: COLORS.textPrimary,
    fontSize: 14,
  };

  return (
    <RNText style={[baseStyle, style]} {...props}>
      {children}
    </RNText>
  );
}
export default AppText;
