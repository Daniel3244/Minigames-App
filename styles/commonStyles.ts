import { ViewStyle } from 'react-native';
import { shadow } from './theme';

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
    ...shadow,
  } as ViewStyle,
};
