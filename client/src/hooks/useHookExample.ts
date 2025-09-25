import { useEffect, useState } from 'react';

/**
 * Hook example
 */
const useHookExample = (): [boolean] => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

  return [isMounted];
};

export default useHookExample;
