export const COLORS = {
  primary: '#2E7D32',       // Forest Green
  primaryLight: '#C8E6C9',  // Light Mint Green for accents/borders
  primaryDark: '#1B5E20',   // Deep Forest Green
  secondary: '#81C784',     // Soft Leaf Green
  background: '#F1F8E9',    // Pale Greenish Background (soft on the eyes)
  surface: '#FFFFFF',       // Clean White for cards/containers
  textPrimary: '#212121',   // Charcoal dark text
  textSecondary: '#616161', // Muted dark text
  textLight: '#9E9E9E',     // Light grey text
  textOnPrimary: '#FFFFFF', // White text on green backgrounds
  border: '#E8F5E9',        // Soft border lines
  success: '#388E3C',       // Green status/indicators
  warning: '#FBC02D',       // Yellow warning indicators
  danger: '#D32F2F',        // Red deceased/critical indicators
  info: '#1976D2',          // Blue highlights
};

export const FONTS = {
  regular: 'NotoSansTamil_400Regular',
  bold: 'NotoSansTamil_700Bold',
};

export const TYPOGRAPHY = {
  h1: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primaryDark,
    fontWeight: 'bold',
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  h3: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  bodyBold: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  button: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textOnPrimary,
    fontWeight: 'bold',
  },
};

export const NavigationTheme = {
  dark: false,
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.primaryLight,
    notification: COLORS.danger,
  },
};
