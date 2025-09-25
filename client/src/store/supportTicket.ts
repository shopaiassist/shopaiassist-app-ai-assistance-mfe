import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Chat } from 'react';
import { ISalesforceTicketSubmissionResponse } from '../utils/interfaces';

interface SupportTicketActions {
  closeSupportTicketForm: () => void;
  setChatId: (chatId: string | undefined) => void;
  setCurrentMessage: (currentMessage: Chat.Message) => void;
  openSuportTicketForm: (details: { conversationId?: string; conversationEntryId?: string }) => void;
  setSalesforceTicketSubmissionResponse: (
    salesforceTicketSubmissionResponse: ISalesforceTicketSubmissionResponse
  ) => void;
}

interface SupportTicketState {
  chatId: string;
  currentMessage: Chat.Message;
  supportTicketFormDetails:
    | {
        conversationId?: string;
        conversationEntryId?: string;
      }
    | undefined;
  salesforceTicketSubmissionResponse: ISalesforceTicketSubmissionResponse;
}

export const useSupportTicket = create<SupportTicketState & SupportTicketActions>()(
  devtools((set) => ({
    chatId: '',
    currentMessage: {} as Chat.Message,
    closeSupportTicketForm: () => set({ supportTicketFormDetails: undefined }),
    salesforceTicketSubmissionResponse: {} as ISalesforceTicketSubmissionResponse,
    supportTicketFormDetails: undefined as SupportTicketState['supportTicketFormDetails'],
    setChatId: (chatId: string | undefined) => set({ chatId }),
    openSuportTicketForm: ({ conversationId, conversationEntryId }) =>
      set({ supportTicketFormDetails: { conversationId, conversationEntryId } }),
    setCurrentMessage: (currentMessage: Chat.Message) => set({ currentMessage }),
    setSalesforceTicketSubmissionResponse: (salesforceTicketSubmissionResponse: ISalesforceTicketSubmissionResponse) =>
      set({ salesforceTicketSubmissionResponse }),
  }))
);
