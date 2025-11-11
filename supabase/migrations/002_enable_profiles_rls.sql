-- Migration: Enable Row-Level Security on profiles table
-- Date: November 2, 2025
-- Purpose: Protect user profile data with RLS policies
-- Security Audit Issue #1 Fix

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to view all profiles
-- This is required for features like viewing other users' public profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT 
  USING (true);

-- Policy 2: Users can only update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy 3: Users can only insert their own profile
-- This prevents users from creating profiles for other users
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Note: No DELETE policy - profiles should not be deleted directly
-- Account deletion should be handled through auth.users cascade
