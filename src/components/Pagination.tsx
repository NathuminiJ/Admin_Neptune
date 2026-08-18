import { ChevronLeft, ChevronRight } from 'lucide-react';
import { classNames } from '../utils/format';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const items: Array<number | 'ellipsis'> = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i += 1) items.push(i);
  } else {
    items.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(pages - 1, page + 1);
    if (start > 2) items.push('ellipsis');
    for (let i = start; i <= end; i += 1) items.push(i);
    if (end < pages - 1) items.push('ellipsis');
    items.push(pages);
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {total}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {items.map((item, idx) =>
          item === 'ellipsis' ? (
            <span key={`e-${idx}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={classNames('page-btn', item === page && 'active')}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className="page-btn"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}