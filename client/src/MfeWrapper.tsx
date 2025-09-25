import { useEffect } from 'react';
import { MfeContext } from 'react';
import { i18n } from 'react';

import { CtxMfe } from './Context';
import { setUserAuth } from './utils/auth';
import en from './utils/locales/en';
i18n.init({ en });

interface MfeWrapperProps {
  children: React.ReactNode;
  context: MfeContext;
}

/** MFE wrapper */
const MfeWrapper = ({ children, context }: MfeWrapperProps) => {
  useEffect(() => void context?.getAuthToken().then(setUserAuth), [context]);

  return (
    <CtxMfe.Provider value={context}>
      <i18n.Provider i18n={i18n.instance}>{children}</i18n.Provider>
    </CtxMfe.Provider>
  );
};

// important to have default export for microfrontend to work with module federation!!
// The module being exposed in webpack.config.ts is the default export
export default MfeWrapper;
