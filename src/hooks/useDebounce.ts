import { useState, useEffect } from 'react'

/**
 * A custom hook that debounces a value by the specified delay.
 * Useful for search inputs to avoid excessive API calls.
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedSearch = useDebounce(searchQuery, 300)
 * 
 * useEffect(() => {
 *   // This will only run after 300ms of no changes to searchQuery
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
