// ✅ File: app/netatmo/authorized/page.js

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NetatmoAuthorizedPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifica del salvataggio token...');

  useEffect(() => {
    // ✅ Usiamo un delay minimo per simulare verifica (opzionale)
    const timer = setTimeout(() => {
      setStatus('Token salvato correttamente. Reindirizzamento...');
      router.replace('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="text-center mt-20 text-gray-700">
      <p className="text-lg font-medium">{status}</p>
    </div>
  );
}
