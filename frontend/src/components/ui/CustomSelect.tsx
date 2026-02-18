import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    className?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    helperText?: string;
}

export const CustomSelect = ({
    value,
    onChange,
    options,
    className,
    placeholder = 'Select option',
    label,
    error,
    helperText
}: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [isOpen]);

    // Update position on scroll/resize
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }
        };

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={cn("w-full transition-all duration-200", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium transition-all duration-200 border rounded-xl shadow-sm",
                    "bg-white dark:bg-gray-800/60 backdrop-blur-sm border-gray-200 dark:border-gray-700",
                    "text-gray-900 dark:text-white hover:border-sky-400 dark:hover:border-sky-500",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                    isOpen && "border-sky-500 ring-2 ring-sky-500/20",
                    error && "border-red-500 dark:border-red-400 ring-red-500/10 focus:ring-red-500/20"
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-gray-400 dark:text-gray-500")}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-300",
                    isOpen && "rotate-180"
                )} />
            </button>

            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-top-1">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {helperText}
                </p>
            )}

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className={cn(
                        "fixed z-[9999] mt-0 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200",
                    )}
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                    }}
                >
                    <div className="p-1 max-h-80 overflow-y-auto scroll-smooth pb-4">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-all duration-200 rounded-lg group",
                                    value === option.value
                                        ? "bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 font-bold"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-sky-600 dark:hover:text-sky-300"
                                )}
                            >
                                <span className="truncate group-hover:translate-x-0.5 transition-transform duration-200">{option.label}</span>
                                {value === option.value && <Check className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
