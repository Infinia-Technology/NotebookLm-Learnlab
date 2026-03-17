import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
  showSelectedChips?: boolean;
  allLabel?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder: _placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
  maxSelections,
  showSelectedChips = true,
  allLabel = 'All',
}: MultiSelectProps) {
  void _placeholder; // Placeholder reserved for future use
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = selected.length === 0;
  const selectedCount = selected.length;
  const isMaxReached = maxSelections !== undefined && selected.length >= maxSelections;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (!isMaxReached) {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getDisplayText = () => {
    if (isAllSelected) return allLabel;
    if (selectedCount === 1) {
      const option = options.find((o) => o.value === selected[0]);
      return option?.label || '1 selected';
    }
    return `${selectedCount} selected`;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors',
          'bg-white border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-blue-500 border-blue-500'
        )}
      >
        <span className={cn('truncate', isAllSelected && 'text-slate-600')}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1">
          {!isAllSelected && !disabled && (
            <X
              className="h-4 w-4 text-slate-400 hover:text-slate-600"
              onClick={handleClearAll}
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

      {/* Selected Chips (below trigger) */}
      {showSelectedChips && !isAllSelected && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.slice(0, 5).map((value) => {
            const option = options.find((o) => o.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg"
              >
                <span className="truncate max-w-[120px]">{option?.label || value}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:text-blue-900"
                  onClick={(e) => handleRemove(value, e)}
                />
              </span>
            );
          })}
          {selected.length > 5 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg">
              +{selected.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {/* All Option */}
            {!search && (
              <button
                type="button"
                onClick={handleSelectAll}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                  isAllSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                )}
              >
                <span className="font-medium">{allLabel}</span>
                {isAllSelected && <Check className="h-4 w-4 text-blue-600" />}
              </button>
            )}

            {/* Divider */}
            {!search && <div className="border-t border-slate-100" />}

            {/* Options */}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                const isDisabled = option.disabled || (!isSelected && isMaxReached);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !isDisabled && handleToggle(option.value)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                      isSelected && 'bg-blue-50 text-blue-700',
                      isDisabled && 'opacity-50 cursor-not-allowed',
                      !isDisabled && !isSelected && 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center',
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-slate-300'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {maxSelections && (
            <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500">
              {selectedCount}/{maxSelections} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
