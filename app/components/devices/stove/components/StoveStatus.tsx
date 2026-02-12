'use client';

import { Badge, Heading, Text } from '../../../ui';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { getStatusInfo, getStatusDisplay } from '../stoveStatusUtils';
import type { StalenessInfo } from '@/lib/pwa/stalenessDetector';

interface StoveStatusProps {
  status: string;
  fanLevel: number | null;
  powerLevel: number | null;
  errorCode: number;
  sandboxMode: boolean;
  staleness: StalenessInfo | null;
  isVisible: boolean;
  statusInfo: ReturnType<typeof getStatusInfo>;
  statusDisplay: ReturnType<typeof getStatusDisplay>;
}

export default function StoveStatus({
  status,
  fanLevel,
  powerLevel,
  errorCode,
  sandboxMode,
  staleness,
  isVisible,
  statusInfo,
  statusDisplay,
}: StoveStatusProps) {
  return (
    <div className="mb-6 relative">
      {/* Sandbox Badge */}
      {sandboxMode && (
        <div className="absolute -top-2 -left-2 z-30">
          <Badge variant="ocean" size="sm" pulse icon={<span>🧪</span>}>
            SANDBOX
          </Badge>
        </div>
      )}

      {/* Error Badge */}
      {errorCode !== 0 && (
        <div className="absolute -top-2 -right-2 z-30">
          <Badge variant="danger" size="sm" pulse icon={<span>⚠️</span>}>
            ERR {errorCode}
          </Badge>
        </div>
      )}

      {/* Staleness Warning Badge - only when visible AND data is stale */}
      {isVisible && staleness?.isStale && errorCode === 0 && (
        <div className="absolute -top-2 -right-2 z-30">
          <Badge variant="warning" size="sm" icon={<span>⏱️</span>}>
            Dati non aggiornati
          </Badge>
        </div>
      )}

      {/* Status Display Box - Ember Noir */}
      <div
        className={`relative ${statusInfo.bgColor} rounded-2xl p-6 sm:p-8 ${statusInfo.glowColor} border ${statusInfo.borderColor} overflow-visible transition-all duration-500`}
        data-status-variant={statusDisplay.variant}
      >
        {/* Layout: Status Label + Icon + Info Boxes */}
        <div className="relative">
          {/* Status Label */}
          <div className="text-center mb-8 sm:mb-10">
            <Heading level={3} size="3xl" className={`${statusInfo.textColor} tracking-tight uppercase font-display font-bold`}>
              {statusInfo.label}
            </Heading>
            {statusInfo.label.toUpperCase() !== status.toUpperCase() && (
              <Text size="xs" className="text-slate-500 mt-1.5 font-mono opacity-60 tracking-wide">
                {status}
              </Text>
            )}
          </div>

          {/* Icon + Info Boxes Container */}
          <div className="relative flex flex-col items-center">
            {/* Large Status Icon with Glow Effect */}
            <div className={`relative mb-[-40px] sm:mb-[-50px] ${statusInfo.pulse ? 'animate-pulse-ember' : ''}`}>
              {/* Radial glow layer behind icon */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 rounded-full blur-3xl opacity-70 ${statusInfo.bgColor}`}
                style={{ background: `radial-gradient(circle, currentColor 0%, transparent 70%)` }}
              ></div>
              <span className="relative text-[120px] sm:text-[140px] drop-shadow-2xl inline-block" style={{ lineHeight: 1 }}>
                {statusInfo.icon}
              </span>
            </div>

            {/* Two Info Boxes */}
            <div className="relative z-10 w-full grid grid-cols-2 gap-3 sm:gap-4 mt-4">
              {/* Fan Level Box */}
              <div className={`relative overflow-hidden rounded-2xl ${statusInfo.boxBgColor} border border-white/10 [html:not(.dark)_&]:border-slate-200`}>
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xl sm:text-2xl">💨</span>
                  </div>
                  <Text className={`text-[10px] sm:text-xs font-display ${statusInfo.boxLabelColor} uppercase tracking-wider mb-1`}>
                    Ventola
                  </Text>
                  <div className="flex items-baseline gap-0.5">
                    <Text className={`text-2xl sm:text-3xl font-display ${statusInfo.boxValueColor} leading-none`}>
                      {fanLevel ?? '-'}
                    </Text>
                    <Text as="span" className={`text-sm sm:text-base ${statusInfo.boxSuffixColor}`}>/6</Text>
                  </div>
                </div>
              </div>

              {/* Power Level Box */}
              <div className={`relative overflow-hidden rounded-2xl ${statusInfo.boxBgColor} border border-white/10 [html:not(.dark)_&]:border-slate-200`}>
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xl sm:text-2xl">⚡</span>
                  </div>
                  <Text className={`text-[10px] sm:text-xs font-display ${statusInfo.boxLabelColor} uppercase tracking-wider mb-1`}>
                    Potenza
                  </Text>
                  <div className="flex items-baseline gap-0.5">
                    <Text className={`text-2xl sm:text-3xl font-display ${statusInfo.boxValueColor} leading-none`}>
                      {powerLevel ?? '-'}
                    </Text>
                    <Text as="span" className={`text-sm sm:text-base ${statusInfo.boxSuffixColor}`}>/5</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staleness Indicator */}
        {staleness?.cachedAt && (
          <div className="mt-4 text-center">
            <Text variant="tertiary" size="sm">
              Ultimo aggiornamento: {formatDistanceToNow(staleness.cachedAt instanceof Date ? staleness.cachedAt : new Date(staleness.cachedAt), { addSuffix: true, locale: it })}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
