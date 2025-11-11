import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecoveryRequest {
  email: string;
  passkey: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, passkey }: RecoveryRequest = await req.json()

    if (!email || !passkey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email and passkey are required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user by email first
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User not found' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user profile with recovery passkey hash
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, recovery_passkey_hash')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User not found or no recovery passkey set' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!profile.recovery_passkey_hash) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No recovery passkey set for this account' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify passkey
    const isValidPasskey = await bcrypt.compare(passkey, profile.recovery_passkey_hash)

    if (!isValidPasskey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid recovery passkey' 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate fresh magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://anointed.io'}/?fromEmail=yes&recovered=true`
      }
    })

    if (linkError || !linkData.properties?.action_link) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to generate recovery link' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // In a real implementation, you would send this link via email
    // For now, we'll return the link for testing
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Recovery link generated successfully',
        recoveryLink: linkData.properties.action_link // Remove this in production
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Recovery function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})