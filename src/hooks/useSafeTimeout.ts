import { useRef, useEffect, useCallback } from 'react'

/**
 * Returns a `safeTimeout` function that automatically clears all
 * pending timeouts when the component unmounts.
 */
export function useSafeTimeout() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timers.current.forEach(clearTimeout)
    }
  }, [])

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter(t => t !== id)
      fn()
    }, ms)
    timers.current.push(id)
    return id
  }, [])

  return safeTimeout
}
