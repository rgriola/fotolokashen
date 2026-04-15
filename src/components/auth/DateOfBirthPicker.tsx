'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { ScrollWheelPicker } from '@/components/ui/ScrollWheelPicker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateOfBirthPickerProps {
  /** Called with an ISO date string "YYYY-MM-DD" or empty string */
  onChange: (value: string) => void;
  value?: string;
  disabled?: boolean;
  hasError?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function getDaysInMonth(month: string, year: string): number {
  if (!month || !year) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

function buildDays(month: string, year: string) {
  const max = getDaysInMonth(month, year);
  return Array.from({ length: max }, (_, i) => {
    const val = String(i + 1).padStart(2, '0');
    return { value: val, label: String(i + 1) };
  });
}

function buildYears() {
  const current = new Date().getFullYear();
  const maxYear = current - 18; // Must be ≥18
  const minYear = current - 100;
  const years: { value: string; label: string }[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DateOfBirthPicker
 *
 * - Blank by default (never pre-selects today)
 * - Three scroll-wheel pickers: Month / Day / Year
 * - Year range: 18–100 years ago (enforces minimum age at the picker level)
 * - Outputs ISO "YYYY-MM-DD" string for the backend
 */
export function DateOfBirthPicker({
  onChange,
  value,
  disabled = false,
  hasError = false,
}: DateOfBirthPickerProps) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  // Hydrate from external value (e.g. react-hook-form reset)
  useEffect(() => {
    if (value && value.length === 10) {
      const [y, m, d] = value.split('-');
      setYear(y || '');
      setMonth(m || '');
      setDay(d || '');
    }
  }, [value]);

  // Propagate changes upward
  useEffect(() => {
    if (month && day && year) {
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, day, year]);

  // Clamp day if month/year combo has fewer days
  useEffect(() => {
    if (day && month && year) {
      const maxDay = getDaysInMonth(month, year);
      if (parseInt(day) > maxDay) {
        setDay(String(maxDay).padStart(2, '0'));
      }
    }
  }, [month, year, day]);

  const days = buildDays(month, year);
  const years = buildYears();

  return (
    <div className="space-y-1.5">
      <Label className="text-xs sm:text-sm">Date of Birth</Label>
      {/* Three scroll-wheel pickers side-by-side */}
      <div className="grid grid-cols-3 gap-2">
        <ScrollWheelPicker
          items={MONTHS}
          value={month}
          onChange={setMonth}
          placeholder="Month"
          disabled={disabled}
          hasError={hasError}
          visibleCount={7}
        />
        <ScrollWheelPicker
          items={days}
          value={day}
          onChange={setDay}
          placeholder="Day"
          disabled={disabled}
          hasError={hasError}
          visibleCount={7}
        />
        <ScrollWheelPicker
          items={years}
          value={year}
          onChange={setYear}
          placeholder="Year"
          disabled={disabled}
          hasError={hasError}
          visibleCount={7}
        />
      </div>
      <p className="text-xs text-muted-foreground">Must be at least 18 years old.</p>
    </div>
  );
}
