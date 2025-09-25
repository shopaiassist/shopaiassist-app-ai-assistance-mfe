import React, { ReactElement, ReactNode } from 'react';
import { MemoryRouterProps } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { i18n } from 'react';
import { UserTextMessage } from 'react;
import { ByRoleMatcher, render, RenderResult } from '@testing-library/react';
import { create } from 'zustand';

import { ChatState } from './src/store';
import en from './src/utils/locales/en';

i18n.init({ en });

type InitialEntries = MemoryRouterProps['initialEntries'];
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
type PartialChatState = DeepPartial<ChatState>;

interface RenderOptions {
  entries?: InitialEntries;
  store?: PartialChatState;
}

interface SnapshotOptions {
  isModal?: boolean | ByRoleMatcher;
  store?: PartialChatState;
}

interface WrapperProps {
  children: ReactNode;
}

/** Mock store for testing
 *  jest.mock('./path/to/store/chat.ts', () => ({
 *    useChat: useMockChatStore
 *  }));
 *
 * Within your test, you can then use the mock store to set state:
 * useChat.setState({ pendingRequest: true, messages: { ... } });
 */
export const useMockChatStore = create<ChatState>(() => ({
  activeChatId: 'mock-chat-id',
  allowedSkills: [
    'deposition_questions',
    'summarize',
    'contract_policy_analysis',
    'contract_answer',
    'review_documents',
    'sdb',
    'draft_correspondence',
    'draft_discovery_response',
    'timeline',
  ],
  chats: {
    0: {
      id: 'mock-chat-id',
      name: 'mock-chat-name',
      created_at: 'mock-date',
    },
  },
  fetching: [],
  messages: {
    'mock-chat-id': [{ message: 'mock-message', id: 'id', message_type: 'text' } as UserTextMessage],
  },
  notifications: [],
  pendingRequest: false,
  streaming: false,
  files: {},

  cancelRequest: jest.fn(),
  createChat: jest.fn(),
  executeRequest: jest.fn(),
  fetchMessages: jest.fn(),
  handleFragment: jest.fn(),
  handleMessage: jest.fn(),
  isBusy: jest.fn(),
  messageShown: jest.fn(),
  sendMessage: jest.fn(),
  setActiveChatId: jest.fn(),
}));

/** Render function with access to override store/state */
export const renderAll = (ui: ReactElement, { entries }: RenderOptions = {}): RenderResult => {
  const Wrapper = ({ children }: WrapperProps) => (
    <MemoryRouter initialEntries={entries}>
      <i18n.Provider i18n={i18n.instance}>{children}</i18n.Provider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper });
};

/** Render function with i18n provider */
export const renderWithI18n = (ui: ReactElement): RenderResult => {
  const I18nWrapper = ({ children }: WrapperProps) => <i18n.Provider i18n={i18n.instance}>{children}</i18n.Provider>;
  return render(ui, { wrapper: I18nWrapper });
};

/** Get content to test against a snapshot */
export const getSnapshot = (ui: ReactElement): ChildNode => renderAll(ui).container.firstChild as ChildNode;

/** Get modal content to test against a snapshot */
export const getSnapshotModal = (ui: ReactElement, role?: ByRoleMatcher): ChildNode =>
  renderAll(ui).getByRole(role || 'presentation');

/** Helper function to generate snapshots */
export const snapshot = (ui: ReactElement, { isModal }: SnapshotOptions = {}) => {
  const role = typeof isModal === 'boolean' ? undefined : isModal;
  // eslint-disable-next-line no-extra-boolean-cast
  const snapshot = !!isModal ? getSnapshotModal(ui, role) : getSnapshot(ui);
  expect(snapshot).toMatchSnapshot();
};

// re-export everything
export * from '@testing-library/react';
