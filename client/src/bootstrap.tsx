import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MfeContext, UserAuth } from 'react';
import { Button, Icon } from 'react';

import AiAssistant from './AiAssistant';
import { AiAssistantProps } from './types';

/**
 * This is the entry point for the React App. It is the only file that should be imported by the index.ts file.
 * This was the only way around the issue of
 * Uncaught Error: Shared module is not available for eager consumption: webpack/sharing/consume/default/react/react
 */
const container = document.getElementById('ai-assistance');
const root = createRoot(container!);

/** Props passed in to the exposed App component to mimic shell app behavior */
const props: AiAssistantProps = {
  // actions: {
  //   createFileAction: () => (
  //     <Button appearance="tertiary" density="compact" onClick={() => console.log('TODO: handle files')}>
  //       <Icon aria-hidden="true" icon-name="arrow-up-from-bracket" role="presentation" slot="start" />
  //       Upload
  //     </Button>
  //   ),
  //   createSkillAction: () => (
  //     <Button appearance="tertiary" density="compact" onClick={() => console.log('TODO: handle skill')}>
  //       <Icon aria-hidden="true" icon-name="sparkles" role="presentation" slot="start" />
  //       shopaiassist skills
  //     </Button>
  //   ),
  // },
  allowedSkills: [],
  context: {
    user: {
      firstName: 'Jim',
      lastName: 'Dan',
    },
    getAuthToken: async () => {
      const Data = sessionStorage.getItem('data');
      return {
        bearerToken: process.env.AUTH_TOKEN || 'test-token',
        tokenType: 'os-auth',
        productId: Data ? encodeURI(Data) : JSON.stringify({ product_list: [] }),
      } as unknown as UserAuth;
    },
    permissions: {},
    locale: 'en-US',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    utilities: {} as any,
  } as MfeContext,
  messages: {
    skill: (props) => (
      // Emulate the SkillChatMessage component that will be provided externally
      <div className="external">
        {`An external component will provide the progress or results:\n${JSON.stringify(props)}`}
      </div>
    ),
    welcome: ({ onInitiateSkill }) => (
      // Emulate the SkillsSummary component that will be provided externally
      <div className="external">
        <button onClick={() => onInitiateSkill('I want to run summarize.', 'summarize')}>Summarize</button>
        <button onClick={() => onInitiateSkill('I want to run doc review.', 'doc_review')}>Doc Review</button>
        <button onClick={() => onInitiateSkill('What else can you do?')}>What else can you do?</button>
      </div>
    ),
  },
};

root.render(
  <StrictMode>
    <BrowserRouter>
      <AiAssistant {...props} />
    </BrowserRouter>
  </StrictMode>
);
