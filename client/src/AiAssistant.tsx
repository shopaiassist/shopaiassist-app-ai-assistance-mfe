import { useEffect, useMemo, useState } from 'react';
import { CtxAssistant, CtxAssistantContent } from './Context';
import MfeWrapper from './MfeWrapper';
import { AiAssistantProps } from './types';
import { Chat, ChatResults, ResultPanel } from './views';
import './AiAssistant.scss';
import { useSupportTicket } from './store/supportTicket';
import SupportTicketForm from './components/SupportTicket/SupportTicketForm';
import useMFECommunication from './hooks/useMFECommunication';

/** AiAssistant MFE */
const AiAssistant = ({ context, displayTable, messages, readOnly, resultPanel, ...props }: AiAssistantProps) => {
  const [tableView, setTableView] = useState(!!displayTable);
  const { closeSupportTicketForm, supportTicketFormDetails } = useSupportTicket();

  useEffect(() => setTableView(!!displayTable), [displayTable]);

  useMFECommunication('chat_item_selected', () => {
    closeSupportTicketForm();
  });

  const assistantContextValue = useMemo(() => ({ messages, readOnly, resultPanel }), [messages, readOnly, resultPanel]);

  return (
    <div id="ai-assistance-mfe">
      <MfeWrapper context={context}>
        <CtxAssistant.Provider value={props}>
          <CtxAssistantContent.Provider value={assistantContextValue}>
            <div className="ai-assistance">
              {supportTicketFormDetails ? (
                <SupportTicketForm {...supportTicketFormDetails} />
              ) : (
                <>
                  {tableView ? <ChatResults /> : <Chat />}
                  <ResultPanel />
                </>
              )}
            </div>
          </CtxAssistantContent.Provider>
        </CtxAssistant.Provider>
      </MfeWrapper>
    </div>
  );
};

// important to have default export for microfrontend to work with module federation!!
// The module being exposed in webpack.config.ts is the default export
export default AiAssistant;
