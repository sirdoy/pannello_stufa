'use client';

import { useState } from 'react';
import { VERSION_HISTORY, APP_VERSION } from '@/lib/version';
import { FRONTEND_BUILD_ID } from '@/lib/buildVersion';
import { Calendar, Check, ChevronLeft, ChevronRight, Rocket, Sparkles, Wrench } from 'lucide-react';
import { Badge, Button, Card, Heading, Text, StatusBadge, Divider } from '@/app/components/ui';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';

const ITEMS_PER_PAGE = 10;

/** Short commit of the running build ("dev" locally) */
const BUILD_LABEL = FRONTEND_BUILD_ID === 'dev' ? 'dev' : FRONTEND_BUILD_ID.slice(0, 7);

export default function ChangelogPage() {
  // Semantic versioning stopped at APP_VERSION (M36): the history is a bundled archive,
  // deploys are identified by the build commit (M17)
  const changelog = VERSION_HISTORY;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Pagination calculations
  const totalPages = Math.ceil(changelog.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedChangelog = changelog.slice(startIndex, endIndex);

  const goToPage = (page: number): void => {
    setCurrentPage(page);
    // Scroll to top of timeline
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Version type configuration with proper dark-first styling
  const versionConfig = {
    major: {
      Icon: Rocket,
      label: 'Major Release',
      badgeColor: 'ember',
      dotClass: 'bg-ember-500/20 text-ember-400',
      legendClass: 'bg-ember-400',
    },
    minor: {
      Icon: Sparkles,
      label: 'Minor Update',
      badgeColor: 'sage',
      dotClass: 'bg-sage-500/20 text-sage-400',
      legendClass: 'bg-sage-400',
    },
    patch: {
      Icon: Wrench,
      label: 'Patch',
      badgeColor: 'ocean',
      dotClass: 'bg-ocean-500/20 text-ocean-400',
      legendClass: 'bg-ocean-400',
    },
  } as const;

  const getConfig = (type?: string) => versionConfig[type as keyof typeof versionConfig] || versionConfig.patch;

  return (
    <div className="animate-fade-in mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Changelog"
        description={`Storico delle versioni fino alla v${APP_VERSION}. Da allora ogni rilascio è identificato dal commit della build.`}
        backHref="/altro"
      />

      {/* Current Build Badge */}
      <Card variant="elevated" className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text variant="label" size="xs">Build Corrente</Text>
          <Text as="span" variant="ember" size="xl" mono>
            {BUILD_LABEL}
          </Text>
        </div>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute inset-y-8 left-[23px] w-px bg-white/8 sm:left-[27px]" />

        <div className="space-y-6">
          {paginatedChangelog.map((version, index) => {
            const config = getConfig(version.type);
            const isLatest = currentPage === 1 && index === 0;

            return (
              <div key={version.version} className="animate-fade-in-up relative pl-14 sm:pl-16" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Timeline dot */}
                <div className={`absolute top-6 left-0 z-10 flex size-12 items-center justify-center rounded-2xl sm:size-14 ${config.dotClass}`}>
                  <config.Icon size={20} aria-hidden="true" />
                </div>

                <Card variant="default" hover className="overflow-hidden transition-all duration-300">
                  {/* Header */}
                  <div className="border-b border-white/8 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <Heading level={2} size="xl">v{version.version}</Heading>

                        {/* Version type badge */}
                        <StatusBadge
                          status={config.label}
                          color={config.badgeColor}
                          size="sm"
                        />

                        {/* Last versioned release */}
                        {isLatest && (
                          <Badge variant="ember" size="sm">LATEST</Badge>
                        )}
                      </div>

                      <Text variant="tertiary" size="sm" className="flex items-center gap-2">
                        <Calendar size={14} aria-hidden="true" />
                        {new Date(version.date).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </div>
                  </div>

                  {/* Changes List */}
                  <div className="p-5 sm:p-6">
                    <ul className="space-y-3">
                      {version.changes.map((change, changeIndex) => {
                        const dotClass = version.type === 'major'
                          ? 'bg-ember-500/20 text-ember-400 group-hover:bg-ember-500/30'
                          : version.type === 'minor'
                            ? 'bg-sage-500/20 text-sage-400 group-hover:bg-sage-500/30'
                            : 'bg-ocean-500/20 text-ocean-400 group-hover:bg-ocean-500/30';
                        return (
                        <li key={changeIndex} className="group flex items-start gap-3">
                          <span className={'mt-1.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ' + dotClass}>
                            <Check size={12} aria-hidden="true" />
                          </span>
                          <Text variant="secondary" className="flex-1 leading-relaxed">{change}</Text>
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {/* Previous Button */}
          <Button
            variant="subtle"
            size="sm"
            icon={<ChevronLeft size={16} />}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="hidden sm:inline">Precedente</span>
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 sm:gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrentPage = page === currentPage;

              // Show first, last, current, and adjacent pages
              const showPage = page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1;

              // Show ellipsis
              const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
              const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

              if (showEllipsisBefore || showEllipsisAfter) {
                return (
                  <Text as="span" key={page} variant="secondary" className="px-2">
                    ...
                  </Text>
                );
              }

              if (!showPage) return null;

              return (
                <Button
                  key={page}
                  variant={isCurrentPage ? 'ember' : 'ghost'}
                  size="sm"
                  className="min-w-11 px-0"
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          {/* Next Button */}
          <Button
            variant="subtle"
            size="sm"
            icon={<ChevronRight size={16} />}
            iconPosition="right"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="hidden sm:inline">Successiva</span>
          </Button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center">
          <Text variant="tertiary" size="sm">
            Pagina {currentPage} di {totalPages} ({changelog.length} versioni totali)
          </Text>
        </div>
      )}

      {/* Footer Legend */}
      <Card variant="subtle" className="p-5 sm:p-6">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <div className="flex items-center gap-6">
            {Object.entries(versionConfig).map(([type, config]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`size-3 rounded-full ${config.legendClass}`} />
                <Text variant="tertiary" size="xs">{config.label}</Text>
              </div>
            ))}
          </div>
        </div>
        <Divider variant="gradient" spacing="small" className="my-4" />
        <div className="text-center">
          <Text variant="tertiary" size="xs">
            Versionamento Semantico: <Text as="span" variant="tertiary" size="xs">MAJOR</Text>.
            <Text as="span" variant="tertiary" size="xs">MINOR</Text>.
            <Text as="span" variant="tertiary" size="xs">PATCH</Text>
          </Text>
        </div>
      </Card>
    </div>
  );
}
