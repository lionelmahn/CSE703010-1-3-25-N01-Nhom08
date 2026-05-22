import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PER_PAGE_OPTIONS = [10, 20, 50];

const Pagination = ({ meta, page, onPageChange, perPage, onPerPageChange }) => {
  const lastPage = meta?.last_page || 1;
  const total = meta?.total || 0;
  const from = total === 0 ? 0 : (page - 1) * (meta?.per_page || perPage) + 1;
  const to = Math.min(page * (meta?.per_page || perPage), total);

  const goTo = (next) => {
    const p = Math.max(1, Math.min(lastPage, next));
    if (p !== page) onPageChange(p);
  };

  // Compact page list: <prev> 1 ... cur-1 cur cur+1 ... last <next>
  const pages = [];
  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i += 1) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i += 1) pages.push(i);
    if (page < lastPage - 2) pages.push('…');
    pages.push(lastPage);
  }

  return (
    <div className="p-2 border-t flex flex-col sm:flex-row gap-2 justify-between items-center text-xs text-gray-500 bg-white">
      <span>
        Hien thi <strong>{from}</strong> - <strong>{to}</strong> trong tong so <strong>{total}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 border rounded hover:bg-gray-50 disabled:opacity-40 flex items-center justify-center"
          aria-label="Trang truoc"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) => (
          p === '…' ? (
            <span key={`dot-${i}`} className="px-1 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              className={`w-7 h-7 border rounded ${
                p === page
                  ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold'
                  : 'hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        ))}
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= lastPage}
          className="w-7 h-7 border rounded hover:bg-gray-50 disabled:opacity-40 flex items-center justify-center"
          aria-label="Trang sau"
        >
          <ChevronRight size={14} />
        </button>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="ml-2 border rounded py-1 px-1 focus:outline-none"
        >
          {PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt} / trang
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
