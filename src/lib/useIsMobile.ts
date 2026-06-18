import { useEffect, useState } from 'react';

/** Breakpoint a partir del cual la app usa el layout fluido (mobile). */
export const MOBILE_QUERY = '(max-width: 820px)';

/** Hook reactivo: true cuando el viewport es de tamaño mobile. */
export function useIsMobile(): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMatches(mq.matches);
    onChange(); // sincroniza el valor inicial
    mq.addEventListener('change', onChange);
    window.addEventListener('resize', onChange); // respaldo ante cambios de viewport
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, []);

  return matches;
}
