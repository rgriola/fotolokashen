'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrollWheelPickerProps {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  /** Number of visible items (should be odd for center alignment). Default: 7 */
  visibleCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 36; // px per row

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ScrollWheelPicker
 *
 * A mobile-friendly scroll-wheel selector. Shows `visibleCount` items at
 * a time with the selected item centered and highlighted. The user scrolls
 * or clicks to navigate.
 *
 * Works inside a Popover: the trigger shows the currently-selected label (or placeholder).
 * The wheel dropdown appears on click.
 */
export function ScrollWheelPicker({
  items,
  value,
  onChange,
  placeholder = 'Select',
  disabled = false,
  hasError = false,
  visibleCount = 7,
}: ScrollWheelPickerProps) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // The number of "buffer" rows above/below the center slot
  const halfVisible = Math.floor(visibleCount / 2);
  const listHeight = visibleCount * ITEM_HEIGHT;

  // Find current index
  const selectedIndex = items.findIndex((item) => item.value === value);

  // On open, scroll to selected item (or middle-ish)
  useEffect(() => {
    if (open && scrollRef.current) {
      const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
      scrollRef.current.scrollTop = targetIndex * ITEM_HEIGHT;
    }
  }, [open, selectedIndex]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Determine which item is centered based on scroll position
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const centeredIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, centeredIndex));
    if (items[clampedIndex] && items[clampedIndex].value !== value) {
      onChange(items[clampedIndex].value);
    }
  }, [items, onChange, value]);

  // On item click, scroll to it and select
  const handleItemClick = useCallback((index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
    onChange(items[index].value);
  }, [items, onChange]);

  const selectedLabel = selectedIndex >= 0 ? items[selectedIndex].label : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors',
          'h-9 sm:h-10',
          'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus:ring-destructive/50',
          !value && 'text-muted-foreground',
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Scroll wheel dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden"
          style={{ height: listHeight }}
        >
          {/* Center highlight band */}
          <div
            className="pointer-events-none absolute left-0 right-0 bg-accent/60 border-y border-accent-foreground/10 z-10"
            style={{
              top: halfVisible * ITEM_HEIGHT,
              height: ITEM_HEIGHT,
            }}
          />

          {/* Top/bottom fade gradients */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-popover to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-popover to-transparent z-10" />

          {/* Scrollable list */}
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto scroll-smooth snap-y snap-mandatory"
            onScroll={handleScroll}
            style={{
              scrollSnapType: 'y mandatory',
              // Pad top/bottom so first/last items can center
              paddingTop: halfVisible * ITEM_HEIGHT,
              paddingBottom: halfVisible * ITEM_HEIGHT,
            }}
          >
            {items.map((item, index) => (
              <div
                key={item.value}
                onClick={() => handleItemClick(index)}
                className={cn(
                  'flex items-center justify-center cursor-pointer select-none transition-all snap-start',
                  'text-sm hover:text-foreground',
                  item.value === value
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                )}
                style={{ height: ITEM_HEIGHT }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
