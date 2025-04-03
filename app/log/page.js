'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';

const PAGE_SIZE = 50;

export default function LogPage() {
  const [log, setLog] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const logRef = ref(db, 'log');

    const unsubscribe = onValue(logRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLog([]);
        return;
      }

      const entries = Object.entries(data)
        .map(([id, entry]) => ({ id, ...entry }))
        .sort((a, b) => b.timestamp - a.timestamp); // Ordine inverso

      setLog(entries);
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
    return '📄';
  };

  const startIndex = currentPage * PAGE_SIZE;
  const currentPageData = log.slice(startIndex, startIndex + PAGE_SIZE);

  const hasNext = startIndex + PAGE_SIZE < log.length;
  const hasPrev = currentPage > 0;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md space-y-6 border">
      <h2 className="text-2xl font-semibold text-center">Storico Azioni</h2>

      {log.length === 0 ? (
        <p className="text-center text-gray-500">Nessuna azione registrata</p>
      ) : (
        <>
          <ul className="space-y-4">
            {currentPageData.map((entry) => (
              <li key={entry.id} className="border-b pb-2 flex items-start gap-3">
                <div className="text-xl">{getIcon(entry.action)}</div>
                <div>
                  <div className="text-sm text-gray-500">{formatDate(entry.timestamp)}</div>
                  <div className="text-base">
                    {entry.action}
                    {entry.value !== undefined && (
                      <span className="ml-2 text-blue-600 font-medium">→ {entry.value}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrev}
              className={`px-4 py-2 rounded ${
                hasPrev ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              ◀ Precedente
            </button>
            <span className="text-sm text-gray-600">
              Pagina {currentPage + 1} di {Math.ceil(log.length / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasNext}
              className={`px-4 py-2 rounded ${
                hasNext ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Successivo ▶
            </button>
          </div>
        </>
      )}
    </div>
  );
}
