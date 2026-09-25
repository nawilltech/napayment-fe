import { useEffect, useState } from 'react';

/** Re-renders every `ms` while `active` - for countdowns. */
export function useNow(active = true, ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}
