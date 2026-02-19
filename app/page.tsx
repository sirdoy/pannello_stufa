import { Suspense } from 'react';
import DashboardCards from './components/DashboardCards';
import SandboxPanel from './components/sandbox/SandboxPanel';
import DashboardSkeleton from './loading';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      {/* Sandbox Panel - Solo in localhost quando abilitato */}
      <SandboxPanel />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardCards />
      </Suspense>
    </section>
  );
}
