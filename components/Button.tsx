import { StyleSheet, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

type ButtonProps = {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  disabled = false,
}: ButtonProps) {
  const getHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'large': return 56;
      default: return 46;
    }
  };

  if (variant === 'primary') {
    return (
      <Pressable 
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.buttonBase,
          { height: getHeight() },
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text style={[styles.text, textStyle]}>
          {title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.buttonBase,
        { height: getHeight() },
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[
        styles.text,
        variant === 'secondary' && styles.secondaryText,
        variant === 'outline' && styles.outlineText,
        textStyle
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(44, 24, 16, 0.1)',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});