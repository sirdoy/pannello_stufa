'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

export default function TestNotificationPage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Form state
  const [targetMode, setTargetMode] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [template, setTemplate] = useState('custom');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // Template definitions (match API)
  const templates = {
    custom: { title: '', body: '', description: 'Write your own message' },
    error_alert: {
      title: 'Errore Stufa',
      body: 'Attenzione: rilevato errore nel sistema. Verifica lo stato della stufa.',
      description: 'Error alert with high priority'
    },
    scheduler_success: {
      title: 'Accensione Completata',
      body: 'La stufa e stata accesa automaticamente dallo scheduler.',
      description: 'Scheduler success notification'
    },
    maintenance_reminder: {
      title: 'Promemoria Manutenzione',
      body: 'E il momento di effettuare la pulizia ordinaria della stufa.',
      description: 'Maintenance reminder'
    }
  };

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
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

  const handleSend = async () => {
    setSending(true);
    setResult(null);

    try {
      const body = {};

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
        error: 'Failed to send notification: ' + err.message
      });
    } finally {
      setSending(false);
    }
  };

  const isFormValid = () => {
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
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-slate-200 focus:border-ember-500 focus:ring-1 focus:ring-ember-500"
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
                />
              </div>
            </>
          )}
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
        >
          {sending ? 'Sending...' : 'Send Test Notification'}
        </Button>
      </Card>

      {result && (
        <Card className={`p-6 border-2 ${result.success ? 'border-sage-500/30' : 'border-danger-500/30'}`}>
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
    </div>
  );
}
