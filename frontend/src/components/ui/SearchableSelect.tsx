import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
  clearable = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((o) => o.value === value);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened and calculate position
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearch('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors',
          'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-400'
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-slate-400 dark:text-gray-500')}>
          {selectedOption?.label || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {clearable && value && !disabled && (
            <X
              className="h-4 w-4 text-slate-400 hover:text-slate-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown Panel - rendered in portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                    index === highlightedIndex && 'bg-slate-50 dark:bg-gray-800',
                    option.value === value && 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                    option.disabled && 'opacity-50 cursor-not-allowed',
                    !option.disabled && (index !== highlightedIndex && option.value !== value) && 'text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
