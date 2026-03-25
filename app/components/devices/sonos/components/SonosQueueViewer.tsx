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
    <div className="border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 pt-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700 transition-colors"
      >
        <ListMusic size={14} />
        <span>{headerLabel}</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-0.5">
          {loading && items.length === 0 && (
            <p className="text-xs text-slate-500 py-2">Caricamento...</p>
          )}
          {error && (
            <p className="text-xs text-red-400 py-2">{error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-xs text-slate-500 py-2">Coda vuota</p>
          )}
          {items.length > 0 && (
            <>
              {items.map(item => (
                <div key={item.position} className="flex items-center gap-3 py-1.5">
                  <span className="w-6 text-right text-xs text-slate-500 flex-shrink-0">
                    {item.position}
                  </span>
                  <span className="flex-1 truncate text-sm text-slate-200 [html:not(.dark)_&]:text-slate-700">
                    {item.title ?? '—'}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[120px]">
                    {item.artist ?? '—'}
                  </span>
                </div>
              ))}
              {loading && items.length > 0 && (
                <p className="text-xs text-slate-500 py-2">Caricamento...</p>
              )}
              {hasMore && !loading && (
                <button
                  onClick={() => void loadMore()}
                  className="text-xs text-ember-400 hover:text-ember-300 transition-colors py-1.5"
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
