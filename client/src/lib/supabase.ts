import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYXF2eGJic2N3Y3hianBmcmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTA2MTQsImV4cCI6MjA2MTA2NjYxNH0.yZgEijr7c_oAFu2oYWD4YCmrbusoWL3wgsAi757CCU8'

export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
};

export const supabase = createSupabaseClient();
