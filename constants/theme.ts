/**
 * Design tokens — "warm editorial", now with real color: each life domain gets a distinct,
 * saturated hue used consistently (tinted card backgrounds, filled tags, accent stripes), and
 * key hero moments (Home, onboarding) use a warm gradient. Still restrained where it counts —
 * no neon, no gradients on every surface — but noticeably richer than a pure neutral palette.
 */

export const colors = {
  background: '#FAF3E8',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EADA',
  border: '#E9DCC4',
  ink: '#2B2438',
  inkMuted: '#5B5468',
  inkFaint: '#8D8698',
  navy: '#332B5C',
  gold: '#D6A62E',
  goldMuted: '#EFCB6E',
  terracotta: '#DB6B3A',
  sage: '#2F8F5B',
  clay: '#C97F2B',
  dustyBlue: '#2E6E8E',
  plum: '#A6447A',
  indigo: '#5B3F94',
  success: '#2F8F5B',
  danger: '#C7452F',
  overlay: 'rgba(43, 36, 56, 0.45)',
} as const;

/** Bold, saturated per-domain hue — used for tag text, icons, accent stripes, chart-like bits. */
export const domainColors: Record<string, string> = {
  work: colors.dustyBlue,
  university: colors.indigo,
  creative: colors.terracotta,
  home: colors.clay,
  spiritual: colors.plum,
  physical: colors.sage,
  personal: colors.gold,
};

/** Soft tinted background of the same hue — for filled tags and card washes. */
export const domainTints: Record<string, string> = {
  work: '#DCEAF1',
  university: '#E6DFF4',
  creative: '#FBE1D2',
  home: '#F8E5C3',
  spiritual: '#F5DDEB',
  physical: '#DCF1E4',
  personal: '#F8ECC4',
};

/** Warm, jewel-toned gradient for hero moments (Home header, onboarding). */
export const heroGradient = [colors.navy, colors.plum, colors.terracotta] as const;
export const goldGradient = [colors.gold, colors.terracotta] as const;

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
    shadowColor: '#3A2A23',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
} as const;
