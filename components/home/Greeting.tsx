import { colors } from '../../constants/theme';
import { AppText } from '../ui/AppText';

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Greeting({ name, color = colors.inkFaint }: { name: string; color?: string }) {
  const greeting = greetingForHour(new Date().getHours());
  return (
    <AppText variant="label" color={color}>
      {`${greeting.toUpperCase()}, ${name.toUpperCase()}`}
    </AppText>
  );
}
