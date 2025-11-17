import React from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';

type Props = {
  text: string;
  colors: LinearGradientProps['colors'];
  style?: StyleProp<TextStyle>;
  start?: LinearGradientProps['start'];
  end?: LinearGradientProps['end'];
};

export default function GradientText({ text, colors, style, start = { x: 0, y: 0 }, end = { x: 1, y: 0 } }: Props) {
  if (Platform.OS === 'web') {
    const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
    return (
      <Text
        style={[
          style,
          {
            backgroundImage: gradient,
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          } as TextStyle,
        ]}
      >
        {text}
      </Text>
    );
  }

  return (
    <MaskedView maskElement={<Text style={[style, styles.maskText]}>{text}</Text>}>
      <LinearGradient colors={colors} start={start} end={end}>
        <Text style={[style, styles.hiddenText]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  maskText: {
    backgroundColor: 'transparent',
  },
  hiddenText: {
    opacity: 0,
  },
});
