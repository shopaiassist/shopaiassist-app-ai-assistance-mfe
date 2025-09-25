export interface IFeedbackPayload {
  feedback_symbol: string;
  chat_id: string | undefined;
  user_query: string | undefined;
  ai_message: string | undefined;
  tenant_id: string;
  comments: string;
  user_query_id?: string;
  bot_resp_id?: string;
}

export interface ISalesforcePayload {
  firm_id: string | undefined;
  product: string | undefined;
  case_subject: string | undefined;
  case_description: string | undefined;
}

export interface ISalesforceTicketSubmissionResponse {
  salesforce_ticket_code: string;
  salesforce_ticket_id: string;
}

export interface IFileUploadResponse {
  document_id: string;
  filename: string;
  status: 'success' | 'failure';
  message: string;
}
