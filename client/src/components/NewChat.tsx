import { AiTextMessage } from 'react';
import { i18n } from 'react';
import Message from './messages/Message';
import { useMfeContext } from '../Context';

const welcome = (greeting: string, firstName: string): AiTextMessage => ({
  id: 'new-chat',
  invite_db_selection: false,
  invite_file_upload: false,
  message:
    i18n.useTranslation('hermes').t('MESSAGES.GREETING', { greeting }) +
    i18n.useTranslation('hermes').t('MESSAGES.WELCOME', { firstName }),
  message_type: 'text',
  sender: 'ai',
  sent_time: new Date().toISOString(),
  system_flags: [],
});

const NewChat = () => {
  const { user } = useMfeContext();
  const greetings = [
    { check: (h: number) => h < 12, greeting: 'morning' },
    { check: (h: number) => h < 17, greeting: 'afternoon' },
    { check: (h: number) => h >= 17, greeting: 'evening' },
  ];
  const greet = greetings.find((g) => g.check(new Date().getHours()))!.greeting;

  return (
    <Message message={welcome(greet, user?.firstName || 'User')}></Message>
  );
};

export default NewChat;
