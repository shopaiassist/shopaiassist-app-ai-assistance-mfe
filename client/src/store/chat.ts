import { Chat, FileHandle } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CancelFlowRequest } from '../types';
import { getFilesFromMessages, isFilesMessage, isFragment, isUserMessage } from '../utils/chat';
import ChatApi from '../utils/chatApi';
import {
  PendoEvent,
  createPendoEvent,
  filterMessagesForPendo,
  isValidAiResponse,
  PendoEvent,
} from '../utils/pendo';

const ACTION_TYPES = {
  CANCEL_REQUEST: 'chat/cancelRequest',
  CREATE_CHAT: 'chat/createChat',
  EXECUTE_REQUEST: 'chat/executeRequest',
  FETCH_MESSAGES: 'chat/fetchMessages',
  HANDLE_FRAGMENT: 'chat/handleFragment',
  HANDLE_MESSAGE: 'chat/handleMessage',
  MESSAGE_SHOWN: 'chat/messageShown',
  SEND_MESSAGE: 'chat/sendMessage',
  SET_ACTIVE_CHAT_ID: 'chat/setActiveChatId',
} as const;

interface ChatActions {
  cancelFlow: (request: CancelFlowRequest) => Promise<void>;
  cancelRequest: (request: Chat.CancelRequest) => Promise<void>;
  createChat: () => Promise<string>;
  executeRequest: (request: Chat.FormRequest) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  handleFragment: (msg: Chat.WithChat<Chat.MessageFragment>) => void;
  handleMessage: (msg: Chat.WithChat<Chat.Message>) => void;
  isBusy: () => boolean;
  messageShown: (request: Chat.WithChat<Chat.CancelRequest>) => Promise<void>;
  sendMessage: (
    request: Chat.MessageCreate & { chatId?: string; chat_history?: { role: string, content: string | undefined }[] },
    createNewChat?: () => Promise<string>
  ) => Promise<void>;
  sendMessageUsingActiveChat: (
    request: Chat.MessageCreate & { chat_history?: { role: string, content: string | undefined }[] },
    createNewChat?: () => Promise<string>,
    trackPendo?: (event: PendoEvent) => void
  ) => Promise<void>;
  //sendFeedback: (request: { message: string, message_type: string }) => Promise<void>;
  setActiveChatId: (chatId?: string) => void;
  setTrackPendo: (trackPendo: (event: PendoEvent) => void) => void;
  trackPendo: (event: PendoEvent) => void;
}

export interface ChatState {
  activeChatId?: string;
  allowedSkills: Chat.FlowRequestType[];
  chats: Record<string, Chat.ListItem>;
  fetching: string[];
  files: Record<string, FileHandle>;
  messages: Record<string, Chat.Message[]>;
  notifications: string[];
  pendingRequest: boolean;
  sending?: Chat.MessageCreate;
  streaming: boolean;
}

