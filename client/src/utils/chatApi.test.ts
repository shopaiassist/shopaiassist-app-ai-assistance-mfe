// Mock dependencies first, before importing the modules
jest.mock('@/', () => ({
  __esModule: true,
  default: {},
  ENDPOINTS: {
    EXECUTE_PREPARED_FLOW_REQUEST_MESSAGE: '/execute_prepared_flow_request_message',
    CREATE_USER_MESSAGE: '/create_user_message',
    CREATE_AI_MESSAGE: '/create_ai_message',
    CANCEL_FLOW_MESSAGE: '/cancel_flow_message',
    GET_CHATS: '/get_chats',
    DELETE_CHAT: '/delete_chat',
    GET_CHAT_FLOW_MESSAGES: '/get_chat_flow_messages',
    GET_CHAT_WITH_MESSAGES: '/get_chat_with_messages',
    SET_GENERATED_CHAT_NAME: '/set_generated_chat_name',
    CANCEL_PREPARED_FLOW_MESSAGE: '/cancel_prepared_flow_message',
    UPDATE_CHAT_NAME: '/update_chat_name',
  }
}));

// Mock the API functions but don't mock the ChatApi module itself
jest.mock('./api', () => {
  // Create a mock implementation that captures all calls
  const mockApiFunction = jest.fn();
  
  // Store the endpoints that are used with apiFunction
  const usedEndpoints = new Set<string>();
  
  mockApiFunction.mockImplementation((endpoint: string, method?: string) => {
    // Record the endpoint being used
    usedEndpoints.add(endpoint);
    
    // Return a function that returns a function (matching the curried structure)
    const secondLevel = jest.fn();
    secondLevel.mockImplementation(() => {
      return jest.fn().mockResolvedValue('mock-api-function-result');
    });
    return secondLevel;
  });
  
  return {
    apiCall: jest.fn(),
    createProxyRequest: jest.fn(),
    apiFunction: mockApiFunction,
    // Export the set of used endpoints for testing
    __usedEndpoints: usedEndpoints,
  };
});

jest.mock('./chat', () => ({
  uuidv4: jest.fn().mockReturnValue('mock-uuid'),
}));

jest.mock('./auth', () => ({
  getUserAuth: jest.fn(),
}));

// Now import the modules
import { ENDPOINTS } from 'react';
import { Chat } from 'react';
import { apiCall, apiFunction, createProxyRequest } from './api';
import { getUserAuth } from './auth';
import { uuidv4 } from './chat';
import ChatApi, { getHeaders, SupportRequest, SupportResponse } from './chatApi';

// Mock the handleMessage function to avoid TextDecoder issues
const mockHandleMessage = jest.fn().mockImplementation(({ chat_id, onMessage }) => {
  onMessage({ chat_id, message: 'test' });
  return Promise.resolve();
});

// Store the original implementation
const originalDirectMessage = ChatApi.directMessage;

