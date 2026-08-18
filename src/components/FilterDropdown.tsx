import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '../hooks';
import { classNames } from '../utils/format';

export interface DropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  align?: 'left' | 'right';
  head?: string;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  align = 'left',
  head,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const selected = options.find((o) => o.value === value);

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="dropdown-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
        {selected && <span className="filter-value">{selected.label}</span>}
        <ChevronDown size={14} className="chev" />
      </button>
      {open && (
        <div className={classNames('dropdown-menu', align === 'right' && 'align-right')} role="listbox">
          {head && <div className="dropdown-menu-head">{head}</div>}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={classNames('dropdown-item', option.value === value && 'selected')}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              {option.value === value && <Check size={14} className="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}