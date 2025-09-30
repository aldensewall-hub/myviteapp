import { useState, useEffect, useRef } from 'react';

export interface SearchBarProps {
  placeholder?: string;
  minLength?: number;
  debounceMs?: number;
  onSearch: (query: string) => void;
  autoFocus?: boolean;
}

/**
 * SearchBar component
 * - Debounces user input before invoking onSearch
 * - Calls onSearch immediately if user presses Enter
 */
export function SearchBar({
  placeholder = 'Search movies & shows...',
  minLength = 2,
  debounceMs = 400,
  onSearch,
  autoFocus = true,
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Debounce search
    if (value.length < minLength) return; // don't search too-short queries
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onSearch(value.trim());
    }, debounceMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value, minLength, debounceMs, onSearch]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim().length >= minLength) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      onSearch(value.trim());
    }
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        aria-label="Movie and show search"
      />
    </div>
  );
}

export default SearchBar;
