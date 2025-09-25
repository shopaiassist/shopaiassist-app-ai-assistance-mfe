/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chat, DatabaseInfo, FileHandle } from 'react';
import { i18n } from 'react';
import {
  Anchor,
  Button,
  Chip,
  Icon,
  ProgressRing,
  Text,
  Textarea,
} from 'react';
import type { ButtonInstance, TextAreaInstance } from 'core-components';
import { useAssistant } from '../Context';
import { LOG } from '../services/LoggingService';
import { useChat } from '../store';
import { CHAT_MESSAGE_BULK_FILE_CUTOFF, CHAT_MESSAGE_MAX_LENGTH } from '../utils/chat';
import useMFECommunication from '../hooks/useMFECommunication';
import './ChatInput.scss';
import { cleanChatMessage, parseMessages } from '../utils/chat';
import ChatApi from '../utils/chatApi';

interface ChatInputProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string;
}

type ClickOrKey = 'click' | 'key';

const ChatInput = ({ placeholder, ...props }: ChatInputProps): JSX.Element => {
  const [sendEvent] = useMFECommunication('isChatting');
  const { chatIdentifier, createNewChat } = useAssistant();
  const { isBusy, sendMessageUsingActiveChat, setActiveChatId, fetchMessages, createChat, messages, activeChatId } =
    useChat();
  const { t } = i18n.useTranslation('hermes');
  const textAreaEl = useRef<TextAreaInstance>(null);
  const [value, setValue] = useState<string>('');
  const [isTimerOneMinDisabled, setIsTimerOneMinDisabled] = useState<boolean>(false);
  const currentProduct = sessionStorage.getItem('current-product');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHandle, setFileHandle] = useState<FileHandle | null>(null);
  const [isFileUploading, setIsFileUploading] = useState<boolean>(false);

  const wasTheDocumentUploaded = useMemo(
    () => messages[activeChatId ?? '']?.some((message) => message.message?.match(/\{1 file added: /)),
    [messages, activeChatId]
  );

  // @ts-ignore
  const activeFileId = useMemo(
    () => messages[activeChatId ?? '']?.find(({ document_id }) => document_id && document_id !== 'None')?.document_id,
    [messages, activeChatId]
  );

  console.log(messages, activeChatId, wasTheDocumentUploaded);

  useEffect(() => {
    setActiveChatId(chatIdentifier);
  }, [chatIdentifier]);

  /**
   * Function to handle key presses
   *
   * Shift + Enter is handled natively by the browser
   * @param evt - the key press event
   */
  const handleKeyDown = (evt: React.KeyboardEvent<TextAreaInstance>) => {
    // When enter is pressed without the shift key:
    if (evt.key === 'Enter' && !evt.shiftKey) {
      evt.preventDefault();
      if (value.trim() === '' || isBusy()) {
        // If the value is empty or only whitespace, or in a loading state, do nothing.
        return;
      } else {
        // Otherwise submit the chat
        evt.stopPropagation();
        sendTextMessage('key');
      }
    }
  };

  const onFileSelected = async (file: FileHandle, parsedMessage: string, chatHistory: { role: string, content: string | undefined }[]) => {
    const chatId = chatIdentifier ?? (await (createNewChat ?? createChat)());
    if (!chatId) {
      LOG.error('Chat ID is not available for file upload.');
      return;
    }
    setActiveChatId(chatId);
    await ChatApi.createAiMessage(chatId, `{1 file added: ${file.name}}`);
    await fetchMessages(chatId);
    await sendMessageUsingActiveChat(
      // @ts-ignore
      { 
        document_id: file.id, 
        message: parsedMessage, 
        message_type: 'text', 
        search_scope: 'document_only' ,
        chat_history: chatHistory,
      },
      createNewChat
    ).catch((err) => LOG.error(`Error sending file message.`, err));
    await fetchMessages(chatId);
  };

  /**
   * Function to handle sending the text message to shopaiassist
   * @param medium is whether the message was submitted by clicking or hitting 'enter'
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendTextMessage = async (medium: ClickOrKey) => {
    const entry_product = currentProduct?.replace(/['"]+/g, '');

    const parsedMessage: string = `/?!#$(&^query: ${value}/?!#$(&^product_entry:${entry_product === 'shopaiassist Platform' ? 'null' : entry_product}`;
    LOG.log(`Sending text message: ${parsedMessage}`);

    // Disable the button and start the timer
    setIsTimerOneMinDisabled(true);
    const timer = setTimeout(() => {
      setIsTimerOneMinDisabled(false);
    }, 60000);

    // Get the current messages from the state for the active chat
    const currentMessages = messages[activeChatId ?? ''] || [];

    // Format the chat history for the request
    const chatHistory = currentMessages.map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: parseMessages(cleanChatMessage(msg.message ?? '')),
    }));
    // send a message to the parent MFE to indicate that the user is chatting
    sendEvent({ message: 'isChatting', body: { isChatting: true } });
    sessionStorage.setItem('chat_title', value);

    if (fileHandle) {
      // Pass the chatHistory to the onFileSelected function
      await onFileSelected(fileHandle, parsedMessage, chatHistory);
      setFileHandle(null);
      setSelectedFile(null);
      // @ts-ignore
      fileInputRef.current.value = null;
    } else {
      // @ts-ignore
      sendMessageUsingActiveChat(
        {
          message: parsedMessage,
          message_type: 'text',
          // @ts-ignore
          document_id: activeFileId,
          search_scope: wasTheDocumentUploaded ? 'document_and_kb' : 'kb_only',
          chat_history: chatHistory,
        },
        createNewChat
      ).catch((err) => {
        // TODO: Report this error.
        LOG.error(`Error sending text message for chat.`, err);
        setIsTimerOneMinDisabled(false);
      });
    }
    if (textAreaEl.current) {
      setValue('');
      textAreaEl.current.value = '';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      try {
        setIsFileUploading(true);
        const resp = await ChatApi.documentUpload(file);
        setIsFileUploading(false);
        setFileHandle({
          id: resp.document_id,
          name: file.name,
          type: file.type,
          size: file.size,
        });
        setSelectedFile(file);
      } catch (error) {
        const chatId = chatIdentifier ?? (await (createNewChat ?? createChat)());
        if (!chatId) {
          LOG.error('Chat ID is not available for file upload.');
          return;
        }
        setActiveChatId(chatIdentifier);
        await ChatApi.createAiMessage(
          chatId,
          `Your file can’t be added. Make sure it doesn’t exceed 10 MB and is PDF or XML.`
        );
        await fetchMessages(chatId);
        setSelectedFile(null);
        console.error('Error uploading file:', error);
      } finally {
        setIsFileUploading(false);
      }
    }
    // Reset the input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFileRef = useRef<ButtonInstance>(null);

  return (
    <div className="chat-input" {...props}>
      <div className="file-upload-notice">
        <Icon size={14} slot="label-end" aria-hidden="true" iconName="circle-info" />
        <Text appearance="body-default-xs">{t('CHAT.shopaiassist_NOTICE')}</Text>
      </div>
      <Textarea
        resize="none"
        ref={textAreaEl}
        id="shopaiassist-prompt"
        onKeyDown={handleKeyDown}
        maxlength={CHAT_MESSAGE_MAX_LENGTH}
        density="compact"
        disabled={isBusy()}
        placeholder={t('CHAT.ENTER_A_QUESTION_OR_INSTRUCTION')}
        onInput={(evt) => setValue(evt.currentTarget.currentValue)}
      />
      {isFileUploading && (
        <div className="file-section uploading">
          <ProgressRing indeterminate progressSize="small" />
          <Text className="uploading-text" appearance="body-default-sm">
            {t('CHAT.UPLOADING')}
          </Text>
        </div>
      )}
      {selectedFile && !isFileUploading && (
        <div className="file-section">
          <div>
            <div className="file-upload-note">
              <Icon size={14} slot="start" aria-hidden="true" iconName="circle-info" />
              <Text className="file-upload-note-text" appearance="body-default-xs">
                {t('CHAT.NOTE_FOR_UPLOADED_FILES')}
              </Text>
            </div>
            <div>
              <Chip
                className="file-chip"
                closeable={true}
                closableTooltip={false}
                onClose={() => {
                  setSelectedFile(null);
                  setFileHandle(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                {selectedFile?.type === 'application/pdf' ? (
                  <Icon iconName="file-pdf" appearance="solid" color="var(---color-red-400)"></Icon>
                ) : (
                  <Icon iconName="file-excel" appearance="solid" color="var(---color-red-400)"></Icon>
                )}
                <Text
                  className="file-chip-name"
                  color="var(---color-brand-gray-400)"
                  appearance="body-default-sm"
                >
                  {selectedFile?.name}
                </Text>
              </Chip>
            </div>
          </div>
        </div>
      )}
      <div className="actions">
        <div className="create-file-action" style={{ display: 'none' }}>
          <input
            type="file"
            accept="application/pdf, application/xml"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <Button
            density="compact"
            ref={uploadFileRef}
            appearance="tertiary"
            disabled={true || !!fileHandle || !!selectedFile || isBusy()}
            className="ai-assistance-upload-button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
          >
            <Icon aria-hidden="true" icon-name="arrow-up-from-bracket" slot="start" />
            {t('CHAT.UPLOAD_FILE')}
          </Button>

          {/* <Tooltip anchor="uploadFileButton" trigger-on-click="false" placement='top'>
            {t('CHAT.MAX_SIZE')}
          </Tooltip> */}
        </div>
        <Button
          a11y-aria-label={t('CHAT.SEND_MESSAGE')}
          data-testid="send-message-button"
          appearance="tertiary"
          density="compact"
          disabled={!value || isBusy() || isTimerOneMinDisabled}
          iconOnly
          id="send"
          onClick={() => sendTextMessage('click')}
        >
          {isBusy() ? <ProgressRing progressSize="small" /> : <Icon aria-hidden="true" iconName="paper-plane" />}
        </Button>
      </div>
      <div className="policy">
        {/* <Icon id="shield-check-icon" aria-hidden="true" iconName="shield-check" appearance="solid" /> */}
        <Text appearance="body-default-sm">
          {t('CHAT.NEW_TO_AI')}
          <Anchor
            href="https://www.thomsonreuters.com/en-us/help/shopaiassist-platform/shopaiassist.html"
            target="_blank"
            aria-label="{t('CHAT.HOW_THE_AI_WORKS_LABEL')}"
          >
            {t('CHAT.HOW_THE_AI_WORKS')}
            <Icon id="open-new-window-icon" iconName="arrow-up-right-from-square" size={12} appearance="solid" />
          </Anchor>
          {t('CHAT.AND_OUR')}
          <Anchor
            href="https://www.thomsonreuters.com/en/privacy-statement.html/#HowUse"
            target="_blank"
            aria-label="{t('CHAT.PRIVACY_STATEMENT_ARIA_LABEL')}"
          >
            {t('CHAT.PRIVACY_STATEMENT')}
            <Icon id="open-new-window-icon" iconName="arrow-up-right-from-square" size={12} appearance="solid" />
          </Anchor>
        </Text>
      </div>
    </div>
  );
};

export default ChatInput;
