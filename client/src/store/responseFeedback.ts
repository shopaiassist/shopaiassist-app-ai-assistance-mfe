import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ResponseFeedbackActions {
  setIsSubmitted: (isSubmitted: boolean) => void;
}

interface ResponseFeedbackState {
  isSubmitted: boolean | undefined;
}

export const useResponseFeedback = create<ResponseFeedbackState & ResponseFeedbackActions>()(
  devtools((set) => ({
    isSubmitted: undefined,
    setIsSubmitted: (isSubmitted: boolean) => set({ isSubmitted })
  }))
);
