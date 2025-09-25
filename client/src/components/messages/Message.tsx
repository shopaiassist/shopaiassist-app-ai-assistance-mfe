import { useMemo } from 'react';
import { LOG } from '../../services/LoggingService';
import { format, isSameDay } from 'date-fns';
import { useAssistant, useAssistantContent, useMfeContext } from '../../Context';
import useMFECommunication from '../../hooks/useMFECommunication';
import { useChatMessages } from '../../hooks/useChatMessages';
import { usePrevious } from '../../hooks/react';
import { useChat, useUser } from '../../store';
import { getFlags, cleanChatMessage } from '../../utils/chat';
import { i18n } from 'i18n';

import MessageCollection from './MessageCollection';
import MessageFiles from './MessageFiles';
import MessageFlags from './MessageFlags';
import MessageText from './MessageText';

interface MessageProps extends MessageBoxProps {
  isLast?: boolean;
  message: Chat.Message;
}

interface SalesForceResponse {
  salesforce_ticket_code: string;
  salesforce_ticket_id: string;
}

const adornMessage = (msg: Chat.Message, newMsg: Chat.Message) => ({
  initialRequest: msg.message_type === 'text' && newMsg.message_type === 'request',
});

const chatTimestamp = (dateTime: string): string =>
  dateTime === 'sending'
    ? 'Sending...'
    : format(new Date(dateTime), `${isSameDay(new Date(dateTime), new Date()) ? '' : 'MMM d '}h:mm a`);

/**
 * Component to render a single chat message
 *
 * @param hideAvatar - Whether to hide the avatar
 * @param isLast - Whether this is the last message in the list
 * @param message - The message to render
 * @param ...props - Additional `BoxProps`
 */
const Message = ({ children, isLast, message, hideAvatar, ...props }: MessageProps): JSX.Element => {
  const { messages } = useAssistantContent();
  const { chatIdentifier } = useAssistant();
  const { message_type, sender, sent_time } = message;
  const prevMessage = usePrevious(message);
  const { cancelFlow, cancelRequest, executeRequest, streaming } = useChat();
  const [sendEvent] = useMFECommunication('chat_transcript');
  const { t } = i18n.useTranslation('hermes');
  //const user = useUser((state) => state.data);
  const { user } = useMfeContext();
  const isAi = sender === 'ai';
  const flags = getFlags(message);
  const msgText = useMemo(() => (message.message_type === 'text' ? message.message : ''), [message]);
  let uploadedFileName: string | undefined = undefined;
  const isSkillListMessage =
    message_type === 'text' &&
    !!(message as AiTextMessage).system_flags?.length &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(message as AiTextMessage).system_flags?.every((flag) => !!(flag as any)?.flow_type);
  const { filteredMessages } = useChatMessages(chatIdentifier ?? '');

  let component: JSX.Element = <></>;
  let parsedMessage: string = '';

  switch (message_type) {
    case 'allsearch_collection':
      component = <MessageCollection dbId={message.collection_id} name={message.collection_name} />;
      break;
    case 'files':
      component = <MessageFiles files={message.files!} />;
      break;
    case 'flow':
    case 'request':
      component = messages?.skill(message, {
        cancelFlow,
        cancelRequest,
        executeRequest,
        ...adornMessage(prevMessage ?? message, message),
      }) as JSX.Element;
      break;
    case 'text': {
      if (isAi) {
        console.log('RAW AI response:', msgText);
      }

      // tell all the MFEs about the current chat transcript
      sendEvent({ message: 'chat_transcript', body: { filteredMessages } });

      // parsing out unwanted text
      parsedMessage = cleanChatMessage(msgText);

      const [, fileName] = parsedMessage.match(/\{\d+ files? added: (.*)\}/) ?? [];

      if (fileName) {
        uploadedFileName = fileName;
        console.log('Parsed message with file addition:', parsedMessage, uploadedFileName);
      }

      if (parsedMessage.includes('/?!#$(&^feedback:')) {
        parsedMessage = t('FEEDBACK_PROMPT.SENDING_FEEDBACK');
      }

      if (parsedMessage.startsWith('/?!#$(&^ticket:')) {
        parsedMessage = t('SUPPORT_TICKET.SENDING_TICKET_INFORMATION');
      }

      if (parsedMessage.includes('salesforce_ticket_code')) {
        parsedMessage = parsedMessage.substring(parsedMessage.indexOf('salesforce_ticket_code'));

        const salesForceTicket: SalesForceResponse = { salesforce_ticket_code: '', salesforce_ticket_id: '' };
        const responseArr: Array<string> = parsedMessage.split('|');

        responseArr.forEach((item: string, idx: number) => {
          if (item === '\n' || item === '') {
            responseArr.splice(idx, 1);
          }
        });

        responseArr.forEach((item: string, idx: number) => {
          if (item.trim() === 'salesforce_ticket_code') {
            salesForceTicket.salesforce_ticket_code = responseArr[idx + 1];
          }

          if (item.trim() === 'salesforce_ticket_id') {
            salesForceTicket.salesforce_ticket_id = responseArr[idx + 1];
          }
        });

        parsedMessage = `${t('SUPPORT_TICKET.TICKET_SUBMITTED')} ${salesForceTicket.salesforce_ticket_id}.
        ${t('SUPPORT_TICKET.SUPPORT_ASSISTANT_WILL_CONTACT')}`;
      }

      component = !isSkillListMessage ? (
        <MessageText message={parsedMessage} sender={sender} messageObj={message} fileName={uploadedFileName} />
      ) : (
        (messages?.skill(message as AiTextMessage, {
          cancelFlow,
          cancelRequest,
          executeRequest,
          ...adornMessage(prevMessage ?? message, message),
        }) as JSX.Element)
      );

      break;
    }
  }

  return (
    <MessageBox
      appearance={isAi ? 'agent' : 'user'}
      aria-label={`${sender || 'ai'}: ${sent_time}`}
      hideAvatar={hideAvatar}
    >
      <div slot="start">
        {!isAi ? (
          <Icon
            id="shield-check-icon"
            aria-hidden="true"
            iconName="user-circle"
            appearance="solid"
            size={22}
            sizeUnit="px"
          />
        ) : (
          <svg
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xlinkHref="http://www.w3.org/1999/xlink"
          >
            <rect
              x="0.5"
              y="1.21753"
              width="23"
              height="23"
              rx="11.5"
              fill="url(#pattern)"
              stroke="#E6E6E6"
            />
            <defs>
              <pattern id="pattern" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlinkHref="#image" transform="translate(0.0580707 0.0580707) scale(0.0245516)" />
              </pattern>
              <image
                id="image"
                width="36"
                height="36"
              />
            </defs>
          </svg>
        )}
      </div>
      <Metadata slot="metadata">
        <MetadataItem>{`${isAi ? 'shopaiassist' : user?.firstName || 'User'}\u00a0`}</MetadataItem>
        <MetadataItem>
          <time>{chatTimestamp(sent_time)}</time>
        </MetadataItem>
      </Metadata>
      <MessageFlags flags={flags.message} />
      {component}
      {children}
    </MessageBox>
  );
};

export default Message;
