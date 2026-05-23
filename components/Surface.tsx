import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface SurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Surface({ children, style }: SurfaceProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
});
