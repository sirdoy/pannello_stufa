'use client';

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Text } from '@/app/components/ui';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  status: string;
  timestamp: string;
}

interface NotificationItemProps {
  notification: Notification;
}

interface StatusStyle {
  text: string;
  className: string;
}

/**
 * Get icon for notification type
 */
const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    error: '🚨',
    scheduler: '⏰',
    maintenance: '🔧',
    test: '🧪',
    generic: 'ℹ️',
  };
  return (icons[type] ?? icons.generic)!;
};

/**
 * Get status badge styling
 */
const getStatusStyle = (status: string): StatusStyle => {
  const styles: Record<string, StatusStyle> = {
    sent: {
      text: 'Inviata',
      className: 'bg-ocean-500/20 text-ocean-400 [html:not(.dark)_&]:bg-ocean-100 [html:not(.dark)_&]:text-ocean-700',
    },
    delivered: {
      text: 'Consegnata',
      className: 'bg-sage-500/20 text-sage-400 [html:not(.dark)_&]:bg-sage-100 [html:not(.dark)_&]:text-sage-700',
    },
    failed: {
      text: 'Fallita',
      className: 'bg-ember-500/20 text-ember-400 [html:not(.dark)_&]:bg-ember-100 [html:not(.dark)_&]:text-ember-700',
    },
  };
  return (styles[status] ?? styles.sent)!;
};

/**
 * Get type label in Italian
 */
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    error: 'Errore',
    scheduler: 'Scheduler',
    maintenance: 'Manutenzione',
    test: 'Test',
    generic: 'Sistema',
  };
  return labels[type] || type;
};

export default function NotificationItem({ notification }: NotificationItemProps) {
  const statusStyle = getStatusStyle(notification.status);

  return (
    <div className="p-4 border-b border-slate-700/50 [html:not(.dark)_&]:border-slate-200 last:border-b-0" data-testid="notification-item">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-2xl flex-shrink-0">{getTypeIcon(notification.type)}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <Text weight="semibold" className="truncate">
              {notification.title}
            </Text>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${statusStyle.className}`}>
              {statusStyle.text}
            </span>
          </div>

          {/* Body */}
          <Text variant="secondary" size="sm" className="line-clamp-2 mb-2">
            {notification.body}
          </Text>

          {/* Footer - type and time */}
          <div className="flex items-center gap-3">
            <Text variant="tertiary" size="xs">
              {getTypeLabel(notification.type)}
            </Text>
            <Text variant="tertiary" size="xs">
              •
            </Text>
            <Text variant="tertiary" size="xs">
              {formatDistanceToNow(new Date(notification.timestamp), {
                addSuffix: true,
                locale: it,
              })}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
