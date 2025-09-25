import { useEffect, useRef } from 'react';

/**
 * Utility function to keep track of the previous value of a value in a functional cmp.
 * @param value
 */
export const usePrevious = <T>(value: T) => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
