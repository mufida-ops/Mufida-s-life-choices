/**
 * Design tokens for the "warm editorial minimalism" direction (build spec section 23).
 * Deliberately small: a personal journal feel, not a component-library color ramp.
 */

export const colors = {
  background: '#F7F2EA',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EAE0',
  border: '#E6DCCB',
  ink: '#2B2E3E',
  inkMuted: '#5B5A52',
  inkFaint: '#8C887D',
  navy: '#2F3450',
  gold: '#B98D3E',
  goldMuted: '#DDBE84',
  terracotta: '#B36B45',
  sage: '#748468',
  clay: '#A9764C',
  dustyBlue: '#5E7A8C',
  plum: '#7A5D6B',
  success: '#5E7D5E',
  danger: '#A24E3F',
  overlay: 'rgba(43, 46, 62, 0.4)',
} as const;

export const domainColors: Record<string, string> = {
  work: colors.dustyBlue,
  university: colors.navy,
  creative: colors.terracotta,
  home: colors.clay,
  spiritual: colors.plum,
  physical: colors.sage,
  personal: colors.gold,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const fontFamily = {
  display: 'Fraunces_500Medium',
  displaySemiBold: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const type = {
  greeting: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 32 },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, lineHeight: 28 },
  h2: { fontFamily: fontFamily.displaySemiBold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.bodyMedium, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 18 },
  smallMedium: { fontFamily: fontFamily.bodyMedium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#3A3323',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
