'use client';

import { useRouter } from 'next/navigation';
import { Phone, ArrowLeft } from 'lucide-react';
import { PageLayout, Heading, Button } from '@/app/components/ui';
import { useFritzTamStatus } from './hooks/useFritzTamStatus';
import { useFritzDectHandsets } from './hooks/useFritzDectHandsets';
import { useFritzCallHistory } from './hooks/useFritzCallHistory';
import TamStatusCard from './components/TamStatusCard';
import DectHandsetsTable from './components/DectHandsetsTable';
import CallHistoryTable from './components/CallHistoryTable';

/**
 * /telefonia — Fritz!Box telephony consumer page.
 *
 * Orchestrator page composing three hooks with three presentational cards
 * per D-01, D-02, D-18. Closes FRITZ-01, FRITZ-02, FRITZ-03.
 */
export default function TelefoniaPage() {
  const router = useRouter();
  const tam = useFritzTamStatus();
  const dect = useFritzDectHandsets();
  const calls = useFritzCallHistory();

  return (
    <PageLayout maxWidth="7xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          aria-label="Torna alla homepage"
        >
          <ArrowLeft size={16} className="mr-1" />
          Indietro
        </Button>
        <div className="flex items-center gap-2">
          <Phone size={24} aria-hidden="true" className="text-ember-400" />
          <Heading level={1} size="2xl">Telefonia</Heading>
        </div>
      </div>

      <div className="space-y-8">
        <TamStatusCard
          status={tam.status}
          loading={tam.loading}
          stale={tam.stale}
        />
        <DectHandsetsTable
          handsets={dect.handsets}
          loading={dect.loading}
          stale={dect.stale}
          total={dect.total}
        />
        <CallHistoryTable
          calls={calls.calls}
          loading={calls.loading}
          stale={calls.stale}
          totalCount={calls.totalCount}
          page={calls.page}
          onPageChange={calls.setPage}
        />
      </div>
    </PageLayout>
  );
}
