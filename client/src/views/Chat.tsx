import './Chat.scss';
import { Chat } from 'react';
import ChatInput from '../components/ChatInput';
import ChatMessages from '../components/ChatMessages';
import NewChat from '../components/NewChat';
import { useAssistant, useAssistantContent } from '../Context';
import { useEffect } from 'react';
import { useChat } from '../store/chat';
import useMFECommunication, { CustomEventData } from '../hooks/useMFECommunication';
import { useChatMessages } from '../hooks/useChatMessages';
import { parseMessages } from '../utils/chat';
import jsPDF from 'jspdf';
import { IFeedbackPayload } from '../utils/interfaces';
import { createPendoFeedbackEvent } from '../utils/pendo';
import ChatApi from '../utils/chatApi';
import { filter } from 'lodash';

/** Component to render chat messages and input */
const Chat = () => {
  const sessionObj = JSON.parse(sessionStorage.getItem('data') ?? '{}');
  const { chatIdentifier, trackPendo } = useAssistant();
  const { readOnly } = useAssistantContent();
  const { setTrackPendo } = useChat();
  const [sendEvent] = useMFECommunication('send_feedback_complete');
  const { filteredMessages } = useChatMessages(chatIdentifier ?? '');
  

  useMFECommunication('global_feedback', (data: CustomEventData) => {
    handleGlobalFeedbackSubmission(data);
  });

  const iaIcon =
    '';
  const userIcon =
    '';

  /**
   * This function is executed when the user has filled out the global feedback form and submitted it.
   * @param data information from the global feedback component in the container app.
   */
  const handleGlobalFeedbackSubmission = async (data: CustomEventData) => {
    trackPendo?.(
      createPendoFeedbackEvent({
        isConversationFeedback: true,
        conversationId: chatIdentifier,
        feedbackComment: data.body.comment,
        feedbackResult: data.body.isLiked ? 'positive' : 'negative',
      })
    );

    console.log('** filteredMessages.at(-1)?.id:', filteredMessages.at(-1)?.id);
    console.log('** filteredMessages.at(-2)?.id:', filteredMessages.at(-2)?.id);

    const payload: IFeedbackPayload = {
      user_query: 'all',
      ai_message: 'all',      
      comments: data.body.comment,
      tenant_id: sessionObj.tenantId,
      feedback_symbol: data.body.isLiked ? 'positive' : 'negative',
      chat_id: chatIdentifier,
      bot_resp_id: filteredMessages.at(-1)?.id,
      user_query_id: filteredMessages.at(-2)?.id,
    };

    try {
      const responseFeedback = await ChatApi.submitFeedback(payload);

      if (responseFeedback.status === 200) {
        sendEvent({ message: 'send_feedback_complete', body: { success: true } });
      } else {
        sendEvent({ message: 'send_feedback_complete', body: { success: false } });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      sendEvent({ message: 'send_feedback_complete', body: { success: false } });
    }
  };

  useMFECommunication('chat_export', (data: CustomEventData) => {
    const treeItem = data.body.treeItem;
    const exportType = data.body.exportType;
    const clonedMessages = JSON.parse(JSON.stringify(filteredMessages));
    if (exportType === 'pdf') {
      exportAsPDF(treeItem?.name || 'chat', clonedMessages);
    } else {
      exportAsFile(treeItem?.name || 'chat', exportType, clonedMessages);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportAsFile = (fileName: string, fileType: string, filteredMessages: any[]) => {
    const downloadFileName = fileName + '.' + fileType;
    const fileContent: string | undefined = filteredMessages
      .map((msg) => {
        const sent_datetime = new Date(msg.sent_time);
        const formatedMessage: string[] = [];
        msg.message.split('\n').map((line: string) => {
          if (
            line.startsWith('|case') ||
            line.startsWith('|---')
          ) {
            line = '';
          }
          formatedMessage.push(line);
        });
        let message: string = `${msg.sender.toUpperCase()}: ${sent_datetime.toUTCString()} - ${parseMessages(formatedMessage.join('\n'))}\n`;
        message += '-'.repeat(100) + '\n';
        return message;
      })
      .join('\n');
    const element = document.createElement('a');
    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = downloadFileName;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportAsPDF = (fileName: string, messages: any[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth() + 30;
    let leftStartIndex = 10;
    let topStartIndex = 20;
    const iconSize = 5;
    const pageHeight = doc.internal.pageSize.getHeight();
    const messageLinks: string[] = [];
    messages.forEach((msg) => {
      const localMessage: string[] = [];
      msg.message = msg.message
        ?.replace('|Key | Value|', '')
        .replace('[---|---|', '')
        .replace('|---|---|', '');
      msg.message?.split('\n').forEach((line: string) => {
        if (line.includes('(https://www.')) {
          const textStartIndex = line.indexOf('[');
          const textEndIndex = line.indexOf(']');
          const urlStartIndex = line.indexOf('(');
          const text = line.substring(textStartIndex + 1, textEndIndex);
          const url = line.substring(urlStartIndex + 1, line.length - 1);
          localMessage.push('####' + text);
          messageLinks.push(url);
        } else {
          if (
            line.startsWith('|case') ||
            line.startsWith('|---')
          ) {
            line = '';
          }
          localMessage.push(line);
        }
      });
      msg.message = localMessage.join('\n');
    });

    doc.setProperties({ title: fileName });
    doc.text(fileName, 100, 10, { align: 'center' });

    doc.setFontSize(11);
    messages.forEach((msg) => {
      const iconBase64 = msg.sender === 'ai' ? iaIcon : userIcon;
      const sentDatetime = new Date(msg.sent_time);
      const headerText = `${msg.sender.toUpperCase()} - ${sentDatetime.toUTCString()}`;
      const headerLines = doc.splitTextToSize(headerText, pageWidth - leftStartIndex * 3 - iconSize);

      let headerIndex = 0;
      leftStartIndex = 10;
      headerLines.forEach((line: string) => {
        if (msg.sender === 'ai') {
          doc.setFillColor('#888888');
          doc.line(0, topStartIndex - 5, pageWidth, topStartIndex - 5, 'F');
          doc.setFillColor('#FAFAFA');
          doc.rect(0, topStartIndex - 5, pageWidth, topStartIndex + 5, 'F');
        }

        doc.setTextColor(0, 0, 0);
        doc.addImage(iconBase64, 'png', leftStartIndex, topStartIndex + 1, iconSize, iconSize);
        doc.text(line, leftStartIndex + 8, topStartIndex + 5);

        topStartIndex = topStartIndex + 6;
        headerIndex = headerIndex + 1;
      });

      topStartIndex = topStartIndex + 7;
      leftStartIndex = 20;

      const textLines = doc.splitTextToSize(msg.message ?? '', pageWidth - leftStartIndex * 3);
      let linkIndex = 0;
      textLines.forEach((line: string, index: number) => {
        if (line.length > 0 || (index === 0 && line.length === 0)) {
          console.log('line:', line);
          if (line.indexOf('####') > -1) {
            if (linkIndex === 0) {
              doc.text('', leftStartIndex, topStartIndex);
              topStartIndex = topStartIndex + 5;
              doc.text('Sources', leftStartIndex, topStartIndex);
              topStartIndex = topStartIndex + 5;
              doc.text('', leftStartIndex, topStartIndex);
              topStartIndex = topStartIndex + 5;
            }
            doc.setTextColor(0, 0, 255);
            doc.textWithLink(line.replace('####', ''), leftStartIndex, topStartIndex, { url: messageLinks[linkIndex] });
            doc.setTextColor(100, 100, 100);
            linkIndex = linkIndex + 1;
          } else {
            doc.text(line, leftStartIndex, topStartIndex);
          }
          topStartIndex = topStartIndex + 5;
        }
      });
      topStartIndex = topStartIndex + 8;

      if (topStartIndex > pageHeight - leftStartIndex) {
        doc.addPage();
        topStartIndex = 20;
      }
    });

    doc.save(fileName + '.pdf');
  };

  useEffect(() => {
    trackPendo && setTrackPendo(trackPendo);
  }, []);

  return (
    <Chat>
      {!chatIdentifier ? <NewChat /> : <ChatMessages chatId={chatIdentifier} />}
      {!readOnly && <ChatInput slot="footer" />}
    </Chat>
  );
};

export default Chat;
