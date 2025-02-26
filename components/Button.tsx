import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, View } from 'react-native';
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
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
};

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  disabled = false,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const getHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'large': return 56;
      default: return 46;
    }
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {icon && iconPosition === 'left' && <View style={styles.leftIconContainer}>{icon}</View>}
      <Text style={[
        styles.text,
        variant !== 'primary' && variant === 'secondary' && styles.secondaryText,
        variant !== 'primary' && variant === 'outline' && styles.outlineText,
        textStyle
      ]}>
        {title}
      </Text>
      {icon && iconPosition === 'right' && <View style={styles.rightIconContainer}>{icon}</View>}
    </View>
  );

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
        {renderContent()}
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
      {renderContent()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
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