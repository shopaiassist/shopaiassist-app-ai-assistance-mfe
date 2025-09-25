import * as React from 'react';
import { Chat, FileHandle } from 'react';
import { unorderedListExpression } from './expressions';

export const CHAT_MESSAGE_BULK_FILE_CUTOFF = 5;
export const CHAT_MESSAGE_MAX_LENGTH = 10000;

/**
 * Function to gather file ids from a chat flow request
 * @param flow - The request to gather files from
 * @returns `TextInput` data object containing the files
 */
export const getFileIds = (flow: Chat.FlowRequest): string[] =>
  getFiles(flow)?.reduce((ids, group) => [...ids, ...group.ids], [] as string[]) || [];

/**
 * Function to gather files from a chat flow request
 * @param flow - The request to gather files from
 * @returns `TextInput` data object containing the files
 */
export const getFiles = (flow: Chat.FlowRequest): Chat.Files | undefined => {
  switch (flow.request_type) {
    case 'contract_answer':
      return flow.contract.data;
    case 'contract_policy_analysis':
      return flow.contracts.data;
    case 'draft_discovery_response':
      return flow.doc.data;
    case 'timeline':
    case 'review_documents':
      return flow.documents.data;
    case 'summarize':
      return flow.text.data;
    default:
      return undefined;
  }
};

/**
 * Function to gather files from chat messages
 * @param messages
 * @returns `FileHandle` object containing the files
 */
export const getFilesFromMessages = (messages: Chat.Message[]): Record<string, FileHandle> =>
  messages.reduce(
    (files, msg) => (isFilesMessage(msg) ? { ...files, ...(msg.files?.map((f) => ({ [f.id]: f })) ?? {}) } : files),
    {}
  );

/**
 * Function to gather and split flags from a chat message
 * @param message - The chat message to gather flags from
 * @returns `ChatMessageFlags` object containing the message and system flags
 */
export const getFlags = (message: Chat.Message): Chat.MessageFlags =>
  hasFlags(message)
    ? message.system_flags.reduce(
        ({ message, system }, f) =>
          ['ExecutedPreparedFlowRequest', 'InChatDrafting', 'ReferenceSkillOutput'].includes(f.name)
            ? { message: [...message, f as Chat.MessageFlag], system }
            : { message, system: [...system, f as Chat.SystemFlag] },
        { message: [], system: [] } as Chat.MessageFlags
      )
    : { message: [], system: [] };

/**
 * Function to narrow a message and ensure it has flags
 * @param message - The chat message to check for flags
 */
const hasFlags = (
  message: Chat.Message
): message is FlowMessage | TextMessage | PreparedFlowRequestMessage =>
  'system_flags' in message;

/**
 * Function to determine if a message is a files message
 * @param message - The chat message to check
 */
export const isFilesMessage = (message: Chat.Message): message is UserFilesMessage =>
  message.message_type === 'files';

/**
 * Function to determine if a message is a files message
 * @param message - The chat message to check
 */
export const isFilesUploadMessage = (message: Chat.MessageCreate): message is CreateUserFilesMessageRequest =>
  message.message_type === 'files';

/**
 * Function to determine if a message is a flow message
 * @param message - The chat message to check
 */
export const isFlowMessage = (message: Chat.Message): message is FlowMessage =>
  message.message_type === 'flow';

/**
 * Function to determine if a message is a fragment
 * @param message - The chat message to check
 */
export const isFragment = (message: Chat.Message | Chat.MessageFragment): message is Chat.MessageFragment =>
  message.message_type === 'fragment';

/**
 * Function to determine if a message is a user message
 * @param message - The chat message to check
 */
export const isUserMessage = (message: Chat.Message): message is Chat.MessageUser => message.sender === 'user';

export const isWlResearch = (input: Chat.FlowRequest): input is WLResearchRequest =>
  input.request_type === 'westlaw_research';

/**
 * Takes the markdown message and returns the cleaned message
 * @param message - The chat message to clean
 * @returns The cleaned chat message
 */
export const cleanChatMessage = (message: string): string => {
  let msg = message.replace('## message', '')
    .replace('## retrieved_urls', '#### Sources')
    .replace('## open_ticket', '')
    .replace('-False', '')
    .replace('-True', '').trim();

  if (msg.includes('#### Sources') && getTotalSourceCount(msg) <= 0) {    
    msg = msg.replace('#### Sources', '');
  }

  // parse out the product_entry suffix if it exists
  msg = removeProductEntrySuffix(msg);

  return msg;
};

export const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * If the product_entry suffix exists in the message, this function will remove it and the associated value.
 * This affects display of the chat message in the chat window.
 * @param message The message to parse
 * @returns The message without the product entry suffix
 */
export const removeProductEntrySuffix = (message: string): string => {
  if (!message.includes('/?!#$(&^product_entry:')) {
    return message;
  }

  return message.substring(0, message.indexOf('/?!#$(&^product_entry:')).trim();
}

/**
 * Evaluates the "message" parameter to determine if it contains a Salesforce message. 
 * If it does, it returns the message without the Salesforce message.
 * @param message Current chat message to evaluate.
 * @returns The chat message without the Salesforce message, if it exists.
 */
export const parseOutSalesForceMessage = (message: string): string | undefined => {
  if (!message?.includes('|Key | Value|')) return;  
  return message.substring(0, message.indexOf('|Key | Value|')).trim();  
}

/**
 * If the message contains a query prefix, this function will remove it.
 * @param message the chat message to parse
 * @returns a chat message without the query prefix
 */
export const parseOutQueryPrefix = (message: string): string => {
  return message.replace('/?!#$(&^query:', '').trim();
}

/**
 * Gets the total number of source links in a message
 * @param message - The chat message to check for source links
 * @returns The total number of source links in the message
 */
export const getTotalSourceCount = (message: string): number => {
  const sourceCount = message.match(unorderedListExpression);  
  return sourceCount ? sourceCount.length : 0;
};

/**
 * TODO: possible to replace this function with cleanChatMessage() above
 * Takes an incoming message and parses it to remove any special strings
 * @param msg A chat message to parse
 * @returns A parsed chat message
 */
export const parseMessages = (msg: string | undefined): string | undefined => {
  return msg?.replace('-False', '')
    .replace('-True', '').trim();
};
