/* eslint-disable no-alert */
import { Alert, AlertButton, Platform } from 'react-native';

const buildMessage = (title: string, message?: string) => {
  if (!message) {
    return title;
  }
  if (!title) {
    return message;
  }
  return `${title}\n\n${message}`;
};

const invokeButton = (button?: AlertButton) => {
  if (!button) {
    return;
  }
  button.onPress?.();
};

export const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
  if (Platform.OS === 'web') {
    const text = buildMessage(title, message);
    const actions = buttons ?? [];

    if (actions.length === 0) {
      window.alert(text);
      return;
    }

    if (actions.length === 1) {
      window.alert(text);
      invokeButton(actions[0]);
      return;
    }

    if (actions.length === 2) {
      const confirmed = window.confirm(text);
      invokeButton(confirmed ? actions[0] : actions[1]);
      return;
    }

    console.warn('[showAlert] Web alerts support up to 2 buttons. Additional actions were ignored.');
    window.alert(text);
    invokeButton(actions[0]);
    return;
  }

  Alert.alert(title, message, buttons);
};

export default showAlert;
