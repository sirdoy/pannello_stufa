'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Stove main page - redirects to homepage
 * The stove control card is displayed on the homepage
 */
export default function StovePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
