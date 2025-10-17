import Image from 'next/image';

export default function LogEntry({ entry, formatDate, getIcon, getDeviceBadge }) {
  const deviceBadge = getDeviceBadge ? getDeviceBadge(entry.device) : null;

  const badgeColorClasses = {
    primary: 'bg-primary-100 text-primary-700 border-primary-200',
    info: 'bg-info-100 text-info-700 border-info-200',
    warning: 'bg-warning-100 text-warning-700 border-warning-200',
    success: 'bg-success-100 text-success-700 border-success-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  };

  return (
    <li className="border-b border-neutral-200 pb-4 mb-4 last:border-b-0 flex items-start gap-3">
      <div className="text-2xl mt-1 flex-shrink-0">{getIcon(entry.action, entry.device)}</div>
      <div className="flex-1 min-w-0">
        {/* User & Device Badge Row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* User Info */}
          {entry.user && (
            <div className="flex items-center gap-2">
              {entry.user.picture && (
                <Image
                  src={entry.user.picture}
                  alt={entry.user.name || entry.user.email}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm font-semibold text-neutral-700">
                {entry.user.name || entry.user.email}
              </span>
            </div>
          )}

          {/* Device Badge */}
          {deviceBadge && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                badgeColorClasses[deviceBadge.color] || badgeColorClasses.neutral
              }`}
            >
              {deviceBadge.icon && <span>{deviceBadge.icon}</span>}
              <span>{deviceBadge.label}</span>
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-neutral-500 mb-2">{formatDate(entry.timestamp)}</div>

        {/* Action */}
        <div className="text-base font-medium text-neutral-900">
          {entry.action}
          {entry.value !== undefined && entry.value !== null && (
            <span className="ml-2 text-primary-600 font-semibold">→ {entry.value}</span>
          )}
        </div>

        {/* Optional Metadata */}
        {(entry.day || entry.roomName) && (
          <div className="text-xs text-neutral-500 mt-2 space-y-0.5">
            {entry.day && <div>Giorno: {entry.day}</div>}
            {entry.roomName && <div>Stanza: {entry.roomName}</div>}
          </div>
        )}
      </div>
    </li>
  );
}