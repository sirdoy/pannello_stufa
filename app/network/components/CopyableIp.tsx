'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

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
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={handleCopy}
        aria-label={copied ? 'IP copiato' : 'Copia IP'}
      >
        {copied ? (
          <Check className="w-4 h-4 text-sage-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
