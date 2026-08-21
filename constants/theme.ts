/**
 * Design tokens — "warm editorial", soft pastel direction: dusty, lightly-desaturated hues
 * (blush, sage, powder blue, lavender, honey) rather than jewel tones. Each life domain still
 * gets a distinct, consistent color (tinted card backgrounds, filled tags, accent stripes), and
 * hero moments (Home, onboarding) use a gentle pastel gradient — gentle enough to feel calm,
 * saturated enough to still read as color rather than washed-out neutrals.
 */

export const colors = {
  background: '#FBF6EE',
  surface: '#FFFFFF',
  surfaceMuted: '#F6EFE3',
  border: '#EDE1D0',
  ink: '#463F4C',
  inkMuted: '#7A7284',
  inkFaint: '#A79FB0',
  navy: '#6B7BA0',
  gold: '#D2A75A',
  goldMuted: '#F3DFAE',
  terracotta: '#CC7A5C',
  sage: '#5E8F62',
  clay: '#BF8A5E',
  dustyBlue: '#5D89A3',
  plum: '#A56B96',
  indigo: '#7C6CAE',
  success: '#5E8F62',
  danger: '#C06B5C',
  overlay: 'rgba(70, 63, 76, 0.4)',
} as const;

/** Dusty pastel per-domain hue — used for tag text, icons, accent stripes. Kept deep enough
 * to stay legible as text on white/tint backgrounds while still reading as soft, not jewel-toned. */
export const domainColors: Record<string, string> = {
  work: colors.dustyBlue,
  university: colors.indigo,
  creative: colors.terracotta,
  home: colors.clay,
  spiritual: colors.plum,
  physical: colors.sage,
  personal: colors.gold,
};

/** Very light pastel wash of the same hue — for filled tags and card backgrounds. */
export const domainTints: Record<string, string> = {
  work: '#E4EFF4',
  university: '#EDE9F5',
  creative: '#FBE8DE',
  home: '#F6E8D6',
  spiritual: '#F5E4EF',
  physical: '#E6F1E5',
  personal: '#F6EAD0',
};

/** Soft pastel gradient for hero moments (Home header, onboarding) — dusty blue to lavender to peach. */
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
  reflection: { fontFamily: fontFamily.displayItalic, fontSize: 14, lineHeight: 20 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#3A2A23',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
} as const;
