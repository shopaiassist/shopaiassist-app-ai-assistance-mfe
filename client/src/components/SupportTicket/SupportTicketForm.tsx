import './SupportTicketForm.scss';
import {
  Button,
  Icon,
  Textfield,
  Select,
  ListboxOption,
  Textarea,
  ProgressRing,
} from 'react';
import { TextAreaInstance, TextFieldInstance } from 'core-components';
import { useSupportTicket } from '../../store/supportTicket';
import { useState, useEffect, useRef, FC, useCallback } from 'react';
import { Chat } from 'react';
import { i18n } from 'react';
import { emailExpression } from '../../utils/expressions';
import { useChat } from '../../store';
import { useAssistant } from '../../Context';
import { useChatMessages } from '../../hooks/useChatMessages';
import useMFECommunication, { CustomEventData } from '../../hooks/useMFECommunication';
import { shopaiassistPendoEvent, createPendoEvent } from '../../utils/pendo';
import ChatApi, { SupportResponse } from '../../utils/chatApi';

interface IPredefinedTicketContent {
  case_subject?: string;
  case_description?: string;
  product?: string;
  firmId?: string;
  tenantId?: string;
  product_list?: Array<string>;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    id: string;
    userObjectId: string;
  };
}

type FieldValue = boolean | '' | undefined;

type IFieldValidations = {
  firmId?: FieldValue;
  email?: FieldValue;
  case_subject?: FieldValue;
  case_description?: FieldValue;
};

const CHAT_MESSAGE_MAX_LENGTH = 500;

type SupportTicketFormProps = {
  conversationId?: string;
  conversationEntryId?: string;
};