export const useChat = create<ChatActions & ChatState>()(
  devtools(
    (set, get) => ({
      allowedSkills: [],
      chats: {},
      fetching: [],
      files: {},
      messages: {},
      notifications: [],
      pendingRequest: false,
      streaming: false,
      setTrackPendo: (trackPendo: (event: PendoEvent) => void) => {
        set({ trackPendo });
      },
      trackPendo: () => {},

      cancelFlow: async (params) => {
        // TODO: this probably needs to be updated to find the correct chat_id (based on the flow_id)
        const chat_id = get().activeChatId;
        if (!chat_id) return;
        await ChatApi.cancelFlow({ chat_id, ...params });
      },
      cancelRequest: async (request) => {
        // TODO: this probably needs to be updated to find the correct chat_id (based on the message_id)
        const chat_id = get().activeChatId;
        if (!chat_id) return;
        await ChatApi.requestCancel({ chat_id, ...request });
        set({ pendingRequest: false }, false, ACTION_TYPES.CANCEL_REQUEST);
      },
      createChat: async () => {
        const chat = await ChatApi.create();

        set(
          (state) => ({
            chats: { ...state.chats, [chat.id]: chat },
          }),
          false,
          ACTION_TYPES.CREATE_CHAT
        );
        return chat.id;
      },
      executeRequest: async (request) => {
        const chatId = get().activeChatId;
        if (!chatId) return;
        set({ pendingRequest: true }, false, ACTION_TYPES.EXECUTE_REQUEST);
        await ChatApi.directMessage({
          chat_id: chatId,
          request,
          type: 'execute',
          onMessage: (msg) => (isFragment(msg) ? get().handleFragment(msg) : get().handleMessage(msg)),
        });
        set({ pendingRequest: false }, false, ACTION_TYPES.EXECUTE_REQUEST);
      },
      fetchMessages: async (chat_id) => {
        // Return early with an empty promise if chat_id is empty
        if (!chat_id) return Promise.resolve();

        const fetching = get().fetching;
        // prevent fetching the same chat messages multiple times
        if (fetching.includes(chat_id)) return;
        set({ fetching: [...fetching, chat_id] }, false, ACTION_TYPES.FETCH_MESSAGES);
        const { chat } = await ChatApi.fetchMessages({ chat_id });

        const msgFiles = getFilesFromMessages(chat.messages);
        set(
          (state) => ({
            fetching: state.fetching.filter((id) => id !== chat_id),
            files: { ...state.files, ...msgFiles },
            messages: { ...state.messages, [chat_id]: chat.messages },
          }),
          false,
          ACTION_TYPES.FETCH_MESSAGES
        );
      },
      handleFragment: (msg) => {
        set(
          (state) => {
            const updatedMessages = state.messages[msg.chat_id]?.map((m) =>
              m.id === msg.id && m.message_type === 'text' ? { ...m, message: m.message + msg.message } : m
            );
            return {
              ...state,
              messages: { ...state.messages, [msg.chat_id]: updatedMessages },
            };
          },
          false,
          ACTION_TYPES.HANDLE_FRAGMENT
        );
      },
      handleMessage: ({ chat_id, ...msg }) => {
        set(
          (state) => {
            const messages = state.messages[chat_id] || [];
            const newMsg = messages.find(({ id }) => id === msg.id) === undefined;
            const updatedMessages = newMsg ? [...messages, msg] : messages.map((m) => (m.id === msg.id ? msg : m));
            let updatedFiles = state.files;
            if (isFilesMessage(msg)) {
              msg.files?.forEach((file) => {
                updatedFiles = { ...updatedFiles, [file.id]: file };
              });
            }
            let updatedSending = state.sending;
            if (isUserMessage(msg)) {
              updatedSending = undefined;
            } else if (isValidAiResponse(updatedMessages.length - 1, updatedMessages)) {
              const filteredMessages = filterMessagesForPendo(updatedMessages);
              get().trackPendo(
                createPendoEvent({
                  name: PendoEvent.AiChats,
                  data: {
                    conversationId: chat_id,
                    messages: filteredMessages,
                  },
                })
              );
            }

            return {
              ...state,
              messages: { ...state.messages, [chat_id]: updatedMessages },
              files: updatedFiles,
              sending: updatedSending,
            };
          },
          false,
          ACTION_TYPES.HANDLE_MESSAGE
        );
      },
      isBusy: () => !!get().sending || get().streaming,
      messageShown: async ({ chat_id, message_id }) => {
        set(
          (state) => {
            const messages = state.messages[chat_id].map((m) => (m.id === message_id ? { ...m, appear: false } : m));
            return {
              ...state,
              messages: {
                ...state.messages,
                [chat_id]: messages,
              },
            };
          },
          false,
          ACTION_TYPES.MESSAGE_SHOWN
        );
      },
      sendMessage: async ({ chatId, chat_history, ...request }, createNewChat) => {
        const external = !!createNewChat;
        let chat_id = chatId;
        if (!chat_id) {
          chat_id = await (external ? createNewChat() : get().createChat());

          // TODO [OIA]: Uncomment this once all MFEs are deployed
          if (external) {
            get().setActiveChatId(chat_id);
          }
        }
        set({ sending: request }, false, ACTION_TYPES.SEND_MESSAGE);
        await ChatApi.directMessage({
          chat_id,
          request: { ...request, chat_history },
          type: 'message',
          onMessage: (msg) => (isFragment(msg) ? get().handleFragment(msg) : get().handleMessage(msg)),
          setStreaming: (streaming) => set({ streaming }, false, ACTION_TYPES.SEND_MESSAGE),
        });
      },
      sendMessageUsingActiveChat: async ({ ...request }, createNewChat) => {
        const chatId = get().activeChatId;
        await get().sendMessage({ chatId, ...request }, createNewChat);
      },
      setActiveChatId: (chatId) =>
        set(
          (state) => (state.activeChatId !== chatId ? { activeChatId: chatId } : state),
          false,
          ACTION_TYPES.SET_ACTIVE_CHAT_ID
        ),
    }),
    { name: 'AiAssistanceChatStore' }
  )
);
