import { Alert, AlertProps, Text } from 'react';

export interface MessageAlertProps {
  message: string;
  severity: AlertProps['appearance'];
  title: string;
}

/** Component to display alerts within chat messages */
const MessageAlert = ({ message, severity, title }: MessageAlertProps): JSX.Element => (
  <Alert appearance={severity}>
    { title ? <Text appearance="body-strong-md">{title}</Text> : null }
    {message}
  </Alert>
);

export default MessageAlert;
