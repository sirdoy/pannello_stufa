'use client';

import { useState } from 'react';
import { ListMusic, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="border-t border-slate-700/50 pt-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        <ListMusic size={14} />
        <span>{headerLabel}</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-0.5">
          {loading && items.length === 0 && (
            <p className="py-2 text-xs text-slate-500">Caricamento...</p>
          )}
          {error && (
            <p className="py-2 text-xs text-red-400">{error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="py-2 text-xs text-slate-500">Coda vuota</p>
          )}
          {items.length > 0 && (
            <>
              {items.map(item => (
                <div key={item.position} className="flex items-center gap-3 py-1.5">
                  <span className="w-6 shrink-0 text-right text-xs text-slate-500">
                    {/* position is 0-based (backend offset + index) */}
                    {item.position + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-slate-200">
                    {item.title ?? '—'}
                  </span>
                  <span className="max-w-30 truncate text-xs text-slate-400">
                    {item.artist ?? '—'}
                  </span>
                </div>
              ))}
              {loading && items.length > 0 && (
                <p className="py-2 text-xs text-slate-500">Caricamento...</p>
              )}
              {hasMore && !loading && (
                <button
                  onClick={() => void loadMore()}
                  className="py-1.5 text-xs text-ember-400 transition-colors hover:text-ember-300"
                >
                  Carica altri
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