const SupportTicketForm: FC<SupportTicketFormProps> = ({ conversationId, conversationEntryId }) => {
  const { t } = i18n.useTranslation('hermes');
  const isOs = sessionStorage.getItem('host_product')?.includes('os');
  const { fetchMessages, activeChatId } = useChat();
  const { chatIdentifier, trackPendo } = useAssistant();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { currentMessage, closeSupportTicketForm } = useSupportTicket();
  const { filteredMessages } = useChatMessages(chatIdentifier ?? '');
  const [formObject, setFormObject] = useState<IPredefinedTicketContent | undefined>(undefined);
  const [salesforceProducts, setSalesforceProducts] = useState<Array<string>>([]);
  // New ref to track if products have been fetched
  const productsFetchedRef = useRef(false); 


  const firmIdRef = useRef<TextFieldInstance | null>(null);
  const emailRef = useRef<TextFieldInstance | null>(null);
  const issueSubjectRef = useRef<TextFieldInstance | null>(null);
  const issueDescriptionRef = useRef<TextAreaInstance | null>(null);

  const [fieldValidations, setFieldValidations] = useState<IFieldValidations>({
    firmId: true,
    email: true,
    case_subject: true,
    case_description: true,
  });

  const supportLink = (
    <a
      aria-label="shopaiassist support - opens in a new tab"
      href="https://www.thomsonreuters.com/en-us/help/shopaiassist-platform/administration.html"
      target="_blank"
    >
      shopaiassist support <Icon icon-name="up-right-from-square" appearance="light" presentation />
    </a>
  );

  const isValidNumericFirmId = useCallback((isOn: boolean, id?: string): boolean => {
    if (typeof id !== 'string' || id.trim() === '') {
      return false;
    }
    if (isOn) {
      return id.length >= 4;
    }
    return (
      id.length >= 1 &&
      id.length <= 9 &&
      [...id].every(char => char >= '0' && char <= '9')
    );
  }, []);

  // Effect to fetch salesforce products ONLY ONCE on component mount
  useEffect(() => {
    // Only proceed if products haven't been fetched yet
    if (productsFetchedRef.current) {
      return; 
    }
    const fetchProducts = async () => {
      try {
        const response = await ChatApi.getSalesforceProducts();
        const data = await response.json();
        setSalesforceProducts(data.salesforce_products || []);
        productsFetchedRef.current = true; // Mark as fetched
      } catch (err) {
        console.error('Error getting product list from SalesForce.', err);
        setSalesforceProducts([]);
      }
    };
    fetchProducts();
  }, []);

  const preloadForm = useCallback(async (msgObj: Chat.Message, products: Array<string>): Promise<IPredefinedTicketContent | undefined> => {
    const sessionObj = JSON.parse(sessionStorage.getItem('shopaiassist-data') ?? '{}');
    
    const predefinedTicketContent: IPredefinedTicketContent = {};
    let openTicketContentArr: Array<string> = [];
    let openTicketContent: string | undefined = msgObj.message?.substring(msgObj.message?.indexOf('## open_ticket'));

    if (openTicketContent) {
      openTicketContent = openTicketContent.substring(openTicketContent.indexOf('case_subject'));
      openTicketContentArr = openTicketContent?.split('|');

      openTicketContentArr.forEach((item: string, idx: number) => {
        if (item === '\n' || item === '') {
          openTicketContentArr.splice(idx, 1);
        }
      });

      openTicketContentArr.forEach((item: string, idx: number) => {
        if (item.trim() === 'case_subject') {
          predefinedTicketContent.case_subject = openTicketContentArr[idx + 1];

          if (predefinedTicketContent.case_subject === '\n') {
            predefinedTicketContent.case_subject = '';
          }
        }

        if (item.trim() === 'case_description') {
          predefinedTicketContent.case_description = openTicketContentArr[idx + 1];

          if (predefinedTicketContent.case_description === '\n') {
            predefinedTicketContent.case_description = '';
          }
        }

        if (item.trim() === 'product') {
          predefinedTicketContent.product = openTicketContentArr[idx + 1];
        }
      });

      const formObj = {
        ...sessionObj,
        ...predefinedTicketContent,
      };

      formObj.product_list = products;

      // evaluate firmId length to determine if it is a PAN ID, SAP account number or tenant id
      if (isValidNumericFirmId(!!isOn, sessionObj.firmId)) {
        formObj.firmId = sessionObj.firmId;
      } else {
        formObj.firmId = '';
      }

      return formObj;
    }

    return undefined;
  }, [isValidNumericFirmId, isOn]);

  // Effect to preload form data when currentMessage or salesforceProducts changes
  useEffect(() => {
    if (salesforceProducts.length > 0) { // Only run if products are loaded
      preloadForm(currentMessage, salesforceProducts)
        .then((formObj) => {
          setFormObject(formObj);
        })
        .catch((err) => {
          console.error(`Error preloading form.`, err);
        });
    }
  }, [currentMessage, preloadForm, salesforceProducts]); // Add salesforceProducts as a dependency

  const sendForm = async () => {
    if (!validateFields()) {
      return;
    }

    trackPendo?.(
      createPendoEvent({
        name: shopaiassistPendoEvent.CreateSupportTicket,
        data: {
          firmId: formObject?.firmId ?? '',
          product: formObject?.product ?? '',
          conversationId: conversationId ?? '',
          caseSubject: formObject?.case_subject ?? '',
          conversationEntryId: conversationEntryId ?? '',
          caseDescription: formObject?.case_description ?? '',
        },
      })
    );

    setIsSubmitting(true);

    const payload = {
      "firm_id": formObject?.firmId,
      "product": formObject?.product,
      "contact_first_name": formObject?.user?.firstName,
      "contact_last_name": formObject?.user?.lastName ?? '.',
      "contact_email": formObject?.user?.email,
      "case_subject": formObject?.case_subject,
      "case_description": formObject?.case_description,
      "chat_id": activeChatId,
      "bot_resp_id": filteredMessages.at(-1)?.id,
      "user_query_id": filteredMessages.at(-2)?.id,
    }

    try {
      // send the support ticket request to the API
      const response: SupportResponse = await ChatApi.support(payload);

      if (response?.salesforce_ticket_code) {
        // create an artifical message in the chat with the ticket code
        const res = await ChatApi.createAiMessage(activeChatId ?? "",
          `Your ticket was successfully created. Here is your case number: ${response?.salesforce_ticket_id}. A support expert will contact you soon.`,
          filteredMessages.at(-2)?.id)

        if (res) {
          // get new list of chats that include the new AI message that was saved to the DB
          await fetchMessages(activeChatId ?? "");
        }
      }
    } catch (err) {
      console.error('Error creating support ticket.', err);
    }

    closeSupportTicketForm();
    setIsSubmitting(false);
    setFormObject(undefined);
  };

  const constructPayload = (value: string, key: unknown) => {
    const formObj = { ...formObject };

    if (key === 'product') {
      formObj.product = value;
    }

    if (key === 'firmId') {
      formObj.firmId = value;
    }

    if (formObj.user && key === 'email') {
      formObj.user.email = value;
    }

    if (key === 'case_subject') {
      formObj.case_subject = value;
    }

    if (key === 'case_description') {
      formObj.case_description = value;
    }

    setFormObject(formObj);
  };

  const validateFields = (): boolean => {
    const validations = [];

    validations[0] = isValidNumericFirmId(!!isOn, formObject?.firmId);
    validations[1] = !!(
      formObject?.user?.email &&
      formObject?.user?.email !== '' &&
      !!formObject?.user?.email.match(emailExpression)
    );
    validations[2] = !!(formObject?.case_subject && formObject?.case_subject !== '');
    validations[3] = !!(formObject?.case_description && formObject?.case_description !== '');

    setFieldValidations({
      firmId: validations[0],
      email: validations[1],
      case_subject: validations[2],
      case_description: validations[3],
    });

    return validations[0] && validations[1] && validations[2] && validations[3];
  };

  const [isCompactMode, setIsCompactMode] = useState(true);

  useMFECommunication('modal-type', (data: CustomEventData) => {
    setIsCompactMode(data.body === 'compact');
  });

  return (
    <div className="support-ticket-container" style={{ width: isCompactMode ? 'auto' : '95%' }}>
      <div className="st-header">
        <div className="st-header-title">
          <h3 aria-label={t('SUPPORT_TICKET.BUTTON_TITLE')}>{t('SUPPORT_TICKET.BUTTON_TITLE')}</h3>
          <div className="st-header-close">
            <Button
              appearance="tertiary"
              density="standard"
              aria-label={t('SUPPORT_TICKET.CLOSE_SUPPORT_TICKET')}
              onClick={() => closeSupportTicketForm()}
            >
              {t('SUPPORT_TICKET.CLOSE_BUTTON')}
              <Icon icon-name="close" slot="start" appearance="light" presentation></Icon>
            </Button>
          </div>
        </div>
        <div className="st-keys">
          <div className="key">* {t('SUPPORT_TICKET.KEYS.REQUIRED_FIELDS')}</div>
          <div className="key">
            <Icon
              icon-name="sparkles"
              className="icon-special icon-key"
              appearance="solid"
              aria-hidden="false"
              role="img"
              aria-label="AI symbol"
            />
            {t('SUPPORT_TICKET.KEYS.AI_GENERATED_CONTENT')}
          </div>
        </div>
      </div>
      <div className="st-body">
        <div className="content">
          <fieldset>
            <legend>{t('SUPPORT_TICKET.FORM.TICKET_INFORMATION')}</legend>

            <div className="data-field-full">
              <Textfield
                className="text-field"
                type="text"
                id="product-segment"
                name="product-segment"
                label={t('SUPPORT_TICKET.FORM.PRODUCT_SEGMENT')}
                aria-label={t('SUPPORT_TICKET.FORM.PRODUCT_SEGMENT')}
                required={false}
                readOnly={true}
                inputMode="text"
                value="shopaiassist"
                density="inherit"
              ></Textfield>
            </div>

            <div className="data-field-full">
              <Select
                id="product-name"
                label={t('SUPPORT_TICKET.FORM.PRODUCT_NAME')}
                aria-label={t('SUPPORT_TICKET.FORM.PRODUCT_NAME')}
                disabled={isSubmitting}
                required={true}
                validationMessage={t('SUPPORT_TICKET.VALIDATION_MESSAGES.PRODUCT_NAME')}
                onChange={(e) => constructPayload(e.target.value, 'product')}
                value={formObject?.product}
              >
                {salesforceProducts?.map((prod: string, idx: number) => (
                  <ListboxOption key={idx} value={prod}>
                    {prod}
                  </ListboxOption>
                ))}
              </Select>
            </div>

            <div className="data-field-full">
              {isOn ? (
                <>
                  <Textfield
                    ref={firmIdRef}
                    className="text-field"
                    type="text"
                    id="pan-sap-account-number"
                    name="pan-sap-account-number"
                    label={t('SUPPORT_TICKET.FORM.PAN_ID')}
                    aria-label={t('SUPPORT_TICKET.FORM.PAN_ID')}
                    required={true}
                    autocomplete="off"
                    disabled={isSubmitting}
                    minlength={4}
                    invalid={!fieldValidations.firmId}
                    validationMessage={t('SUPPORT_TICKET.VALIDATION_MESSAGES.PAN_ID')}
                    value={formObject?.firmId}
                    onChange={(e) => constructPayload(e.target.value, 'firmId')}
                    a11yAriaDescription={t('SUPPORT_TICKET.FORM.PAN_ID_INSTRUCTIONAL_ADMINISTRATOR')}
                    density="inherit"
                  ></Textfield>
                  <div className="alternative-instructional-text">
                    {t('SUPPORT_TICKET.FORM.PAN_ID_INSTRUCTIONAL')} {supportLink}.
                  </div>
                </>
              ) : (
                <Textfield
                  ref={firmIdRef}
                  className="text-field"
                  type="text"
                  id="pan-sap-account-number"
                  name="pan-sap-account-number"
                  label={t('SUPPORT_TICKET.FORM.PAN_ID')}
                  aria-label={t('SUPPORT_TICKET.FORM.PAN_ID')}
                  required={true}
                  autocomplete="off"
                  readOnly={!!formObject?.firmId}
                  disabled={isSubmitting}
                  minlength={1}
                  maxlength={9}
                  invalid={!fieldValidations.firmId}
                  validationMessage={t('SUPPORT_TICKET.VALIDATION_MESSAGES.GTM_PAN_ID')}
                  value={formObject?.firmId}
                  onChange={(e) => constructPayload(e.target.value, 'firmId')}
                  a11yAriaDescription={t('SUPPORT_TICKET.FORM.PAN_ID_INSTRUCTIONAL_ADMINISTRATOR')}
                  density="inherit"
                ></Textfield>
              )}
            </div>

            <div className="data-field-full">
              <Textfield
                ref={emailRef}
                className="text-field"
                type="email"
                id="email"
                name="email"
                label={t('SUPPORT_TICKET.FORM.EMAIL')}
                aria-label={t('SUPPORT_TICKET.FORM.EMAIL')}
                required={true}
                readOnly={false}
                disabled={isSubmitting}
                invalid={!fieldValidations.email}
                autocomplete="off"
                inputMode="email"
                validationMessage={t('SUPPORT_TICKET.VALIDATION_MESSAGES.EMAIL')}
                value={formObject?.user?.email}
                onChange={(e) => constructPayload(e.target.value, 'email')}
                density="inherit"
              ></Textfield>
            </div>

            <div className="data-field-full">
              <Textfield
                ref={issueSubjectRef}
                className="text-field issue-subject"
                type="text"
                id="issue-subject"
                name="issue-subject"
                label={t('SUPPORT_TICKET.FORM.ISSUE_SUBJECT')}
                aria-label={t('SUPPORT_TICKET.FORM.ISSUE_SUBJECT')}
                required={true}
                validationMessage={t('SUPPORT_TICKET.VALIDATION_MESSAGES.ISSUE_SUBJECT')}
                value={formObject?.case_subject}
                disabled={isSubmitting}
                invalid={!fieldValidations.case_subject}
                onChange={(e) => constructPayload(e.target.value, 'case_subject')}
                inputMode="text"
                density="inherit"
              >
                <Icon
                  icon-name="sparkles"
                  className="icon-special"
                  appearance="solid"
                  slot="start"
                  presentation
                ></Icon>
              </Textfield>
            </div>

            <div className="data-field-full">
              <Textarea
                ref={issueDescriptionRef}
                maxlength={CHAT_MESSAGE_MAX_LENGTH}
                className="text-field"
                id="issue-description"
                name="issue-description"
                label={t('SUPPORT_TICKET.FORM.ISSUE_DESCRIPTION')}
                aria-label={t('SUPPORT_TICKET.FORM.ISSUE_DESCRIPTION')}
                required={true}
                rows={4}
                disabled={isSubmitting}
                invalid={!fieldValidations.case_description}
                validationMessage={t('SUPPORT_TICKET.VALIDATION_MESSAGES.ISSUE_DESCRIPTION')}
                inputMode="text"
                value={formObject?.case_description}
                onChange={(e) => constructPayload(e.target.value, 'case_description')}
                density="inherit"
              ></Textarea>
            </div>
          </fieldset>
        </div>
        <div className="st-footer">
          <Button
            data-testid="Cancel-Create-ticket"
            appearance="secondary"
            disabled={isSubmitting}
            onClick={() => closeSupportTicketForm()}
          >
            {t('SUPPORT_TICKET.CANCEL_BUTTON')}
          </Button>
          <Button data-testid="Submit-Create-ticket" appearance="primary" disabled={isSubmitting} onClick={sendForm}>
            {t('SUPPORT_TICKET.CREATE_TICKET')}
            {isSubmitting && (
              <ProgressRing className="loading-icon" slot="start" indeterminate={true} progressSize="small" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketForm;