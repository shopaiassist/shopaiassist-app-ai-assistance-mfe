import { ENDPOINTS } from 'react';
import { Chat } from '@osia/harmonia_types';
import { apiCall, apiFunction, createProxyRequest, AI_ASSISTANT_PROXY } from './api';
import { uuidv4 } from './chat';
import { getUserAuth } from './auth';
import { IFeedbackPayload, IFileUploadResponse } from './interfaces';

export interface SupportRequest {
  firm_id: string | undefined;
  product: string | undefined;
  contact_first_name: string | undefined;
  contact_last_name: string | undefined;
  contact_email: string | undefined;
  case_subject: string | undefined;
  case_description: string | undefined;
}

export interface SupportResponse {
  salesforce_ticket_code: string;
  salesforce_ticket_id: string;
}

interface DirectChat {
  chat_id: string;
  onMessage: (msg: Chat.WithChat<Chat.Message | Chat.MessageFragment>) => void;
}

export interface DirectChatMessage extends DirectChat {
  request: Chat.FormRequest | (Chat.MessageCreate & { chat_history?: { role: string, content: string | undefined }[] });
  setStreaming?: (streaming: boolean) => void;
  type: DirectChatType;
}

type DirectChatType = keyof typeof DirectChat;

// TODO: This is only for standalone demo purposes
const SAMPLE_PRODUCT_LIST = [
  'Administration',
  'Data Hub',
  'DataFlow',
  'E-Invoicing',
  'Statutory Reporting',
  'My Work',
  'Notification Rules',
  'Workflow',
  'WorkFlow Manager',
  'Workpapers',
];

export const getHeaders = (omitContentType?: boolean) => {
  const userAuth = getUserAuth();
  const shopaiassistData = sessionStorage.getItem('shopaiassist-data');
  const host_product = sessionStorage.getItem('host_product') || 'os';
  let accountType = 'External';

  try {
    accountType = JSON.parse(shopaiassistData ?? '{}')?.accountType ?? 'External';
  } catch (e) {
    console.error('Error parsing shopaiassist-data in order to get "accountType":', e);
  }

  // Need to remove the need for the conditional on the x-op-product-id value.
  // The addition of the authorization header is located in apiCall(..) in the api.ts file.
  return {
    ...(omitContentType ? {} : { 'content-type': 'application/json' }),
    'x-op-product-id': shopaiassistData
      ? encodeURI(shopaiassistData)
      : encodeURI(JSON.stringify({ product_list: SAMPLE_PRODUCT_LIST })),
    'x-host-product': host_product,
    'x-account-type': accountType,
  };
};

const INTERNAL = {
  NOTIFICATION: '/notification/{flow_id}',
} as const;

const DirectChat = {
  execute: ENDPOINTS.EXECUTE_PREPARED_FLOW_REQUEST_MESSAGE,
  message: ENDPOINTS.CREATE_USER_MESSAGE,
  ai_message: ENDPOINTS.CREATE_AI_MESSAGE,
};

interface HandleMessageParams extends DirectChat {
  response: Response;
}

