import Image from 'next/image';

export default function LogEntry({ entry, formatDate, getIcon }) {
  return (
    <li className="border-b pb-3 flex items-start gap-3">
      <div className="text-2xl mt-1">{getIcon(entry.action)}</div>
      <div className="flex-1">
        {/* Informazioni utente */}
        {entry.user && (
          <div className="flex items-center gap-2 mb-2">
            {entry.user.picture && (
              <Image
                src={entry.user.picture}
                alt={entry.user.name || entry.user.email}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="text-sm font-semibold text-gray-700">
              {entry.user.name || entry.user.email}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 mb-1">{formatDate(entry.timestamp)}</div>

        {/* Azione */}
        <div className="text-base font-medium text-gray-900">
          {entry.action}
          {entry.value !== undefined && (
            <span className="ml-2 text-blue-600 font-semibold">→ {entry.value}</span>
          )}
        </div>

        {/* Metadata opzionale */}
        {entry.day && (
          <div className="text-xs text-gray-500 mt-1">
            Giorno: {entry.day}
          </div>
        )}
      </div>
    </li>
  );
}