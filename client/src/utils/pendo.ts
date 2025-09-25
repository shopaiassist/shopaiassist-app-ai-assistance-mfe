import { Chat } from 'react';
import { parseOutQueryPrefix } from './chat';
import {
  markdownTitleExpression,
  newlineExpression,
  urlExpression,
  bulletExpression,
  openTicketExpression,
} from './expressions';

export enum PendoEvent {
  AiChats = 'AI Chats',
  CreateSupportTicket = 'Create Support Ticket | Submit Create Ticket',
}

type PendoEventCommonData = {
  application: string;
  webSessionId: string;
};

type AiChatPendoEvent = {
  name: PendoEvent.AiChats;
  data: PendoEventCommonData & {
    searchQueryNumber: string; // Question Text
    searchQueryInput: string; // e.g. question 1, question 2, etc
    conversationId: string;
    conversationEntryId: string; // ID of each question/answer pair
    summaryResponse: string; // AI answer
    feedbackResult?: string;
    feedbackComment?: string;
    isConversationFeedback?: string;
  };
};

type CreateAiChatPendoEventPayload = {
  name: PendoEvent.AiChats;
  data: {
    conversationId: string;
    messages: Chat.Message[];
  };
};

type CreateSupportTicketPendoEventPayload = {
  name: PendoEvent.CreateSupportTicket;
  data: {
    firmId: string;
    product: string;
    caseSubject: string;
    conversationId: string;
    caseDescription: string;
    conversationEntryId: string;
  };
};

type CreateSupportTicketPendoEvent = {
  name: PendoEvent.CreateSupportTicket;
  data: PendoEventCommonData & CreateSupportTicketPendoEventPayload['data'];
};

export type CreatePendoEventPayload = CreateAiChatPendoEventPayload | CreateSupportTicketPendoEventPayload;

export type PendoEvent = AiChatPendoEvent | CreateSupportTicketPendoEvent;

export const createPendoEvent = (payload: CreatePendoEventPayload): PendoEvent => {
  switch (payload.name) {
    case PendoEvent.AiChats:
      return createPendoAiChatEvent(payload.data.conversationId, payload.data.messages);
    case PendoEvent.CreateSupportTicket:
      return createPendoCreateSupportEvent(payload.data);
  }
};

const createPendoCreateSupportEvent = ({
  firmId,
  product,
  caseSubject,
  conversationId,
  caseDescription,
  conversationEntryId,
}: CreateSupportTicketPendoEventPayload['data']): PendoEvent => {
  return {
    name: PendoEvent.CreateSupportTicket,
    data: {
      webSessionId: '',
      application: 'shopaiassist Platform',
      firmId,
      product,
      caseSubject,
      conversationId,
      caseDescription,
      conversationEntryId,
    },
  };
};

const createPendoAiChatEvent = (conversationId: string, messages: Chat.Message[]): PendoEvent => {
  const latestAnswer = messages.at(-1);

  return {
    name: PendoEvent.AiChats,
    data: {
      // Common Properties
      // Provided by Platform UI
      webSessionId: '',
      application: 'shopaiassist Platform',

      // Event Specific Properties
      searchQueryNumber: `Answer ${getSearchQueryNumber(messages)}`,
      searchQueryInput: getSearchQueryInput(messages.length - 1, messages),
      conversationId,
      conversationEntryId: latestAnswer?.id ?? '',
      summaryResponse: parseMessage(latestAnswer?.message ?? ''),
    },
  };
};

export const createPendoFeedbackEvent = ({
  conversationId,
  feedbackResult,
  feedbackComment,
  conversationEntryId,
  isConversationFeedback,
}: {
  conversationId?: string;
  feedbackComment: string;
  conversationEntryId?: string;
  isConversationFeedback: boolean;
  feedbackResult: 'positive' | 'negative';
}): PendoEvent => {
  return {
    name: PendoEvent.AiChats,
    data: {
      webSessionId: '',
      application: 'shopaiassist Platform',

      feedbackResult,
      feedbackComment,
      summaryResponse: '',
      searchQueryInput: '',
      searchQueryNumber: '',
      conversationId: conversationId ?? '',
      conversationEntryId: conversationEntryId ?? '',
      isConversationFeedback: isConversationFeedback ? 'Yes' : 'No',
    },
  };
};

const parseMessage = (message: string): string => {
  if (!message) return '';
  message = message.replace(markdownTitleExpression, '');
  message = message.replace(newlineExpression, '');
  message = parseOutQueryPrefix(message);
  message = message.replace(urlExpression, '');
  message = message.replace(bulletExpression, '');
  message = message.replace(openTicketExpression, '');
  return message;
};

export const isValidAiResponse = (idx: number, messages: Chat.Message[]): boolean => {
  const msg = messages[idx];
  return (
    // don't include hidden messages
    !!msg.message?.startsWith('## message') &&
    msg.message_type !== 'hidden' &&
    !msg.message?.includes('## reformulated_query') &&
    !msg.message?.includes('Feedback received successfully.') &&
    !msg.message?.startsWith('/?!#$(&^feedback:') &&
    // don't include a request that is followed by a flow
    !(msg.message_type === 'request' && idx + 1 < messages.length && messages[idx + 1].message_type === 'flow')
  );
};

export const filterMessagesForPendo = (messages: Chat.Message[]): Chat.Message[] => {
  return messages.filter(
    (msg, idx, messages) =>
      // don't include hidden messages
      msg.message_type !== 'hidden' &&
      !msg.message?.includes('## reformulated_query') &&
      !msg.message?.includes('Feedback received successfully.') &&
      !msg.message?.startsWith('/?!#$(&^feedback:') &&
      // don't include a request that is followed by a flow
      !(msg.message_type === 'request' && idx + 1 < messages.length && messages[idx + 1].message_type === 'flow')
  );
};

export const addPendoIdToLinks = (msgText: string) => {
  let index = 0;
  return msgText.replace(
    /(\[[\w \-()]*\]\(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)\))/g,
    (_match, $1) => {
      index++;
      return `${$1}<!--rehype:data-testid=chat-response-link-${index}-->`;
    }
  );
};

const getSearchQueryNumber = (messages: Chat.Message[]): number => {
  const aiResponses = messages.filter(
    (msg) =>
      msg.message_type === 'text' &&
      msg.sender === 'ai' &&
      !msg.message?.includes('## reformulated_query') &&
      !msg.message?.includes('Feedback received successfully.') &&
      !msg.message?.startsWith('/?!#$(&^feedback:')
  );
  return aiResponses.length;
};

const getSearchQueryInput = (messageIdx: number, messages: Chat.Message[]): string => {
  if (messageIdx - 1 < 0 || messageIdx >= messages.length || messages.length < 2) return '';
  const latestQuestion = messages.at(messageIdx - 1)?.sender === 'user' ? messages.at(messageIdx - 1)?.message : '';
  return parseMessage(latestQuestion || '');
};
