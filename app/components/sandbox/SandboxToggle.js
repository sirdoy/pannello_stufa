'use client';

import { useState, useEffect } from 'react';
import SandboxPanel from './SandboxPanel';
import {
  isLocalEnvironment,
  isSandboxEnabled,
  toggleSandbox,
  initializeSandbox,
} from '../../../lib/sandboxService';

/**
 * Toggle per abilitare/disabilitare Sandbox Mode
 *
 * Visibile SOLO in localhost
 * Include anche il SandboxPanel quando abilitato
 */
export default function SandboxToggle() {
  const [isLocal, setIsLocal] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEnvironment();
  }, []);

  async function checkEnvironment() {
    const local = isLocalEnvironment();
    setIsLocal(local);

    if (local) {
      // Inizializza sandbox se necessario
      await initializeSandbox();

      // Check se è abilitato
      const sandboxEnabled = await isSandboxEnabled();
      setEnabled(sandboxEnabled);
    }

    setLoading(false);
  }

  async function handleToggle() {
    try {
      const newState = !enabled;
      await toggleSandbox(newState);
      setEnabled(newState);

      // Ricarica la pagina per applicare il sandbox mode
      if (newState) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Errore toggle sandbox:', error);
    }
  }

  // Non renderizzare se non in localhost
  if (!isLocal || loading) {
    return null;
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Toggle Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div>
            <h3 className="text-white font-semibold">Sandbox Mode</h3>
            <p className="text-gray-300 text-xs">
              {enabled
                ? 'Simulazione attiva - Nessuna chiamata reale alla stufa'
                : 'Abilita per testare senza chiamate reali'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {/* Sandbox Panel (solo se abilitato) */}
      {enabled && <SandboxPanel />}
    </div>
  );
}
