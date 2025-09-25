import { useMemo, useEffect } from 'react';
import { useChat } from '../store';

/**
 * A hook to handle fetching chat messages and their loading state
 * @param chatId
 * @returns `filteredMessages`, `loading`, `sending`
 */
export const useChatMessages = (chatId: string) => {
  const [chatMessages, loading, sending, fetchChatMessages] = useChat((state) => [
    state.messages[chatId] || [],
    state.fetching.includes(chatId),
    state.sending,
    state.fetchMessages,
  ]);

  const filteredMessages = useMemo(() => {
    return chatMessages.filter(
      (msg, idx, messages) =>
        // don't include hidden messages
        msg.message_type !== 'hidden' &&
        !msg.message?.includes('## reformulated_query') &&
        !msg.message?.includes('Feedback received successfully.') &&
        !msg.message?.startsWith('/?!#$(&^feedback:') &&
        // don't include a request that is followed by a flow
        !(msg.message_type === 'request' && idx + 1 < messages.length && messages[idx + 1].message_type === 'flow')
    );
  }, [chatMessages]);

  useEffect(() => {
    if (!chatMessages.length) fetchChatMessages(chatId);
  }, [chatId]);

  return { filteredMessages, loading, sending };
};
