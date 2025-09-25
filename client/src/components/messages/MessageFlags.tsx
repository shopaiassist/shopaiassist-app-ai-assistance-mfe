import { Chat } from 'react';
import { EmptyFragment } from 'react';
import MessageAlert, { MessageAlertProps } from './MessageAlert';

interface MessageFlagsProps {
  flags: (Chat.MessageFlag | Chat.SystemFlag)[];
}

const msgAlertProps = (data?: string[]): MessageAlertProps => {
  const [title = '', message = '', severity] = data || [];
  return { message, severity: severity as MessageAlertProps['severity'], title };
};

/** Component to render `MessageFlag` contents for messages */
const MessageFlags = ({ flags }: MessageFlagsProps): JSX.Element => (
  <EmptyFragment empty={!flags.length}>
    {flags.map(({ name, option_copies }, idx) => (
      <EmptyFragment key={`${name}-${idx}`} empty={!['InChatDrafting', 'ReferenceSkillOutput'].includes(name)}>
        <MessageAlert {...msgAlertProps(option_copies)} />
      </EmptyFragment>
    ))}
  </EmptyFragment>
);

export default MessageFlags;
