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
const SCROLL_DEBOUNCE_MS = 120; // ms to wait after last scroll event

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ScrollWheelPicker
 *
 * A mobile-friendly scroll-wheel selector. Uses debounced scroll-end detection
 * and ref-based state to avoid the render-loop that causes "jumping" values.
 */
export function ScrollWheelPicker({
  items,
  value,
  onChange,
  placeholder = 'Select',
  disabled = false,
  hasError = false,
  visibleCount = 5,
}: ScrollWheelPickerProps) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Refs to break the re-render cycle ──
  // Track whether the user is actively scrolling so we don't fight them
  const isUserScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the last value we committed to avoid redundant onChange calls
  const committedValue = useRef(value);

  const halfVisible = Math.floor(visibleCount / 2);
  const listHeight = visibleCount * ITEM_HEIGHT;

  const selectedIndex = items.findIndex((item) => item.value === value);

  // ── Scroll to a specific index (no onChange, just visual) ──
  const scrollToIndex = useCallback((index: number, smooth = false) => {
    if (!scrollRef.current) return;
    const top = index * ITEM_HEIGHT;
    if (smooth) {
      scrollRef.current.scrollTo({ top, behavior: 'smooth' });
    } else {
      scrollRef.current.scrollTop = top;
    }
  }, []);

  // ── On open: jump to the selected item instantly ──
  useEffect(() => {
    if (open) {
      // Use rAF to ensure the DOM is painted before we scroll
      requestAnimationFrame(() => {
        const idx = selectedIndex >= 0 ? selectedIndex : 0;
        scrollToIndex(idx, false);
      });
    }
  }, [open, selectedIndex, scrollToIndex]);

  // ── When value changes externally (and we're not scrolling), sync scroll ──
  useEffect(() => {
    if (!open || isUserScrolling.current) return;
    committedValue.current = value;
    const idx = items.findIndex((item) => item.value === value);
    if (idx >= 0) {
      scrollToIndex(idx, false);
    }
  }, [value, open, items, scrollToIndex]);

  // ── Close on click outside ──
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

  // ── Debounced scroll-end handler ──
  // Only commits the value AFTER scrolling stops for SCROLL_DEBOUNCE_MS.
  // This prevents the re-render loop that causes jumping.
  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;

    // Clear any pending commit
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }

    // Schedule a commit after scrolling stops
    scrollTimer.current = setTimeout(() => {
      isUserScrolling.current = false;

      if (!scrollRef.current) return;
      const scrollTop = scrollRef.current.scrollTop;
      const centeredIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, centeredIndex));

      // Snap to the nearest item center
      scrollRef.current.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });

      // Only fire onChange if the value actually changed
      const newValue = items[clampedIndex]?.value;
      if (newValue && newValue !== committedValue.current) {
        committedValue.current = newValue;
        onChange(newValue);
      }
    }, SCROLL_DEBOUNCE_MS);
  }, [items, onChange]);

  // ── Cleanup timer on unmount ──
  useEffect(() => {
    return () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  // ── Click on an item: scroll to it and commit ──
  const handleItemClick = useCallback((index: number) => {
    isUserScrolling.current = false;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);

    scrollToIndex(index, true);

    const newValue = items[index]?.value;
    if (newValue && newValue !== committedValue.current) {
      committedValue.current = newValue;
      onChange(newValue);
    }
  }, [items, onChange, scrollToIndex]);

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

      {/* Scroll wheel dropdown — positioned so highlight band overlays the trigger */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 rounded-md border bg-popover shadow-lg overflow-hidden"
          style={{
            height: listHeight,
            // Position so the center highlight band sits exactly on the trigger button
            top: -(halfVisible * ITEM_HEIGHT),
          }}
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
            className="h-full overflow-y-auto scrollbar-hide"
            onScroll={handleScroll}
            style={{
              paddingTop: halfVisible * ITEM_HEIGHT,
              paddingBottom: halfVisible * ITEM_HEIGHT,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {items.map((item, index) => (
              <div
                key={item.value}
                onClick={() => handleItemClick(index)}
                className={cn(
                  'flex items-center justify-center cursor-pointer select-none transition-colors',
                  'text-sm',
                  item.value === value
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
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
