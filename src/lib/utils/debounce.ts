/**
 * Debounce utility to prevent rapid repeated function calls
 * Useful for preventing duplicate saves, searches, or other actions
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 *
 * @example
 * const debouncedSave = debounce(saveFunction, 300);
 * button.onClick = debouncedSave;
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    // Clear existing timeout
    if (timeout) {
      clearTimeout(timeout);
    }

    // Set new timeout
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create a debounced function that only executes once, ignoring subsequent calls
 * Useful for preventing double-clicks on buttons
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to wait before allowing another call
 * @returns A debounced version that ignores rapid calls
 *
 * @example
 * const handleSave = debounceLeading(saveFunction, 1000);
 * // First click executes immediately, subsequent clicks within 1s are ignored
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let isExecuting = false;

  return function executedFunction(...args: Parameters<T>) {
    // If already executing, ignore this call
    if (isExecuting) {
      return;
    }

    // Execute immediately
    isExecuting = true;
    func(...args);

    // Clear the flag after wait period
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      isExecuting = false;
      timeout = null;
    }, wait);
  };
}
