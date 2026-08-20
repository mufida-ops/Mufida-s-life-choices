import { Text, type TextProps } from 'react-native';

import { colors, type } from '../../constants/theme';

type Variant = keyof typeof type;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({ variant = 'body', color = colors.ink, style, ...rest }: AppTextProps) {
  return <Text style={[type[variant], { color }, style]} {...rest} />;
}
