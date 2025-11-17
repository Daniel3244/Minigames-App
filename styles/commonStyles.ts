import { ViewStyle } from 'react-native';
import { colors, shadow } from './theme';

export const layout = {
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fill: {
    flex: 1,
  } as ViewStyle,
};

export const surfaces = {
  roundedCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  } as ViewStyle,
};
