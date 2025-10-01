import { APP_VERSION, APP_AUTHOR } from '@/lib/version';

export default function Footer({ className = '' }) {
  return (
    <footer
      className={`
        w-full py-6 mt-auto
        bg-white/80 backdrop-blur-sm
        border-t border-neutral-200/50
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <span className="text-red-500 text-base">❤️</span>
            <span>by <strong className="text-neutral-900">{APP_AUTHOR}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">•</span>
            <span>Versione <strong className="text-neutral-900">{APP_VERSION}</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
