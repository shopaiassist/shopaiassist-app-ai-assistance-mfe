import './ResponseFeedback.scss';
import { Chat } from 'react';
import { useState, useRef, useEffect } from 'react';
import { i18n } from 'react';
import { LOG } from '../services/LoggingService';
import { Button, Icon, Textarea, ProgressRing } from 'react';
import { TextAreaInstance } from 'core-components';
import { useChatMessages } from '../hooks/useChatMessages';
import { useAssistant } from '../Context';
import { useResponseFeedback } from '../store/responseFeedback';
import { parseOutQueryPrefix, parseMessages } from '../utils/chat';
import { IFeedbackPayload } from '../utils/interfaces';
import { createPendoFeedbackEvent } from '../utils/pendo';
import { useChat } from '../store';
import ChatApi from '../utils/chatApi';

interface ResponseFeedbackProps {
  messageObj: Chat.Message;
}

export const CHAT_MESSAGE_MAX_LENGTH = 500;

export const ResponseFeedback = ({ messageObj }: ResponseFeedbackProps) => {
  const { t } = i18n.useTranslation('hermes');
  const [isChosen, setIsChosen] = useState<boolean | undefined>(undefined);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commentValue, setCommentValue] = useState<string>('');
  const { chatIdentifier, trackPendo } = useAssistant();
  const { setIsSubmitted } = useResponseFeedback();
  const { filteredMessages } = useChatMessages(chatIdentifier ?? '');
  const unfilteredMessages = useChat((state) => state.messages[chatIdentifier ?? ''] || []);
  const sessionObj = JSON.parse(sessionStorage.getItem('shopaiassist-data') ?? '{}');

  const textAreaEl = useRef<TextAreaInstance>(null);

  useEffect(() => {
    setIsClosed(false);
  }, [messageObj]);

  const upDownClick = (upDown: string) => {
    if (upDown === 'like') {
      setIsChosen(true);
    } else {
      setIsChosen(false);
    }
  };

  const cancelFeedback = () => {
    setIsChosen(undefined);
  };

  const prepareSubmission = async () => {
    setIsLoading(true);
    trackPendo?.(
      createPendoFeedbackEvent({
        isConversationFeedback: false,
        feedbackComment: commentValue,
        conversationId: chatIdentifier,
        feedbackResult: isChosen ? 'positive' : 'negative',
        conversationEntryId: unfilteredMessages.at(-1)?.id,
      })
    );
    // grab the previous message (user_query) 'id' and 'message' parameters when the sender is 'user' to include with feedback.
    const getPreviousUserMessageId = (
      messages: Chat.Message[],
      currentMessageId: string,
      getParameter: 'id' | 'message'
    ): string | undefined => {
      const currentIndex = messages.findIndex((msg) => msg.id === currentMessageId);
      if (currentIndex > 0) {
        const prevMsg = messages[currentIndex - 1] as Chat.Message;
        if (getParameter in prevMsg && typeof prevMsg[getParameter] === 'string' && prevMsg.sender === 'user') {
          return prevMsg[getParameter] as string;
        }
      }
      return undefined;
    }
    // grab the previous message (user_query) to include with feedback.
    let userQuery = getPreviousUserMessageId(filteredMessages, messageObj.id, 'message');
    let userQueryId = getPreviousUserMessageId(filteredMessages, messageObj.id, 'id');
    if (userQuery) {
      userQuery = parseOutQueryPrefix(userQuery).trim();
    }

    const feedbackPayload: IFeedbackPayload = {
      feedback_symbol: isChosen ? 'positive' : 'negative',
      chat_id: chatIdentifier,
      user_query: userQuery,
      ai_message: messageObj.message,
      tenant_id: sessionObj.tenantId,
      comments: commentValue,
      bot_resp_id: messageObj.id,
      user_query_id: userQueryId,
    };

    try {
      const feedbackResponse = await ChatApi.submitFeedback(feedbackPayload);

      if (feedbackResponse.status === 200) {
        setIsSubmitted(true);
        setIsChosen(undefined);
        setIsClosed(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      LOG.error(`Error sending initial message: ${error}`);
      setIsLoading(false);
    }

    if (textAreaEl.current) {
      setCommentValue('');
      textAreaEl.current.value = '';
    }
  };

  const prepareChatMessages = () => {
    const text: string | undefined = filteredMessages
      .map((msg) => {
        const sent_datetime = new Date(msg.sent_time);
        let message: string = `${msg.sender.toUpperCase()}: ${sent_datetime.toUTCString()} - ${parseMessages(msg.message)}\n`;
        message += '-'.repeat(100) + '\n';

        return message;
      })
      .join('\n');

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'chat-history.txt';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <>
      {!isClosed ? (
        <div className="feedback">
          <span>{t('FEEDBACK_PROMPT.HELPFUL_ANSWER')}</span>
          <div className="choice">
            <Button
              density="extra-compact"
              data-testid="thumbs-up-button"
              appearance={isChosen ? 'primary' : 'secondary'}
              aria-pressed={isChosen !== undefined && isChosen}
              aria-label={t('FEEDBACK_PROMPT.LIKE')}
              disabled={isLoading}
              onClick={() => upDownClick('like')}
            >
              <Icon icon-name="thumbs-up" appearance="light" presentation></Icon>
            </Button>
            <Button
              density="extra-compact"
              data-testid="thumbs-down-button"
              appearance={isChosen === false ? 'primary' : 'secondary'}
              aria-pressed={isChosen !== undefined && !isChosen}
              aria-label={t('FEEDBACK_PROMPT.DISLIKE')}
              disabled={isLoading}
              onClick={() => upDownClick('dislike')}
            >
              <Icon icon-name="thumbs-down" appearance="light" presentation></Icon>
            </Button>
          </div>
        </div>
      ) : (
        <div className="thank-you-message">{t('FEEDBACK_PROMPT.THANK_YOU')}</div>
      )}
      {isChosen !== undefined && (
        <>
          <div className="feedback-comment">
            <h2>{t('FEEDBACK_PROMPT.HEADER')}</h2>
            <Textarea
              ref={textAreaEl}
              className="comment_textarea"
              maxlength={CHAT_MESSAGE_MAX_LENGTH}
              rows={4}
              show-remaining-text={true}
              disabled={isLoading}
              onInput={(evt) => setCommentValue(evt.currentTarget.currentValue)}
              label={t('FEEDBACK_PROMPT.COMMENTS')}
            ></Textarea>
          </div>
          <div className="feedback-controls">
            <Button
              className="download-transcript"
              appearance="tertiary"
              data-testid="download-transcript-button"
              onClick={() => prepareChatMessages()}
            >
              {t('FEEDBACK_PROMPT.DOWNLOAD_TRANSCRIPT')}
              <Icon icon-name="download" slot="end" appearance="light" presentation></Icon>
            </Button>
            <div className="controls">
              <Button
                appearance="secondary"
                density="compact"
                data-testid="cancel-feedback-button"
                onClick={() => cancelFeedback()}
              >
                {t('FEEDBACK_PROMPT.CANCEL')}
              </Button>
              <Button
                appearance="primary"
                density="compact"
                data-testid="send-feedback-button"
                disabled={isLoading}
                onClick={() => prepareSubmission()}
              >
                {t('FEEDBACK_PROMPT.SEND')}
                {isLoading && (
                  <ProgressRing className="loading-icon" slot="start" indeterminate={true} progressSize="small" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
