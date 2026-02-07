'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

interface Device {
  tokenKey: string;
  token: string;
  displayName: string;
  browser: string;
  os: string;
}

interface Template {
  title: string;
  body: string;
  description: string;
  defaultPriority: string;
}

interface DeliveryResult {
  successCount: number;
  failureCount: number;
  errors?: Array<{ errorCode: string; tokenPrefix: string }>;
}

interface TestResult {
  success: boolean;
  trace?: {
    sentAt: string;
    targetDevices: number;
    deliveryResults: DeliveryResult;
    template?: string;
  };
  error?: string;
}

type TargetMode = 'all' | 'specific';
type TemplateKey = 'custom' | 'error_alert' | 'scheduler_success' | 'maintenance_reminder' | 'critical_test' | 'low_priority_test';
type Priority = 'high' | 'normal' | 'low';

export default function TestNotificationPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(true);

  // Form state
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateKey>('custom');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [sending, setSending] = useState<boolean>(false);
  const [result, setResult] = useState<TestResult | null>(null);

  // Template definitions (match API)
  const templates: Record<TemplateKey, Template> = {
    custom: { title: '', body: '', description: 'Write your own message', defaultPriority: 'normal' },
    error_alert: {
      title: 'Errore Stufa',
      body: 'Attenzione: rilevato errore nel sistema. Verifica lo stato della stufa.',
      description: 'Error alert with high priority',
      defaultPriority: 'high'
    },
    scheduler_success: {
      title: 'Accensione Completata',
      body: 'La stufa e stata accesa automaticamente dallo scheduler.',
      description: 'Scheduler success notification',
      defaultPriority: 'normal'
    },
    maintenance_reminder: {
      title: 'Promemoria Manutenzione',
      body: 'E il momento di effettuare la pulizia ordinaria della stufa.',
      description: 'Maintenance reminder',
      defaultPriority: 'normal'
    },
    critical_test: {
      title: 'Test CRITICAL',
      body: 'Notifica CRITICAL di test - bypassa DND',
      description: 'CRITICAL priority (bypasses DND hours)',
      defaultPriority: 'high'
    },
    low_priority_test: {
      title: 'Test LOW Priority',
      body: 'Notifica LOW priority di test',
      description: 'LOW priority notification',
      defaultPriority: 'low'
    }
  };

  // Priority options
  const priorities = [
    { value: 'high', label: 'HIGH - Urgent alerts', description: 'Bypasses some rate limits' },
    { value: 'normal', label: 'NORMAL - Standard', description: 'Default priority' },
    { value: 'low', label: 'LOW - Informational', description: 'Can be delayed' }
  ];

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async (): Promise<void> => {
    try {
      const response = await fetch('/api/notifications/devices');
      const data = await response.json();
      if (data.success) {
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleTemplateChange = (newTemplate: TemplateKey): void => {
    setTemplate(newTemplate);
    if (templates[newTemplate]?.defaultPriority) {
      setPriority(templates[newTemplate].defaultPriority as Priority);
    }
  };

  const handleSend = async (): Promise<void> => {
    setSending(true);
    setResult(null);

    try {
      const body: any = {};

      // Target selection
      if (targetMode === 'specific' && selectedDevice) {
        body.deviceToken = selectedDevice;
      } else {
        body.broadcast = true;
      }

      // Message content
      if (template === 'custom') {
        body.customTitle = customTitle;
        body.customBody = customBody;
      } else {
        body.template = template;
      }

      // Priority
      body.priority = priority;

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      setResult({
        success: data.success,
        trace: data.trace,
        error: data.error
      });
    } catch (err) {
      setResult({
        success: false,
        error: 'Failed to send notification: ' + (err instanceof Error ? err.message : 'Unknown error')
      });
    } finally {
      setSending(false);
    }
  };

  const isFormValid = (): boolean => {
    if (targetMode === 'specific' && !selectedDevice) return false;
    if (template === 'custom' && (!customTitle || !customBody)) return false;
    return true;
  };

  const selectedTemplate = templates[template];
  const isCustom = template === 'custom';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/debug/notifications')}
          >
            Back
          </Button>
        </div>
        <Heading level={1} className="flex items-center gap-3">
          <span>Send Test Notification</span>
        </Heading>
        <Text variant="tertiary" size="sm" className="mt-2">
          Test notification delivery to your devices with instant feedback
        </Text>
      </Card>

      <Card className="p-6">
        <Heading level={2} size="lg" className="mb-4">Target Devices</Heading>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="targetMode"
                value="all"
                checked={targetMode === 'all'}
                onChange={(e) => setTargetMode(e.target.value)}
                className="w-4 h-4 text-ember-500 focus:ring-ember-500"
                data-testid="target-all"
              />
              <Text>All Devices ({devices.length})</Text>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="targetMode"
                value="specific"
                checked={targetMode === 'specific'}
                onChange={(e) => setTargetMode(e.target.value)}
                className="w-4 h-4 text-ember-500 focus:ring-ember-500"
                data-testid="target-specific"
              />
              <Text>Specific Device</Text>
            </label>
          </div>

          {targetMode === 'specific' && (
            <div className="ml-7 mt-3">
              {loadingDevices ? (
                <Text variant="tertiary" size="sm">Loading devices...</Text>
              ) : devices.length === 0 ? (
                <Text variant="tertiary" size="sm">No devices registered</Text>
              ) : (
                <select
                  value={selectedDevice || ''}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-slate-200 focus:border-ember-500 focus:ring-1 focus:ring-ember-500"
                  data-testid="device-selector"
                >
                  <option value="">Select a device</option>
                  {devices.map((device) => (
                    <option key={device.tokenKey} value={device.token}>
                      {device.displayName} - {device.browser} on {device.os}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <Heading level={2} size="lg" className="mb-4">Message Content</Heading>

        <div className="space-y-4">
          <div>
            <Text variant="tertiary" size="sm" className="mb-2">Template</Text>
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-slate-200 focus:border-ember-500 focus:ring-1 focus:ring-ember-500"
              data-testid="test-template"
            >
              {Object.entries(templates).map(([key, tpl]) => (
                <option key={key} value={key}>
                  {key === 'custom' ? 'Custom Message' : tpl.title}
                </option>
              ))}
            </select>
            {selectedTemplate?.description && (
              <Text variant="tertiary" size="xs" className="mt-1">
                {selectedTemplate.description}
              </Text>
            )}
          </div>

          {!isCustom && selectedTemplate ? (
            <div className="p-4 bg-slate-800/50 border border-white/10 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-2">Preview:</Text>
              <Text weight="semibold">{selectedTemplate.title}</Text>
              <Text size="sm" className="mt-1">{selectedTemplate.body}</Text>
            </div>
          ) : (
            <>
              <div>
                <Text variant="tertiary" size="sm" className="mb-2">Title</Text>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter notification title"
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-ember-500 focus:ring-1 focus:ring-ember-500"
                  data-testid="custom-title"
                />
              </div>

              <div>
                <Text variant="tertiary" size="sm" className="mb-2">Body</Text>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Enter notification body"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-ember-500 focus:ring-1 focus:ring-ember-500"
                  data-testid="custom-body"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <Heading level={2} size="lg" className="mb-4">Priority Level</Heading>
        <div className="space-y-3">
          {priorities.map(p => (
            <label key={p.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value={p.value}
                checked={priority === p.value}
                onChange={(e) => setPriority(e.target.value)}
                className="w-4 h-4 mt-1 text-ember-500 focus:ring-ember-500 bg-slate-800 border-white/20"
                data-testid={`priority-${p.value}`}
              />
              <div>
                <Text weight="medium">{p.label}</Text>
                <Text variant="tertiary" size="xs">{p.description}</Text>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Button
          variant="ember"
          size="lg"
          fullWidth
          onClick={handleSend}
          disabled={!isFormValid() || sending}
          loading={sending}
          data-testid="send-test-notification"
        >
          {sending ? 'Sending...' : 'Send Test Notification'}
        </Button>
      </Card>

      {result && (
        <Card className={`p-6 border-2 ${result.success ? 'border-sage-500/30' : 'border-danger-500/30'}`} data-testid="delivery-status">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{result.success ? '✅' : '❌'}</span>
            <div className="flex-1">
              <Heading level={3} size="lg" className="mb-3">
                {result.success ? 'Notification Sent' : 'Send Failed'}
              </Heading>

              {result.success && result.trace && (
                <>
                  <Text size="sm" className="mb-4">
                    Notification should arrive within 5 seconds
                  </Text>

                  <div className="space-y-2 p-4 bg-slate-800/50 border border-white/10 rounded-lg">
                    <Text variant="tertiary" size="xs" className="mb-2">Delivery Trace:</Text>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Text variant="tertiary" size="xs">Sent at</Text>
                        <Text size="sm">{new Date(result.trace.sentAt).toLocaleTimeString()}</Text>
                      </div>
                      <div>
                        <Text variant="tertiary" size="xs">Target devices</Text>
                        <Text size="sm">{result.trace.targetDevices}</Text>
                      </div>
                      <div>
                        <Text variant="tertiary" size="xs">Delivered</Text>
                        <Text size="sm" variant="sage">{result.trace.deliveryResults.successCount}</Text>
                      </div>
                      <div>
                        <Text variant="tertiary" size="xs">Failed</Text>
                        <Text size="sm" variant={result.trace.deliveryResults.failureCount > 0 ? 'danger' : 'tertiary'}>
                          {result.trace.deliveryResults.failureCount}
                        </Text>
                      </div>
                    </div>

                    {result.trace.template && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <Text variant="tertiary" size="xs">Template used</Text>
                        <Text size="sm">{result.trace.template}</Text>
                      </div>
                    )}

                    {result.success && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <Text variant="tertiary" size="xs" className="flex items-center gap-2">
                          <span>📝</span>
                          Logged to notification history
                        </Text>
                      </div>
                    )}

                    {result.trace.deliveryResults.errors?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <Text variant="tertiary" size="xs" className="mb-2">Errors:</Text>
                        {result.trace.deliveryResults.errors.map((err, idx) => (
                          <Text key={idx} size="xs" variant="danger">
                            {err.errorCode} - {err.tokenPrefix}
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {!result.success && (
                <Text size="sm" variant="danger">
                  {result.error || 'Unknown error occurred'}
                </Text>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Test History Info */}
      <Card className="p-6 bg-slate-800/30 border border-white/5">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <Heading level={3} size="md" className="mb-2">
              About Test Notifications
            </Heading>
            <div className="space-y-2">
              <Text size="sm" variant="secondary">
                Test notifications are logged like production notifications and appear in
                <a href="/settings/notifications/history" className="text-ember-400 hover:underline ml-1">
                  Notification History
                </a>.
              </Text>
              <Text size="sm" variant="secondary">
                Use CRITICAL priority to test DND bypass - CRITICAL notifications ignore quiet hours.
              </Text>
              <Text size="sm" variant="secondary">
                Bulk testing (All Devices) sends to every registered device for the current user.
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
