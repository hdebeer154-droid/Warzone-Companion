/**
 * Warzone Companion colour system.
 *
 * Dark, premium, tactical — deliberately NOT a generic SaaS palette.
 * Base surfaces are near-black with cool steel undertones; the primary accent
 * is a warm tactical amber used sparingly for emphasis and progress.
 */
export const colors = {
  // Surfaces
  background: '#0A0C10',
  backgroundAlt: '#0E1117',
  surface: '#12151C',
  surfaceElevated: '#171B24',
  surfacePressed: '#1D2230',
  overlay: 'rgba(6, 8, 12, 0.72)',

  // Lines
  border: '#222834',
  borderStrong: '#2E3646',
  divider: '#1A1F29',

  // Text
  text: '#E9EDF4',
  textSecondary: '#AEB6C6',
  textMuted: '#7C8598',
  textDim: '#565E6E',

  // Brand / accents
  primary: '#F2A33C', // tactical amber
  primaryDark: '#C67F1E',
  primarySoft: 'rgba(242, 163, 60, 0.14)',
  secondary: '#39D98A', // signal green
  secondarySoft: 'rgba(57, 217, 138, 0.14)',

  // Semantic
  success: '#39D98A',
  warning: '#F2C14E',
  danger: '#FF5C5C',
  info: '#4C9AFF',
  gold: '#E7B44B',
  platinum: '#B9C7D6',
  diamond: '#6FD3FF',

  // Rarity / camo tiers
  tierMilitary: '#8A93A6',
  tierSpecial: '#4C9AFF',
  tierGold: '#E7B44B',
  tierPlatinum: '#B9C7D6',
  tierDiamond: '#6FD3FF',
  tierMastery: '#C77DFF',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
