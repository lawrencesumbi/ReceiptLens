import { Text as RNText, TextInput as RNTextInput, View as RNView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ThemeProps = {
  themeColorType?: 'background' | 'card';
};

export function View({ style, themeColorType = 'background', ...otherProps }: RNView['props'] & ThemeProps) {
  const { colors } = useTheme();
  
  // Decide if this specific View should act as a main background or a card/container background
  const backgroundColor = themeColorType === 'card' ? colors.card : colors.background;

  return <RNView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function Text({ style, ...otherProps }: RNText['props']) {
  const { colors } = useTheme();
  return <RNText style={[{ color: colors.text }, style]} {...otherProps} />;
}

export function TextInput({ style, ...otherProps }: RNTextInput['props']) {
  const { colors } = useTheme();
  return (
    <RNTextInput 
      style={[{ backgroundColor: colors.background, color: colors.text, borderColor: colors.border }, style]} 
      placeholderTextColor={colors.text + '80'} // Adds 50% opacity to your current text color for placeholders
      {...otherProps} 
    />
  );
}