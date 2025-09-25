import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

enum ACTION_TYPES {
  FETCH_AUTHENTICATED_USER = 'user/fetchAuthenticatedUser',
}

interface UserActions {
  fetchAuthenticatedUser: () => void;
}

interface UserState {
  data: UserData | null;
  token: string | null;
}

interface UserData {
  firstName: string;
  lastName: string;
  uid: string;
}

export const useUser = create<UserState & UserActions>()(
  devtools((set) => ({
    data: null,
    token: null,

    fetchAuthenticatedUser: async () => {
      const userData: UserData = await new Promise((res) => {
        setTimeout(() => {
          res({
            firstName: 'Jim',
            lastName: 'Dan',
            uid: '0123456789',
          });
        }, 1000);
      });
      set({ data: userData }, false, ACTION_TYPES.FETCH_AUTHENTICATED_USER);
    },
  }))
);
