'use client';

import { useEffect } from 'react';

/**
 * ThemeScript Component
 * Applica il tema salvato immediatamente al mount senza causare hydration errors
 * Deve essere incluso in ClientProviders per eseguire client-side
 */
export default function ThemeScript() {
  useEffect(() => {
    // Applica tema salvato
    try {
      const savedTheme = localStorage.getItem('pannello-stufa-theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // Ignora errori localStorage
    }
  }, []);

  // Componente invisibile, solo per side effect
  return null;
}
