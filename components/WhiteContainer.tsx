import { StyleSheet, View, ViewStyle } from 'react-native';

interface WhiteContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function WhiteContainer({ children, style }: WhiteContainerProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#333333',
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
});
