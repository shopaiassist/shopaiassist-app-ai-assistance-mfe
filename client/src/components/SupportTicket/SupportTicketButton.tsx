import './SupportTicketButton.scss';
import { Chat } from 'react';
import { i18n } from 'react';
import { Button, Icon } from 'react';
import { useSupportTicket } from '../../store/supportTicket';
import { useAssistant } from '../../Context';
import { useChat } from '../../store';

interface SupportTicketButtonProps {
  messageObj: Chat.Message;
}

const SupportTicketButton = ({ messageObj }: SupportTicketButtonProps) => {
  const { t } = i18n.useTranslation('hermes');
  const { chatIdentifier } = useAssistant();
  const unfilteredMessages = useChat((state) => state.messages[chatIdentifier ?? ''] || []);

  const { setCurrentMessage, openSuportTicketForm } = useSupportTicket();

  const openSupportTicketForm = () => {
    setCurrentMessage(messageObj);
    openSuportTicketForm({
      conversationId: chatIdentifier,
      conversationEntryId: unfilteredMessages.at(-1)?.id,
    });
  };

  return (
    <Button
      density="standard"
      aria-label={t('SUPPORT_TICKET.BUTTON_TITLE')}
      className="create-support-ticket"
      onClick={openSupportTicketForm}
      data-testid="Create-New-Ticket-button"
      appearance="primary"
    >
      {t('SUPPORT_TICKET.BUTTON_TITLE')}
      <Icon icon-name="chevron-right" slot="end" appearance="light" presentation></Icon>
    </Button>
  );
};

export default SupportTicketButton;
