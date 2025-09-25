import { useRef, useEffect } from 'react';

/**
 * A hook to handle scrolling to a ref, for example to the bottom of the chat
 * @param content - Any kind of of content that should trigger a scroll when it changes
 * @param shouldScroll - A boolean that should trigger a scroll when true
 * @returns`scrollRef`
 */
export const useScrollTo = <T>(content: T, shouldScroll: boolean) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // scroll to ref when content changes
  useEffect(() => scrollToRef(), [content]);

  // scroll to ref when shouldScroll is true
  useEffect(() => void (shouldScroll && scrollToRef()), [shouldScroll]);

  /** Scrolls to the bottom of the chat */
  const scrollToRef = () => scrollRef.current?.scrollIntoView(false);

  return { scrollRef };
};
