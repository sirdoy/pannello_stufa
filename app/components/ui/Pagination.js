export default function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  hasPrev,
  hasNext,
}) {
  return (
    <div className="flex justify-between items-center pt-4">
      <button
        onClick={onPrevious}
        disabled={!hasPrev}
        className={`px-4 py-2 rounded ${
          hasPrev ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        ◀ Precedente
      </button>
      <span className="text-sm text-gray-600">
        Pagina {currentPage + 1} di {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`px-4 py-2 rounded ${
          hasNext ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Successivo ▶
      </button>
    </div>
  );
}