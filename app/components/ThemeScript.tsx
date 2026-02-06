'use client';

import { useEffect } from 'react';

/**
 * ThemeScript Component
 * Applica il tema salvato immediatamente al mount senza causare hydration errors
 * Deve essere incluso in ClientProviders per eseguire client-side
 */
export default function ThemeScript() {
  useEffect(() => {
    // Applica tema salvato con smooth transition
    try {
      const savedTheme = localStorage.getItem('pannello-stufa-theme');
      const html = document.documentElement;

      // Add transition for smooth theme change
      html.style.transition = 'background-color 0.3s ease, color 0.3s ease';

      if (savedTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      // Remove transition after animation completes
      setTimeout(() => {
        html.style.transition = '';
      }, 300);
    } catch (e) {
      // Ignora errori localStorage
    }
  }, []);

  // Componente invisibile, solo per side effect
  return null;
}
