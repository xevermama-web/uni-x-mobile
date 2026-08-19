import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, Theme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { value: Theme; label: string; sublabel: string; icon: React.ElementType }[] = [
    {
      value: 'system',
      label: 'System',
      sublabel: 'Device Settings',
      icon: Monitor,
    },
    {
      value: 'light',
      label: 'Light',
      sublabel: 'Default theme',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      sublabel: 'Dark theme',
      icon: Moon,
    },
  ];

  const getTriggerIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform group-hover:scale-105" />;
    }
    if (resolvedTheme === 'dark') {
      return <Moon className="w-5 h-5 text-blue-400 transition-transform group-hover:scale-105" />;
    }
    return <Sun className="w-5 h-5 text-amber-500 transition-transform group-hover:scale-105" />;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group p-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
        title="Toggle theme (System, Light, Dark)"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {getTriggerIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xl py-2 z-[999] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-700/50">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
              Appearance
            </p>
          </div>

          <div className="space-y-0.5 px-1.5">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold leading-none mb-0.5">{option.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
                        {option.sublabel}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