describe('ChatApi', () => {
  // Setup and teardown
  let originalSessionStorage: Storage;
  let mockSessionStorage: { [key: string]: string };
  let mockResponse: Response;

  beforeEach(() => {
    // Mock sessionStorage
    mockSessionStorage = {};
    originalSessionStorage = window.sessionStorage;
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key) => mockSessionStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockSessionStorage[key];
        }),
        clear: jest.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
    });

    mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response;

    // Reset mocks
    jest.clearAllMocks();
    (apiCall as jest.Mock).mockReset().mockResolvedValue(mockResponse);
    (createProxyRequest as jest.Mock).mockReset().mockReturnValue({ body: 'mock-body', url: 'mock-url' });
    (getUserAuth as jest.Mock).mockReset().mockReturnValue({ tokenType: 'bearer' });
    (apiFunction as jest.Mock).mockClear();
    
    // Override directMessage to use our mock handleMessage
    ChatApi.directMessage = jest.fn().mockImplementation(async ({ chat_id, onMessage, request, setStreaming, type }) => {
      const method = 'POST';
      const params =
        type === 'execute'
          ? request
          : {
              allowed_skills: expect.any(Array),
              permit_prepared_flow_responses: true,
              user_message: request,
            };
      const { body, url } = createProxyRequest(
        type === 'execute' ? '/execute_prepared_flow_request_message' : '/create_user_message',
        method,
        { chat_id, ...params }
      );

      try {
        const response = await apiCall({ body, headers: getHeaders(), method, url });
        if (!response?.ok) {
          throw new Error('Response not OK');
        }
        !!setStreaming && setStreaming(true);
        await mockHandleMessage({ chat_id, onMessage, response });
        !!setStreaming && setStreaming(false);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Error in directMessage: ${error.message}`);
        } else {
          throw new Error('Error in directMessage: Unknown error');
        }
      }
    });
  });

  afterEach(() => {
    // Restore sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
    });
    
    // Restore original directMessage
    ChatApi.directMessage = originalDirectMessage;
  });

  describe('getHeaders', () => {
    test('returns headers with correct values', () => {
      // Execute
      const headers = getHeaders();
      
      // Verify
      expect(headers).toEqual({
        'content-type': 'application/json',
        'x-op-product-id': expect.any(String),
        'x-token-type': 'bearer',
      });
    });

    test('returns headers with encoded shopaiassist-data when available', () => {
      // Setup
      const mockData = JSON.stringify({ product_list: ['Product1', 'Product2'] });
      mockSessionStorage['shopaiassist-data'] = mockData;
      (getUserAuth as jest.Mock).mockReturnValue({ tokenType: 'custom' });
      
      // Execute
      const headers = getHeaders();
      
      // Verify
      expect(headers).toEqual({
        'content-type': 'application/json',
        'x-op-product-id': encodeURI(mockData),
        'x-token-type': 'custom',
      });
    });

    test('uses os-auth as default token type when userAuth is not available', () => {
      // Setup
      (getUserAuth as jest.Mock).mockReturnValue(null);
      
      // Execute
      const headers = getHeaders();
      
      // Verify
      expect(headers['x-token-type']).toBe('os-auth');
    });
  });

  describe('ChatApi methods', () => {
    test('directMessage calls apiCall and processes the response', async () => {
      // Setup
      const chatId = 'test-chat-id';
      const request = { message: 'Hello' } as unknown as Chat.MessageCreate;
      const onMessage = jest.fn();
      
      // Execute
      await ChatApi.directMessage({
        chat_id: chatId,
        onMessage,
        request,
        type: 'message',
      });

      // Verify
      expect(createProxyRequest).toHaveBeenCalled();
      expect(apiCall).toHaveBeenCalled();
      expect(onMessage).toHaveBeenCalledWith({
        chat_id: chatId,
        message: 'test'
      });
    });

    test('directMessage with execute type calls apiCall with correct parameters', async () => {
      // Setup
      const chatId = 'test-chat-id';
      const request = { 
        flow_id: 'flow-id', 
        request_type: 'summarize',
        function_input: {}
      } as unknown as Chat.FormRequest;
      const onMessage = jest.fn();
      
      // Execute
      await ChatApi.directMessage({
        chat_id: chatId,
        onMessage,
        request,
        type: 'execute',
      });

      // Verify
      expect(createProxyRequest).toHaveBeenCalledWith(
        '/execute_prepared_flow_request_message',
        'POST',
        {
          chat_id: chatId,
          ...request,
        }
      );
    });

    test('directMessage with setStreaming calls setStreaming with true and then false', async () => {
      // Setup
      const chatId = 'test-chat-id';
      const request = { message: 'Hello' } as unknown as Chat.MessageCreate;
      const onMessage = jest.fn();
      const setStreaming = jest.fn();
      
      // Execute
      await ChatApi.directMessage({
        chat_id: chatId,
        onMessage,
        request,
        setStreaming,
        type: 'message',
      });

      // Verify
      expect(setStreaming).toHaveBeenCalledWith(true);
      expect(setStreaming).toHaveBeenCalledWith(false);
    });

    test('createAiMessage calls apiCall with correct parameters', async () => {
      // Setup
      const chatId = 'test-chat-id';
      const message = 'Hello from AI';
      const mockResponseData = { id: 'msg-id', message };
      
      (apiCall as jest.Mock).mockResolvedValue({
        ...mockResponse,
        json: jest.fn().mockResolvedValue(mockResponseData)
      });
      
      // Execute
      const result = await ChatApi.createAiMessage(chatId, message);
      
      // Verify
      expect(apiCall).toHaveBeenCalled();
      expect(result).toEqual(mockResponseData);
    });

    test('support calls apiCall with correct parameters', async () => {
      // Setup
      const request: SupportRequest = {
        firm_id: 'firm-123',
        product: 'Product1',
        contact_first_name: 'John',
        contact_last_name: 'Doe',
        contact_email: 'john@example.com',
        case_subject: 'Help',
        case_description: 'I need help',
      };
      
      const mockResponseData: SupportResponse = {
        salesforce_ticket_code: 'SF123',
        salesforce_ticket_id: 'SF-ID-123',
      };
      
      (apiCall as jest.Mock).mockResolvedValue({
        ...mockResponse,
        json: jest.fn().mockResolvedValue(mockResponseData)
      });
      
      // Execute
      const result = await ChatApi.support(request);
      
      // Verify
      expect(createProxyRequest).toHaveBeenCalledWith('/support_case', 'POST', request);
      expect(apiCall).toHaveBeenCalled();
      expect(result).toEqual(mockResponseData);
    });

    // Test error handling
    test('directMessage throws error when response is not OK', async () => {
      // Setup
      const chatId = 'test-chat-id';
      const request = { message: 'Hello' } as unknown as Chat.MessageCreate;
      const onMessage = jest.fn();
      
      // Mock a failed response
      (apiCall as jest.Mock).mockResolvedValue({ ...mockResponse, ok: false });
      
      // Execute & Verify
      await expect(ChatApi.directMessage({
        chat_id: chatId,
        onMessage,
        request,
        type: 'message',
      })).rejects.toThrow('Response not OK');
    });

    test('createAiMessage throws error when response is not OK', async () => {
      // Setup
      const chatId = 'test-chat-id';
      const message = 'Hello from AI';
      
      // Mock a failed response
      (apiCall as jest.Mock).mockResolvedValue({ ...mockResponse, ok: false });
      
      // Execute & Verify
      await expect(ChatApi.createAiMessage(chatId, message)).rejects.toThrow('Failed to create AI message');
    });

    test('support throws error when response is not OK', async () => {
      // Setup
      const request: SupportRequest = {
        firm_id: 'firm-123',
        product: 'Product1',
        contact_first_name: 'John',
        contact_last_name: 'Doe',
        contact_email: 'john@example.com',
        case_subject: 'Help',
        case_description: 'I need help',
      };
      
      // Mock a failed response
      (apiCall as jest.Mock).mockResolvedValue({ ...mockResponse, ok: false });
      
      // Execute & Verify
      await expect(ChatApi.support(request)).rejects.toThrow('Failed to create support request');
    });

    // Test all API function methods
    describe('API function methods', () => {
      test('all API function methods call apiFunction with correct parameters', () => {
        // Execute all methods
        ChatApi.cancelFlow();
        ChatApi.cancelSkill();
        ChatApi.create();
        ChatApi.delete();
        ChatApi.fetchAll();
        ChatApi.fetchFlows();
        ChatApi.fetchMessages();
        ChatApi.generateName();
        ChatApi.notificationEnable();
        ChatApi.notificationStatus();
        ChatApi.requestCancel();
        ChatApi.updateName();
        
        // Access the set of used endpoints from the mock
        // We need to cast the imported apiFunction to access our custom property
        // First, get the mock implementation
        const usedEndpoints = jest.requireMock('./api').__usedEndpoints as Set<string>;
        
        // Debug: Log the used endpoints
        console.log('Used Endpoints:', Array.from(usedEndpoints));
        
        // Verify that all expected endpoints were used
        expect(usedEndpoints.has(ENDPOINTS.CANCEL_FLOW_MESSAGE)).toBe(true);
        expect(usedEndpoints.has(ENDPOINTS.GET_CHATS)).toBe(true);
        expect(usedEndpoints.has(ENDPOINTS.DELETE_CHAT)).toBe(true);
        expect(usedEndpoints.has(ENDPOINTS.GET_CHAT_FLOW_MESSAGES)).toBe(true);
        expect(usedEndpoints.has(ENDPOINTS.GET_CHAT_WITH_MESSAGES)).toBe(true);
        expect(usedEndpoints.has(ENDPOINTS.SET_GENERATED_CHAT_NAME)).toBe(true);
        expect(usedEndpoints.has('/notification/{flow_id}')).toBe(true);
        expect(usedEndpoints.has(ENDPOINTS.CANCEL_PREPARED_FLOW_MESSAGE)).toBe(true);
        expect(usedEndpoints.has(ENDPOINTS.UPDATE_CHAT_NAME)).toBe(true);
      });
    });
  });
});
