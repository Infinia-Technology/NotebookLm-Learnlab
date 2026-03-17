import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface GroupedOption {
  value: string;
  label: string;
  group: string;
  disabled?: boolean;
}

interface GroupedSelectProps {
  options: GroupedOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
}

// Colors for selected items
const entityColors = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
];

export function GroupedSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select companies to compare...',
  searchPlaceholder = 'Search companies...',
  className,
  disabled = false,
  maxSelections = 5,
}: GroupedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Group options by their group name
  const groupedOptions = useMemo(() => {
    const groups: Record<string, GroupedOption[]> = {};

    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.group.toLowerCase().includes(search.toLowerCase())
    );

    filtered.forEach((option) => {
      if (!groups[option.group]) {
        groups[option.group] = [];
      }
      groups[option.group].push(option);
    });

    // Sort groups alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [options, search]);

  const isMaxReached = selected.length >= maxSelections;

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

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected Items Display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((value, index) => {
            const option = options.find((o) => o.value === value);
            const color = entityColors[index % entityColors.length];
            return (
              <div
                key={value}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
                  color.bg,
                  color.text,
                  color.border
                )}
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/50 text-xs font-bold">
                  #{index + 1}
                </span>
                <span className="text-sm font-medium truncate max-w-[180px]">
                  {option?.label || value}
                </span>
                <X
                  className="h-4 w-4 cursor-pointer hover:opacity-70"
                  onClick={(e) => handleRemove(value, e)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm transition-colors',
          'bg-white border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-blue-500 border-blue-500'
        )}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <span className={cn(selected.length === 0 && 'text-slate-400')}>
            {selected.length === 0
              ? placeholder
              : `${selected.length}/${maxSelections} selected`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && !disabled && (
            <span
              className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              onClick={handleClearAll}
            >
              Clear
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-100">
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

          {/* Grouped Options List */}
          <div className="max-h-80 overflow-y-auto">
            {groupedOptions.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500 text-center">
                No companies found
              </div>
            ) : (
              groupedOptions.map(([groupName, groupOptions]) => (
                <div key={groupName}>
                  {/* Group Header */}
                  <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 sticky top-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {groupName}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      ({groupOptions.length})
                    </span>
                  </div>

                  {/* Group Options */}
                  {groupOptions.map((option) => {
                    const isSelected = selected.includes(option.value);
                    const selectedIndex = selected.indexOf(option.value);
                    const isDisabled = option.disabled || (!isSelected && isMaxReached);
                    const color = selectedIndex >= 0 ? entityColors[selectedIndex % entityColors.length] : null;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !isDisabled && handleToggle(option.value)}
                        disabled={isDisabled}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                          isSelected && color && `${color.bg} ${color.text}`,
                          isDisabled && !isSelected && 'opacity-50 cursor-not-allowed',
                          !isDisabled && !isSelected && 'hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center text-xs font-bold',
                              isSelected && color
                                ? `${color.bg} ${color.border} ${color.text}`
                                : 'border-slate-300 bg-white'
                            )}
                          >
                            {isSelected ? (
                              <span>#{selectedIndex + 1}</span>
                            ) : (
                              <Check className="h-3 w-3 text-transparent" />
                            )}
                          </div>
                          <span className="truncate">{option.label}</span>
                        </div>
                        {isSelected && (
                          <Check className={cn('h-4 w-4', color?.text)} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs text-slate-500">
              {selected.length}/{maxSelections} companies selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
