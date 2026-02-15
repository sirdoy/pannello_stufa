'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableIpProps {
  ip: string;
}

/**
 * CopyableIp Component
 *
 * Displays an IP address with a copy-to-clipboard button.
 * Shows visual feedback (checkmark) when copied successfully.
 */
export default function CopyableIp({ ip }: CopyableIpProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy IP to clipboard:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-slate-100">{ip}</span>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'IP copiato' : 'Copia IP'}
        className="min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-slate-100 rounded-xl transition-all duration-[var(--duration-smooth)] flex items-center justify-center"
      >
        {copied ? (
          <Check className="w-4 h-4 text-sage-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
