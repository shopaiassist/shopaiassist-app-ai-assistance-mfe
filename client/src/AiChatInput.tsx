import { CtxAssistant } from './Context';
import ChatInput from './components/ChatInput';
import MfeWrapper from './MfeWrapper';
import { AiChatInputProps } from './types';
import './AiAssistant.scss';

/** AiChatInput MFE */
const AiChatInput = ({ context, ...props }: AiChatInputProps) => (
  <MfeWrapper context={context}>
    <CtxAssistant.Provider value={props}>
      <ChatInput />
    </CtxAssistant.Provider>
  </MfeWrapper>
);

// important to have default export for microfrontend to work with module federation!!
// The module being exposed in webpack.config.ts is the default export
export default AiChatInput;
