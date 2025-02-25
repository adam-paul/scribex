import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, shadows } from '@/constants/colors';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
};

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'elevated' && styles.elevated,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.05)', // Very subtle border
  },
  elevated: {
    ...shadows.medium,
    borderWidth: 0,
  },
});