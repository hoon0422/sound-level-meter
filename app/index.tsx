import { Redirect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function IndexRoute() {
  return <Redirect href="/db-freq" />;
}
