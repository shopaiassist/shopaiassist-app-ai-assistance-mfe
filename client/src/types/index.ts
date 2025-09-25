import * as React from 'react';
import {
  Chat,
  DatabaseInfo,
  DomComponent,
  DomComponentFactory,
  FileHandle,
  WithMfeContext,
} from 'react';
import { PendoEvent } from '../utils/pendo';

export interface CancelFlowRequest {
  flow_id: string;
}

interface MessageOptions {
  /** Action to handle canceling skills that are in progress */
  cancelFlow?: (request: CancelFlowRequest) => void;
  /** Handler for canceling a form request */
  cancelRequest?: (request: Chat.CancelRequest) => void;
  /** Handler for executing a form request */
  executeRequest?: (request: Chat.FormRequest) => void;
  /** Whether the request message should transition in */
  initialRequest?: boolean;
}

export type PanelSize = 'full' | 'half' | 'none';

interface ResultPanel {
  content: DomComponent;
  desiredSize?: PanelSize;
}

interface FileProvider {
  /** Handler for files sent to the assistant */
  onFilesSelected: (selection: FileHandle[]) => void;
}

interface DatabaseProvider {
  /** Handler for database information sent to the assistant */
  onDatabaseSelected: (dbInfo: DatabaseInfo) => void;
}

interface SkillProvider {
  /** Handler for skill information sent to the assistant */
  onSkillSelected: (skill: string) => void;
}

interface WelcomeProvider {
  /** Handler to initiate a skill message */
  onInitiateSkill: (initiateMessage: string, skillId?: string) => void;
}

type AllowedSkills = Chat.FlowRequestType;

interface AiAssistantMessages {
  /** A factory function to return the inline progress/result component for a skill run */
  skill: (
    message: Chat.MessageFlow | Chat.MessageRequest | React.AiTextMessage,
    opts?: MessageOptions
  ) => DomComponent;
  /**
   * A factory function provided to 'new mode' chats (those with no `chatIdentifier`) to return a component to be shown
   * in new chats, allowing the user to pick from a handful of frequently used skills.
   *
   * If the user makes a selection, the `onInitiateSkill` callback function--provided by this AiAssistant component--
   * will be called. Parameters passed to the callback will indicate the message that should be sent; the explicit
   * skill will also be included, if applicable.
   */
  welcome?: DomComponentFactory<WelcomeProvider>;
}

/**
 * The AI Assistance component props.
 * These should be used for MFE component configuration (passed in by shell app).
 */
export interface AiAssistantContentProps {
  /** Display chat in table form instead of messages */
  displayTable?: boolean;
  /** Message components to render within a chat */
  messages: AiAssistantMessages;
  /** Describes a chat as read-only to hide the chat input and prevent additional messages */
  readOnly?: boolean;
  /** A factory function to return panel content */
  resultPanel?: ResultPanel;
}

export type AiAssistantBaseProps = {
  /** Configuration of optional (button) components to render under the input text field. */
  actions?: ChatInputActions;
  /** the skills licensed/authorized for this user */
  allowedSkills: AllowedSkills[];
  /** identifier of the chat */
  chatIdentifier?: string;
  /**
   * Function called by this component when new chat needs to be created.
   *
   * This will override the default behavior of creating a new chat.
   */
  createNewChat?: () => Promise<string>;
  trackPendo?: (pendoEvent: PendoEvent) => void;
};

interface ChatInputActions {
  /** An optional factory function to create the Upload button, for adding files to the conversation. */
  createFileAction?: DomComponentFactory<DatabaseProvider & FileProvider>;

  /**
   * An optional factory function to create the 'shopaiassist Skills' button, used to explicitly run a specific skill.
   * When the user selects a skill to run, the event callback (passed to the factory function) must be called to notify
   * the Assistance MFE.
   */
  createSkillAction?: DomComponentFactory<SkillProvider>;
}

export type AiAssistantProps = WithMfeContext<AiAssistantBaseProps & AiAssistantContentProps>;
export type AiChatInputProps = WithMfeContext<AiAssistantBaseProps>;
