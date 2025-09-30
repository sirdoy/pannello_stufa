'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';
import Card from '@/app/components/ui/Card';
import Skeleton from '@/app/components/ui/Skeleton';
import LogEntry from '@/app/components/log/LogEntry';
import Pagination from '@/app/components/ui/Pagination';

const PAGE_SIZE = 50;

export default function LogPage() {
  const [log, setLog] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logRef = ref(db, 'log');

    const unsubscribe = onValue(logRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLog([]);
        setLoading(false);
        return;
      }

      const entries = Object.entries(data)
        .map(([id, entry]) => ({ id, ...entry }))
        .sort((a, b) => b.timestamp - a.timestamp); // Ordine inverso

      setLog(entries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const getIcon = (action) => {
    if (!action) return '❔';
    if (action.toLowerCase().includes('accensione')) return '🔥';
    if (action.toLowerCase().includes('spegnimento')) return '❄️';
    if (action.toLowerCase().includes('ventola')) return '💨';
    if (action.toLowerCase().includes('potenza')) return '⚡';
    if (action.toLowerCase().includes('scheduler') || action.toLowerCase().includes('modalità')) return '⏰';
    if (action.toLowerCase().includes('netatmo')) return '🌡️';
    if (action.toLowerCase().includes('intervallo')) return '📅';
    return '📄';
  };

  const startIndex = currentPage * PAGE_SIZE;
  const currentPageData = log.slice(startIndex, startIndex + PAGE_SIZE);

  const hasNext = startIndex + PAGE_SIZE < log.length;
  const hasPrev = currentPage > 0;

  if (loading) {
    return <Skeleton.LogPage />;
  }

  return (
    <Card className="max-w-3xl mx-auto mt-10 p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-center">Storico Azioni Utenti</h2>

      {log.length === 0 ? (
        <p className="text-center text-gray-500">Nessuna azione registrata</p>
      ) : (
        <>
          <ul className="space-y-4">
            {currentPageData.map((entry) => (
              <LogEntry
                key={entry.id}
                entry={entry}
                formatDate={formatDate}
                getIcon={getIcon}
              />
            ))}
          </ul>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(log.length / PAGE_SIZE)}
            onPrevious={() => setCurrentPage((p) => Math.max(0, p - 1))}
            onNext={() => setCurrentPage((p) => p + 1)}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        </>
      )}
    </Card>
  );
}
