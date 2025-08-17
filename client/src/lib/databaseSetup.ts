/**
 * Database Setup and Migration
 * Database tables are now created via migration.sql
 */

import { supabase } from './supabaseClient';

export async function setupDatabase() {
  // Database tables are now created via migration.sql
  // This function is no longer needed but kept for compatibility
  console.log('Database setup via migration.sql - no client DDL needed');
  return true;
}

// Function to create or get user in users table
export async function ensureUserExists() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    // Check if user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email!)
      .single();

    if (!existingUser) {
      // Create user record
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0]
        });
        
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
      
      console.log('👤 User record created:', authUser.email);
    }
    
    return authUser;
    
  } catch (error) {
    console.error('❌ Failed to ensure user exists:', error);
    return null;
  }
}