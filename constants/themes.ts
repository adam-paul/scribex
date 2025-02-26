import { ImageSourcePropType } from 'react-native';
import { colors } from './colors';

export type SeasonalTheme = {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundImage: ImageSourcePropType;
  iconSet: 'default' | 'winter' | 'spring' | 'summer' | 'autumn';
  availableFrom: Date;
  availableTo: Date;
};

// Current themes are based on the PRD's aesthetic guidelines
// Synthwave + Cyberpunk + Botanical Futurism
export const SEASONAL_THEMES: SeasonalTheme[] = [
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: 'Retro-futuristic aesthetic with neon colors and grid landscapes',
    primaryColor: colors.primary, // Use existing color palette as base
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    textColor: colors.text,
    backgroundImage: require('@/assets/images/splash-icon.png'), // Use existing icon as placeholder
    iconSet: 'default',
    availableFrom: new Date(2024, 0, 1), // Jan 1
    availableTo: new Date(2024, 3, 1),   // Apr 1
  },
  {
    id: 'cyber-nature',
    name: 'Cyber Nature',
    description: 'Digital landscapes with organic elements and glowing plant life',
    primaryColor: colors.secondary,
    secondaryColor: colors.accent,
    accentColor: colors.primary,
    textColor: colors.text,
    backgroundImage: require('@/assets/images/splash-icon.png'), // Use existing icon as placeholder
    iconSet: 'spring',
    availableFrom: new Date(2024, 3, 1), // Apr 1
    availableTo: new Date(2024, 6, 1),   // Jul 1
  },
  {
    id: 'neon-jungle',
    name: 'Neon Jungle',
    description: 'Lush digital jungle with vibrant, glowing elements',
    primaryColor: colors.accent,
    secondaryColor: colors.primary,
    accentColor: colors.secondary,
    textColor: colors.text,
    backgroundImage: require('@/assets/images/splash-icon.png'), // Use existing icon as placeholder
    iconSet: 'summer',
    availableFrom: new Date(2024, 6, 1), // Jul 1
    availableTo: new Date(2024, 9, 1),   // Oct 1
  },
  {
    id: 'tech-horizon',
    name: 'Tech Horizon',
    description: 'Cool-toned futuristic landscape with digital elements',
    primaryColor: colors.error,
    secondaryColor: colors.success,
    accentColor: colors.warning,
    textColor: colors.text,
    backgroundImage: require('@/assets/images/splash-icon.png'), // Use existing icon as placeholder
    iconSet: 'autumn',
    availableFrom: new Date(2024, 9, 1),  // Oct 1
    availableTo: new Date(2025, 0, 1),    // Jan 1
  }
];

export function getCurrentTheme(): SeasonalTheme {
  const now = new Date();
  const currentTheme = SEASONAL_THEMES.find(theme => 
    now >= theme.availableFrom && now < theme.availableTo
  );
  
  // Return default theme if no seasonal theme is currently active
  return currentTheme || SEASONAL_THEMES[0];
}