// Handler for SSE messages from the chat service
const handleMessage = async ({ chat_id, onMessage, response }: HandleMessageParams) => {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder('utf-8');
  let decodedValueArray: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processText = async ({ done, value }: ReadableStreamReadResult<any>): Promise<void> => {
    if (done) return;

    let shouldExitWhileLoop = false;

    const dataStreamObjects = [];
    const decodedValue = decoder.decode(value, { stream: true }); // Ensure we are streaming the decode to handle partial data correctly
    decodedValueArray = decodedValue.split('data: ').reverse().concat(decodedValueArray);

    while (decodedValueArray.length > 0) {
      const initialSize = decodedValueArray.length;
      const content = decodedValueArray.pop() as string;

      // Remove unwanted ping messages from data stream
      const regex = /: ping - \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}/g;
      let parsedContent = content.replace(regex, '').trim();

      if (!parsedContent) {
        continue;
      }

      try {
        const dataObj = JSON.parse(parsedContent);
        dataStreamObjects.push(dataObj);
        shouldExitWhileLoop = false;
      } catch (err) {
        // If parsing fails, it means the current content is not a complete JSON object
        console.error(`ChatApi:handleMessage\nError: ${err}\nContent: ${parsedContent}`);

        if (decodedValueArray.length && !shouldExitWhileLoop) {
          // Since parsedContent is incomplete, we append the next item to it
          parsedContent += decodedValueArray.pop() as string;
          for (const data of parsedContent.split('data: ').reverse()) {
            decodedValueArray.push(data);
          }

          // Set shouldExitWhileLoop to true if decodedValueArr's size hasn't decreased
          // Then, if next iteration throws an error, we'll exit loop since no progress is being made
          shouldExitWhileLoop = decodedValueArray.length === initialSize;
        } else {
          decodedValueArray.push(parsedContent);
          break;
        }
      }
    }

    for (const dataObj of dataStreamObjects) {  
      onMessage({ chat_id, ...dataObj });
    }

    return reader.read().then(processText);
  };

  return reader.read().then(processText);
};

const allowed_skills: Chat.FlowRequestType[] = [
  'ai_assisted_legal_research',
  'ask_practical_law_ai',
  'contract_answer',
  'deposition_questions',
  'draft_correspondence',
  'review_documents',
  'summarize',
  'timeline',
];

