import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabaseClient'
import { LoadingWheel } from '@/components/LoadingWheel'

export default function AuthCallback() {
  const [, setLocation] = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase v2 passes full JSON in `access_token` & friends - keep parsing but 
        // also check for URL params as fallback
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Error setting session:', error)
          } else {
            console.log('Successfully authenticated user:', data.user)
          }
        }
        
        // Redirect to home page
        setLocation('/')
      } catch (error) {
        console.error('Auth callback error:', error)
        setLocation('/')
      }
    }

    handleAuthCallback()
  }, [setLocation])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingWheel message="Completing sign-in..." size="large" />
    </div>
  )
}