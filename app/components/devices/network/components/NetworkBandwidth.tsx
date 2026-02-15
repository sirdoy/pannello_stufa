/**
 * NetworkBandwidth Component
 *
 * Hero bandwidth display showing download/upload speeds with mini sparklines.
 * Two big numbers (Mbps) with Recharts area chart sparklines below each.
 *
 * Pure presentational component - no state, effects, or hooks (except useId for SVG gradients).
 */

'use client';

import { useId } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { BandwidthData, SparklinePoint } from '../types';

export interface NetworkBandwidthProps {
  bandwidth: BandwidthData | null;
  downloadHistory: SparklinePoint[];
  uploadHistory: SparklinePoint[];
}

export default function NetworkBandwidth({
  bandwidth,
  downloadHistory,
  uploadHistory,
}: NetworkBandwidthProps) {
  // Unique gradient IDs to avoid SVG conflicts
  const downloadGradientId = useId();
  const uploadGradientId = useId();

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Download */}
      <div>
        {/* Number */}
        <div className="mb-2">
          <div className="text-3xl font-bold text-emerald-300">
            {bandwidth?.download.toFixed(1) ?? '--'}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Mbps
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Scaricamento</div>
        </div>

        {/* Sparkline */}
        {downloadHistory.length > 0 && (
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart
              data={downloadHistory.map((point) => ({
                time: point.time,
                value: point.mbps,
              }))}
              margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id={downloadGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(52, 211, 153)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(52, 211, 153)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(52, 211, 153)"
                strokeWidth={1.5}
                fill={`url(#${downloadGradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Upload */}
      <div>
        {/* Number */}
        <div className="mb-2">
          <div className="text-3xl font-bold text-teal-300">
            {bandwidth?.upload.toFixed(1) ?? '--'}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Mbps
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Caricamento</div>
        </div>

        {/* Sparkline */}
        {uploadHistory.length > 0 && (
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart
              data={uploadHistory.map((point) => ({
                time: point.time,
                value: point.mbps,
              }))}
              margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id={uploadGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(45, 212, 191)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(45, 212, 191)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(45, 212, 191)"
                strokeWidth={1.5}
                fill={`url(#${uploadGradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
