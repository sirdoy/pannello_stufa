'use client';

import { useState } from 'react';
import { ListMusic, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';
import { useSonosQueue } from '../hooks/useSonosQueue';

interface SonosQueueViewerProps {
  groupId: string;
}

export default function SonosQueueViewer({ groupId }: SonosQueueViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { items, total, loading, error, hasMore, fetchInitial, loadMore } = useSonosQueue(groupId);

  const handleToggle = () => {
    const expanding = !isExpanded;
    setIsExpanded(expanding);
    if (expanding) {
      void fetchInitial();
    }
  };

  const headerLabel = total > 0 ? `Coda (${total} brani)` : 'Coda';

  return (
    <div className="border-t border-white/8 pt-3">
      <Button variant="ghost" size="sm" onClick={handleToggle} icon={<ListMusic size={14} />}>
        <span className="inline-flex items-center gap-2">
          <span>{headerLabel}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </Button>

      {isExpanded && (
        <div className="mt-2 space-y-0.5">
          {loading && items.length === 0 && (
            <Text variant="secondary" size="xs" className="py-2">Caricamento...</Text>
          )}
          {error && (
            <Text variant="danger" size="xs" className="py-2">{error}</Text>
          )}
          {!loading && !error && items.length === 0 && (
            <Text variant="secondary" size="xs" className="py-2">Coda vuota</Text>
          )}
          {items.length > 0 && (
            <>
              {items.map(item => (
                <div key={item.position} className="flex items-center gap-3 py-1.5">
                  <Text as="span" variant="secondary" size="xs" className="w-6 shrink-0 text-right">
                    {/* position is 0-based (backend offset + index) */}
                    {item.position + 1}
                  </Text>
                  <Text as="span" size="sm" className="flex-1 truncate">
                    {item.title ?? '—'}
                  </Text>
                  <Text as="span" variant="secondary" size="xs" className="max-w-30 truncate">
                    {item.artist ?? '—'}
                  </Text>
                </div>
              ))}
              {loading && items.length > 0 && (
                <Text variant="secondary" size="xs" className="py-2">Caricamento...</Text>
              )}
              {hasMore && !loading && (
                <Button variant="subtle" size="sm" onClick={() => void loadMore()}>
                  Carica altri
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
