import { UserAuth } from 'react;

// A simple implementation of storing the UserAuth in global (within the AiAssistant MFE) state. We could store this
// with Zustand, but it needs to be available to `chatApi.ts`, not within React components.
let userAuth: UserAuth | null = null;
export const getUserAuth = () => userAuth;
export const setUserAuth = (newUserAuth: UserAuth) => void (userAuth = newUserAuth);