const ChatApi = {
  cancelFlow: apiFunction(ENDPOINTS.CANCEL_FLOW_MESSAGE)(() => ({ headers: getHeaders() })),
  cancelSkill: apiFunction(
    ENDPOINTS.CANCEL_FLOW_MESSAGE,
    'POST'
  )<Chat.MessageFlow, Chat.MessageFlow>(() => ({ headers: getHeaders() })),
  create: apiFunction(ENDPOINTS.GET_CHATS, 'POST')<Chat.ListItem>(() => ({ headers: getHeaders() })),
  delete: apiFunction(ENDPOINTS.DELETE_CHAT, 'DELETE')<string>(() => ({ headers: getHeaders() })),
  documentUpload: async (file: File): Promise<IFileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${AI_ASSISTANT_PROXY}/documents/upload`;

    const response = await apiCall({ body: formData, headers: getHeaders(true), method: 'POST', url });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    const data = (await response.json()) satisfies IFileUploadResponse;
    return data;
  },
  directMessage: async ({ chat_id, onMessage, request, setStreaming, type }: DirectChatMessage) => {
    const method = 'POST';
    let params;

    if (type === 'execute') {
         params = request;
    } else {
      // Destructure the chat_history from the request object
      const { chat_history, ...userMessageData } = request as Chat.MessageCreate & { chat_history: { role: string, content: string | undefined }[] };

      // Build the params object for the 'message' type with chat_history at the top level
      params = {
        chat_history,
        allowed_skills,
        permit_prepared_flow_responses: true,
        user_message: userMessageData,
      };
    }

    const { body, url } = createProxyRequest(DirectChat[type], method, { chat_id, ...params });

    await apiCall({ body, headers: getHeaders(), method, url })
      .then(async (response) => {
        if (!response?.ok) {
          throw new Error('Response not OK');
        }
        !!setStreaming && setStreaming(true);
        await handleMessage({ chat_id, onMessage, response }).then(() => !!setStreaming && setStreaming(false));
      })
      .catch((error) => {
        throw new Error(`Error in directMessage: ${error.message}`);
      });
  },
  fetchAll: apiFunction(ENDPOINTS.GET_CHATS)<.ChatList>(() => ({ headers: getHeaders() })),
  fetchFlows: apiFunction(ENDPOINTS.GET_CHAT_FLOW_MESSAGES)<Chat.MessageFlow[]>(() => ({ headers: getHeaders() })),
  fetchMessages: apiFunction(ENDPOINTS.GET_CHAT_WITH_MESSAGES)<.GetChatMessagesResponse>(() => ({
    headers: getHeaders(),
  })),
  generateName: apiFunction(ENDPOINTS.SET_GENERATED_CHAT_NAME, 'POST')<string>(() => ({ headers: getHeaders() })),
  notificationEnable: apiFunction(
    INTERNAL.NOTIFICATION,
    'PUT'
  )<void, { chat_id: string }>(() => ({ headers: getHeaders() })),
  notificationStatus: apiFunction(INTERNAL.NOTIFICATION)<string>(() => ({ headers: getHeaders() })),
  requestCancel: apiFunction(
    ENDPOINTS.CANCEL_PREPARED_FLOW_MESSAGE,
    'POST'
  )<void, Chat.CancelRequest>(() => ({ headers: getHeaders() })),
  updateName: apiFunction(
    ENDPOINTS.UPDATE_CHAT_NAME,
    'PUT'
  )<void, .UpdateChatNameRequest>(() => ({ headers: getHeaders() })),
  /**
   * API connection for writing an AI message into the database.
   * Call "fetchMessages" to get the messages back with the new AI message.
   * @param chat_Id - The ID of the chat to which the message belongs.
   * @param message - The message content to be sent.
   * @param user_query_id - (Optional) The ID of the user_query_id to which the message belongs.  
   * @returns a promise that resolves to the created AI message object.
   */
  createAiMessage: async (chat_Id: string, message: string, user_query_id?: string) => {
    const msgBody = {
      id: user_query_id || uuidv4(),
      sent_time: new Date().toUTCString(),
      sender: 'ai',
      message_type: 'text',
      message,
    };

    const url = `${AI_ASSISTANT_PROXY}${DirectChat.ai_message.replace('{chat_id}', chat_Id)}`;
    const body = JSON.stringify(msgBody);

    const response = await apiCall({ body, headers: getHeaders(), method: 'POST', url });
    if (!response.ok) {
      throw new Error('Failed to create AI message');
    }
    const data = await response.json();
    return data as Chat.Message;
  },
  /**
   * API connection for creating a support request.
   * @param request - The support request object containing the details of the support case.
   * @returns a response object containing the Salesforce ticket code and ID.
   */
  support: async (request: SupportRequest): Promise<SupportResponse> => {
    const { body, url } = createProxyRequest('/support_case', 'POST', request);
    const response = await apiCall({ body, headers: getHeaders(), method: 'POST', url });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.detail || 'Failed to create support request');
    }
    const data = await response.json();
    return data as SupportResponse;
  },
  /**
   * API connection for fetching Salesforce products.
   * @returns a response object containing the Salesforce products.
   * @throws an error if the response is not ok.
   */
  getSalesforceProducts: async (): Promise<Response> => {
    let product_list = [];

    try {
      product_list = JSON.parse(sessionStorage.getItem('shopaiassist-data') ?? '{}')?.product_list ?? [];
    } catch (e) {
      console.error('Error parsing shopaiassist-data while attempting to get "product_list":', e);
    }

    const { body, url } = createProxyRequest('/salesforce_products', 'POST', { products: product_list });
    const response = await apiCall({ body, headers: getHeaders(), method: 'POST', url });
    if (!response.ok) {
      throw new Error('Failed to fetch Salesforce products');
    }
    return response;
  },
  /**
   * API connection for feedback submission to the Assistant API.
   * @param payload - The feedback payload containing the feedback details.
   * @returns a status code and message object.
   * @throws an error if the response is not ok.
   */
  submitFeedback: async (payload: IFeedbackPayload): Promise<Response> => {
    const { body, url } = createProxyRequest('/feedback', 'POST', payload);
    const response = await apiCall({ body, headers: getHeaders(), method: 'POST', url });
    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }
    return response;
  },
};

export default ChatApi;
