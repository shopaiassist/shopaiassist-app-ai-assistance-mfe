import { createContext, useContext } from 'react';
import { AiAssistantBaseProps, AiAssistantContentProps } from './types';
import { MfeContext } from 'react';

/** Context for references used with the Assistance MFE */
export const CtxAssistant = createContext<AiAssistantBaseProps | null>(null);
export const CtxAssistantContent = createContext<AiAssistantContentProps | null>(null);
export const CtxMfe = createContext<MfeContext | null>(null);

/** Hook to use the Assistance MFE */
export const useAssistant = (): AiAssistantBaseProps => {
  const context = useContext(CtxAssistant);
  if (!context) {
    throw new Error('useAssistant must be used within CtxAssistant.Provider');
  }
  return context;
};

/** Hook to use the AI Assistance Content MFE */
export const useAssistantContent = (): AiAssistantContentProps => {
  const context = useContext(CtxAssistantContent);
  if (!context) {
    throw new Error('useAssistantContent must be used within CtxAssistantContent.Provider');
  }
  return context;
};

/** Hook to use the MFE context */
export const useMfeContext = (): MfeContext => {
  const context = useContext(CtxMfe);
  if (!context) {
    throw new Error('useMfeContext must be used within CtxMfe.Provider');
  }
  return context;
};
