import './MessageText.scss';
import { useMemo, useState, useEffect } from 'react';
import { Chat } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Text, i18n } from 'react';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeAttr from 'rehype-attr';
import { ResponseFeedback } from '../ResponseFeedback';
import { useAssistant } from '../../Context';
import SupportTicketButton from '../SupportTicket/SupportTicketButton';
import { parseOutSalesForceMessage, parseOutQueryPrefix } from '../../utils/chat';
import rehypeRaw from 'rehype-raw';
import { addPendoIdToLinks } from '../../utils/pendo';
import { Chip, Icon, Text } from 'react';
import { display } from 'fast-foundation';

interface MessageTextProps {
  message?: string;
  fileName?: string;
  sender: Chat.MessageSender;
  messageObj: Chat.Message;
}

const isFileExpired = (messageObj: Chat.Message): boolean => {
  const currentTime = new Date().getTime();
  const sentTime = new Date(messageObj.sent_time).getTime();
  const timeDifference = currentTime - sentTime;
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return timeDifference > oneDayInMilliseconds;
};

/**
 * Component to render chat message text
 * @param message - The message text
 * @param sender - The sender of the message
 */
const MessageText = ({ message, sender, messageObj, fileName }: MessageTextProps): JSX.Element => {
  const { chatIdentifier } = useAssistant();
  const isSalesForceActive: boolean = false;
  const [isFeedbackResponse, setIsFeedbackResponse] = useState<boolean>(false);
  const [showCreateSupportTicketButton, setShowCreateSupportTicketButton] = useState<boolean>(false);
  const [file, extension] = useMemo(() => {
    const parts = fileName?.split('.') ?? [];
    return [parts.slice(0, -1).join('.'), parts[parts.length - 1]];
  }, [fileName]);
  const { t } = i18n.useTranslation('hermes');

  // some message parsing logic
  message = parseOutQueryPrefix(message ?? '');
  message = parseOutSalesForceMessage(message) ?? message;

  useEffect(() => {
    if (
      messageObj?.message?.includes('Feedback received successfully.') ||
      messageObj?.message?.startsWith('Sorry, something went wrong.')
    ) {
      setIsFeedbackResponse(true);
    }

    setShowCreateSupportTicketButton(
      (messageObj?.message?.includes('## open_ticket') && messageObj?.message?.includes('|Key | Value|')) ?? false
    );
  }, [messageObj]);

  let msgText = useMemo(() => message, [message]);
  msgText = addPendoIdToLinks(msgText);

  const isFileUpload = file && extension;

  return sender === 'ai' ? (
    <>
      {msgText && !isFileUpload && (
        <ReactMarkdown
          className="message-text"
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            [rehypeExternalLinks, { target: '_blank', rel: 'nofollow' }],
            [rehypeAttr, { properties: 'attr' }],
            [rehypeRaw],
          ]}
        >
          {msgText}
        </ReactMarkdown>
      )}
      {isFileUpload && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text appearance="body-strong-sm">{t('CHAT.FILE_ADDED')}</Text>

          {isFileExpired(messageObj) && (
            <Text color="var(---color-red-400)" appearance="body-default-sm">
              {t('CHAT.FILE_NO_LONGER_AVAILABLE')}
            </Text>
          )}
          <div>
            <Chip className="file-chip">
              {extension === '.pdf' ? (
                <Icon iconName="file-pdf" appearance="solid" color="var(---color-red-400)"></Icon>
              ) : (
                <Icon iconName="file-excel" appearance="solid" color="var(---color-red-400)"></Icon>
              )}
              <Text color="var(---color-brand-gray-400)" appearance="body-default-sm">
                {file}.{extension}
              </Text>
            </Chip>
          </div>
        </div>
      )}
      {!isSalesForceActive && showCreateSupportTicketButton && (
        <SupportTicketButton messageObj={messageObj}></SupportTicketButton>
      )}
      {chatIdentifier && !isFeedbackResponse && <ResponseFeedback messageObj={messageObj}></ResponseFeedback>}
    </>
  ) : (
    <Text style={{ width: '100%' }}>{msgText}</Text>
  );
};

export default MessageText;