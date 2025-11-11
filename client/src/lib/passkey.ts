import bcrypt from 'bcryptjs';
import { supabase } from './supabaseClient';

export interface PasskeyResponse {
  success: boolean;
  message: string;
  error?: any;
}

// Save recovery passkey for current user
export async function saveRecoveryPasskey(userId: string, plainPasskey: string): Promise<PasskeyResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'You must be logged in to set a recovery passkey'
      };
    }

    // Hash the passkey
    const hash = await bcrypt.hash(plainPasskey, 12);
    
    // Save to profile
    const { error } = await supabase()
      .from('profiles')
      .update({ recovery_passkey_hash: hash })
      .eq('id', userId);

    if (error) {
      console.error('Failed to save recovery passkey:', error);
      return {
        success: false,
        message: 'Failed to save recovery passkey',
        error
      };
    }

    return {
      success: true,
      message: 'Recovery passkey saved successfully'
    };
  } catch (error) {
    console.error('Unexpected error saving passkey:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}

// Remove recovery passkey for current user
export async function removeRecoveryPasskey(userId: string): Promise<PasskeyResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'You must be logged in to remove a recovery passkey'
      };
    }

    const { error } = await supabase()
      .from('profiles')
      .update({ recovery_passkey_hash: null })
      .eq('id', userId);

    if (error) {
      console.error('Failed to remove recovery passkey:', error);
      return {
        success: false,
        message: 'Failed to remove recovery passkey',
        error
      };
    }

    return {
      success: true,
      message: 'Recovery passkey removed successfully'
    };
  } catch (error) {
    console.error('Unexpected error removing passkey:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}

// Check if user has a recovery passkey
export async function hasRecoveryPasskey(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    const { data } = await supabase()
      .from('profiles')
      .select('recovery_passkey_hash')
      .eq('id', userId)
      .single();

    return !!data?.recovery_passkey_hash;
  } catch (error) {
    console.error('Error checking recovery passkey:', error);
    return false;
  }
}