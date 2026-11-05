import { useState, useEffect } from "react";

export function useTime(refreshCycle = 1000) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Align to the next second
    const now = new Date();
    const delay = refreshCycle - (now.getTime() % refreshCycle);

    // Initial alignment timeout
    const alignmentTimeout = setTimeout(() => {
      setTime(new Date());

      // Start the interval aligned to the second
      const interval = setInterval(() => {
        setTime(new Date());
      }, refreshCycle);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(alignmentTimeout);
  }, [refreshCycle]);

  return time;
}
