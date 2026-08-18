import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search…', label }: SearchBarProps) {
  return (
    <div className="searchbar">
      <Search aria-hidden="true" />
      <input
        className="input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
      />
      {value && (
        <button
          type="button"
          className="searchbar-clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <X />
        </button>
      )}
    </div>
  );
}