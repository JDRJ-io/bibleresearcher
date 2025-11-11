import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useUsernameAvailability(username: string) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Reset state when the input changes
    setError(null)
    setAvailable(null)

    const name = (username || '').trim()
    if (!name || name.length < 3) {
      // empty input or too short ⇒ nothing to check
      return
    }

    // Debounce
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      // Cancel previous request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        setLoading(true)
        
        // Use Supabase Edge Function for enterprise-grade username checking
        const { data, error } = await supabase().functions.invoke('username-available', {
          body: { u: name }
        })

        if (error) {
          throw new Error(error.message || 'Failed to check username availability')
        }

        if (!data?.ok) {
          setError(data?.error || 'Failed to check username availability')
          setAvailable(null)
        } else {
          setAvailable(data.available)
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError' && e?.message !== 'The user aborted a request.') {
          console.error('Username availability check error:', e)
          setError(String(e?.message ?? e))
          setAvailable(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 350)

    // Cleanup on unmount/username change
    return () => {
      abortRef.current?.abort()
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [username]) // IMPORTANT: only depends on username

  return { available, loading, error }
}