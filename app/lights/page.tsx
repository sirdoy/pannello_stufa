'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Skeleton, EmptyState, Heading, Text, Banner, Slider, Badge } from '@/app/components/ui';
import { COLOR_PRESETS, supportsColor } from '@/lib/hue/colorUtils';
import type { ColorPreset } from '@/lib/hue/colorUtils';
import { cn } from '@/lib/utils/cn';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import type { HueLight, HueGroup, HueScene } from '@/types/hueProxy';

export default function LightsPage() {
  const router = useRouter();
  const lightsData = useLightsData();
  const lightsCommands = useLightsCommands({ lightsData, router });
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [activatingScene, setActivatingScene] = useState<string | null>(null);
  const [changingColor, setChangingColor] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleLightToggle(lightId: string, on: boolean): Promise<void> {
    try {
      lightsData.setRefreshing(true);
      lightsData.setError(null);
      const res = await fetch(`/api/hue/lights/${lightId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on }),
      });
      if (!res.ok) throw new Error(res.status === 409 ? 'Luce non raggiungibile' : `Comando fallito: ${res.status}`);
      const data = await res.json() as { suggested_poll_delay_s?: number };
      await new Promise<void>(r => setTimeout(r, (data.suggested_poll_delay_s ?? 2) * 1000));
      await lightsData.fetchData();
    } catch (err) { lightsData.setError(err instanceof Error ? err.message : String(err)); }
    finally { lightsData.setRefreshing(false); }
  }

  async function handleLightBrightnessChange(lightId: string, pct: number): Promise<void> {
    try {
      lightsData.setRefreshing(true);
      lightsData.setError(null);
      const res = await fetch(`/api/hue/lights/${lightId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bri: Math.round(pct * 254 / 100) }),
      });
      if (!res.ok) throw new Error(res.status === 409 ? 'Luce non raggiungibile' : `Comando fallito: ${res.status}`);
      const data = await res.json() as { suggested_poll_delay_s?: number };
      await new Promise<void>(r => setTimeout(r, (data.suggested_poll_delay_s ?? 2) * 1000));
      await lightsData.fetchData();
    } catch (err) { lightsData.setError(err instanceof Error ? err.message : String(err)); }
    finally { lightsData.setRefreshing(false); }
  }

  async function handleLightColorChange(lightId: string, preset: ColorPreset): Promise<void> {
    try {
      setChangingColor(lightId);
      lightsData.setError(null);
      const res = await fetch(`/api/hue/lights/${lightId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xy: [preset.xy.x, preset.xy.y] }),
      });
      if (!res.ok) throw new Error(`Comando fallito: ${res.status}`);
      const data = await res.json() as { suggested_poll_delay_s?: number };
      await new Promise<void>(r => setTimeout(r, (data.suggested_poll_delay_s ?? 2) * 1000));
      setSuccess(`Colore cambiato a ${preset.name}`);
      setTimeout(() => setSuccess(null), 2000);
      await lightsData.fetchData();
    } catch (err) { lightsData.setError(err instanceof Error ? err.message : String(err)); }
    finally { setChangingColor(null); }
  }

  if (lightsData.loading) return <Skeleton.LightsCard />;

  if (!lightsData.connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <Heading level={1} size="lg" className="mb-4">Bridge Hue Non Connesso</Heading>
          <Text variant="secondary" className="mb-6">
            Il bridge Hue non e raggiungibile tramite il proxy. Verifica che Home Assistant sia attivo e il bridge sia connesso.
          </Text>
          <Button variant="ember" onClick={() => router.push('/')}>Torna alla Homepage</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => router.push('/')} size="sm">← Indietro</Button>
        </div>
        <Heading level={1} size="2xl" className="mb-2">Controllo Luci Philips Hue</Heading>
        <Text variant="secondary">Gestisci stanze, luci individuali e scene</Text>
      </div>

      {success && (
        <div className="mb-6">
          <Banner variant="success" icon="✅" title={success} dismissible onDismiss={() => setSuccess(null)} />
        </div>
      )}
      {lightsData.error && (
        <div className="mb-6">
          <Banner variant="error" icon="⚠️" title="Errore" description={lightsData.error} dismissible onDismiss={() => lightsData.setError(null)} />
        </div>
      )}

      <Card className="p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-3 gap-6">
            <div><Text variant="label" size="xs" className="mb-1">Stanze</Text><Heading level={3} size="lg">{lightsData.groups.length}</Heading></div>
            <div><Text variant="label" size="xs" className="mb-1">Luci</Text><Heading level={3} size="lg">{lightsData.lights.length}</Heading></div>
            <div><Text variant="label" size="xs" className="mb-1">Scene</Text><Heading level={3} size="lg">{lightsData.scenes.length}</Heading></div>
          </div>
          <Button variant="outline" onClick={lightsData.handleRefresh} loading={lightsData.refreshing} size="sm">🔄 Aggiorna</Button>
        </div>
      </Card>

      {lightsData.hasAnyLights && (
        <Card className="p-6 mb-6 bg-gradient-to-br from-slate-800/40 to-slate-900/60 border-slate-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏠</span>
              <div>
                <Heading level={2} size="md">Tutta la Casa</Heading>
                <Text variant="secondary" size="sm">{lightsData.totalLightsOn}/{lightsData.lights.length} luci accese</Text>
              </div>
            </div>
            <div className="flex gap-3">
              {!lightsData.allHouseLightsOn && !lightsData.allHouseLightsOff && (<>
                <Button variant="ember" onClick={() => lightsCommands.handleAllLightsToggle(true)} disabled={lightsData.refreshing} icon="💡">Accendi Tutte</Button>
                <Button variant="subtle" onClick={() => lightsCommands.handleAllLightsToggle(false)} disabled={lightsData.refreshing} icon="🌙">Spegni Tutte</Button>
              </>)}
              {lightsData.allHouseLightsOff && (
                <Button variant="ember" onClick={() => lightsCommands.handleAllLightsToggle(true)} disabled={lightsData.refreshing} icon="💡" className="ring-2 ring-ember-500/30 ring-offset-2 ring-offset-slate-900">Accendi Tutte le Luci</Button>
              )}
              {lightsData.allHouseLightsOn && (
                <Button variant="subtle" onClick={() => lightsCommands.handleAllLightsToggle(false)} disabled={lightsData.refreshing} icon="🌙">Spegni Tutte le Luci</Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {lightsData.groups.length > 0 && (
        <div className="space-y-6 mb-8">
          <Heading level={2} size="md">🏠 Stanze</Heading>
          {lightsData.groups.map((group: HueGroup) => {
            const groupLights = lightsData.lights.filter((l: HueLight) => group.lights.includes(l.light_id));
            const groupScenes = lightsData.scenes.filter((s: HueScene) => s.group_id === group.group_id);
            const isExpanded = expandedRoom === group.group_id;
            const isOn = groupLights.some(l => l.on);
            const avgBri = isOn && groupLights.length > 0
              ? Math.round(groupLights.reduce((s, l) => s + (l.brightness ?? 0), 0) / groupLights.length * 100 / 254) : 0;
            const onCount = groupLights.filter(l => l.on).length;
            const allOn = groupLights.length > 0 && onCount === groupLights.length;
            const allOff = groupLights.length > 0 && onCount === 0;
            return (
              <Card key={group.group_id} className="overflow-hidden">
                <div className={`p-6 ${isOn ? 'bg-gradient-to-br from-warning-900/20 to-warning-800/20' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Heading level={3} size="md" className="mb-1">{group.name}</Heading>
                      <Text variant="tertiary" size="xs">
                        {groupLights.length} {groupLights.length === 1 ? 'luce' : 'luci'} • {groupScenes.length} {groupScenes.length === 1 ? 'scena' : 'scene'}
                        {groupLights.length > 0 && ` • ${onCount} accese`}
                      </Text>
                    </div>
                    {isOn && <Badge variant="ember" pulse>ACCESO</Badge>}
                  </div>
                  <div className="mb-4">
                    {!allOn && !allOff && (
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="subtle" onClick={() => lightsCommands.handleRoomToggle(group.group_id, true)} disabled={lightsData.refreshing} size="sm" icon="💡">Accendi Stanza</Button>
                        <Button variant="subtle" onClick={() => lightsCommands.handleRoomToggle(group.group_id, false)} disabled={lightsData.refreshing} size="sm" icon="🌙">Spegni Stanza</Button>
                      </div>
                    )}
                    {allOff && <Button variant="ember" onClick={() => lightsCommands.handleRoomToggle(group.group_id, true)} disabled={lightsData.refreshing} size="sm" icon="💡" fullWidth className="ring-2 ring-ember-500/30 ring-offset-2 ring-offset-slate-900">Accendi Stanza</Button>}
                    {allOn && <Button variant="subtle" onClick={() => lightsCommands.handleRoomToggle(group.group_id, false)} disabled={lightsData.refreshing} size="sm" icon="🌙" fullWidth>Spegni Stanza</Button>}
                  </div>
                  {isOn && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Text variant="secondary" size="xs">Luminosità Stanza</Text>
                        <Text variant="body" size="sm">{avgBri}%</Text>
                      </div>
                      <Slider value={avgBri} min={1} max={100} step={1} onChange={(v) => lightsCommands.handleBrightnessChange(group.group_id, String(v))} disabled={lightsData.refreshing} aria-label={`Luminosita stanza ${group.name}`} />
                    </div>
                  )}
                  {(groupLights.length > 0 || groupScenes.length > 0) && (
                    <Button variant="ghost" onClick={() => setExpandedRoom(isExpanded ? null : group.group_id)} size="sm" className="w-full mt-4">
                      {isExpanded ? '▲ Nascondi Dettagli' : '▼ Mostra Dettagli'} ({groupLights.length} luci, {groupScenes.length} scene)
                    </Button>
                  )}
                </div>
                {isExpanded && (
                  <div className="p-6 border-t border-slate-700 bg-slate-900/20">
                    {groupLights.length > 0 && (
                      <>
                        <Heading level={4} size="sm" className="mb-3">💡 Luci Individuali</Heading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {groupLights.map((light: HueLight) => {
                            const briPct = Math.round((light.brightness ?? 0) * 100 / 254);
                            const hasColor = supportsColor(light);
                            return (
                              <div key={light.light_id} className={cn("p-4 rounded-xl border-2 transition-colors", light.on ? "border-warning-500/50 bg-warning-500/10" : "border-slate-700 bg-slate-800")}>
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <Text size="sm">{light.name}</Text>
                                    {hasColor && <Text variant="tertiary" size="xs">🎨 Colore disponibile</Text>}
                                  </div>
                                  {light.on && <Badge variant="ember" size="sm">ON</Badge>}
                                </div>
                                <div className="mb-2">
                                  {light.on
                                    ? <Button variant="subtle" onClick={() => handleLightToggle(light.light_id, false)} disabled={lightsData.refreshing} size="sm" fullWidth icon="🌙">Spegni</Button>
                                    : <Button variant="ember" onClick={() => handleLightToggle(light.light_id, true)} disabled={lightsData.refreshing} size="sm" fullWidth icon="💡">Accendi</Button>
                                  }
                                </div>
                                {light.on && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Text variant="tertiary" size="xs">Luminosità</Text>
                                        <Text size="xs">{briPct}%</Text>
                                      </div>
                                      <Slider value={briPct} min={1} max={100} step={1} onChange={(v) => handleLightBrightnessChange(light.light_id, v as number)} disabled={lightsData.refreshing} aria-label={`Luminosita ${light.name}`} />
                                    </div>
                                    {hasColor && (
                                      <div className="space-y-1.5">
                                        <Text variant="tertiary" size="xs">Colore</Text>
                                        <div className="grid grid-cols-5 gap-1.5">
                                          {COLOR_PRESETS.map(preset => (
                                            <button key={preset.name} onClick={() => handleLightColorChange(light.light_id, preset)} disabled={changingColor === light.light_id} className="relative w-full aspect-square rounded-lg border-2 border-slate-600 hover:border-slate-400 transition-all active:scale-95 disabled:opacity-50" style={{ backgroundColor: preset.hex }} title={preset.name}>
                                              {changingColor === light.light_id && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {groupScenes.length > 0 && (
                      <>
                        <Heading level={4} size="sm" className="mb-3">🎨 Scene della Stanza</Heading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {groupScenes.map((scene: HueScene) => (
                            <button key={scene.scene_id} onClick={() => { setActivatingScene(scene.scene_id); lightsCommands.handleSceneActivate(scene.scene_id, scene.group_id).finally(() => setActivatingScene(null)); }} disabled={activatingScene === scene.scene_id} className={cn("relative p-4 rounded-xl border-2 transition-all active:scale-95", activatingScene === scene.scene_id ? "border-warning-500 bg-warning-500/10" : "border-slate-700 hover:border-warning-500/50")}>
                              <div className="text-2xl mb-1">🎨</div>
                              <Text size="xs" className="text-center">{scene.name}</Text>
                              {activatingScene === scene.scene_id && <div className="absolute top-1 right-1"><div className="w-3 h-3 border-2 border-warning-500 border-t-transparent rounded-full animate-spin"></div></div>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {lightsData.groups.length === 0 && (
        <EmptyState icon="💡" title="Nessuna stanza trovata" description="Configura le stanze nell'app Philips Hue" />
      )}
    </div>
  );
}
