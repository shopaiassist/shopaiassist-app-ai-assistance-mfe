import { Chat } from 'react';
import Message from './messages/Message';
import { useChatMessages } from '../hooks/useChatMessages';
import { useEffect } from 'react';

interface ChatMessagesProps {
  chatId: string
}

const userMessage = (request: Chat.MessageCreate): Chat.MessageUser => ({
  id: 'sending',
  sender: 'user',
  sent_time: 'sending',
  ...request,
});

/** Component to render chat messages */
const ChatMessages = ({ chatId }: ChatMessagesProps): JSX.Element => {
  const { filteredMessages, sending } = useChatMessages(chatId);


  useEffect(() => {
    console.log('***** filteredMessages:', filteredMessages);
  }, [filteredMessages]);

  return (
    <div>
      {filteredMessages.map((msg, idx, messages) => (
        <Message
          hideAvatar={!!idx && messages[idx - 1].sender === msg.sender}
          isLast={!sending && idx === messages.length - 1}
          key={idx}
          message={msg}
        />
      ))}
      {/* TODO: make this transition */}
      {!!sending && <Message isLast message={userMessage(sending!)} />}
    </div>
  );
};

export default ChatMessages;
