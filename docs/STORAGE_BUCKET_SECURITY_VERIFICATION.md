# Storage Bucket Security Verification Guide

**Date:** November 2, 2025  
**Purpose:** Verify and configure secure storage bucket policies for avatars  
**Security Audit Issue #2 Fix**

---

## Overview

This guide provides step-by-step instructions to verify and configure Row-Level Security policies for the `avatars` storage bucket in Supabase.

**Security Risk:** Without proper storage policies, users could potentially:
- Upload files to other users' folders
- Access or modify files they don't own
- Bypass path-based restrictions

---

## Pre-Verification Checklist

Before starting, ensure you have:
- [ ] Supabase Dashboard access with admin privileges
- [ ] Production database access
- [ ] Test user account (non-admin) for verification

---

## Step 1: Verify Bucket Configuration

### 1.1 Check Bucket Settings

1. Log into Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Locate the `avatars` bucket
4. Verify the following settings:

| Setting | Expected Value | Status |
|---------|----------------|--------|
| Bucket Name | `avatars` | [ ] |
| Public | ✅ Yes (for profile pictures) | [ ] |
| File Size Limit | 5MB (recommended) | [ ] |
| Allowed MIME Types | `image/jpeg, image/png, image/webp, image/gif` | [ ] |

### 1.2 Current Path Structure

The application uploads avatars to:
```
avatars/{userId}/{randomUUID}.{ext}
```

Example:
```
avatars/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png
```

---

## Step 2: Configure Storage Policies

### 2.1 Access Storage Policies

1. In Supabase Dashboard, navigate to **Storage** → **Policies**
2. Select the `avatars` bucket
3. You should see the policies list (may be empty if not configured)

### 2.2 Required Storage Policies

Execute the following SQL policies in the Supabase SQL Editor:

#### Policy 1: Upload Restriction (INSERT)
```sql
-- Users can only upload to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What it does:** Ensures users can only upload files to `avatars/{their-user-id}/...`

#### Policy 2: Update Restriction (UPDATE)
```sql
-- Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What it does:** Allows users to replace/update only their own avatar files

#### Policy 3: Delete Restriction (DELETE)
```sql
-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**What it does:** Allows users to delete only their own avatar files

#### Policy 4: Public Read (SELECT)
```sql
-- Anyone can view avatars (public read)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**What it does:** Allows anyone to view avatar images (required for profile pictures to be publicly visible)

### 2.3 Verify Policies Were Created

After running the SQL commands:

1. Navigate to **Storage** → **Policies**
2. Select `avatars` bucket
3. Confirm all 4 policies are listed:
   - [ ] "Users can upload to their own folder" (INSERT)
   - [ ] "Users can update their own files" (UPDATE)
   - [ ] "Users can delete their own files" (DELETE)
   - [ ] "Anyone can view avatars" (SELECT)

---

## Step 3: Verify RPC Function Security

### 3.1 Check `fn_set_avatar()` Function

The application uses a `SECURITY DEFINER` function to set avatars. Verify it exists:

```sql
-- Check if function exists
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'fn_set_avatar';
```

**Expected Result:**
- `proname`: `fn_set_avatar`
- `prosecdef`: `true` (SECURITY DEFINER enabled)

### 3.2 Review Function Definition

Run this to see the function definition:
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_set_avatar';
```

**Verify:**
- [ ] Function checks that `auth.uid()` matches the profile being updated
- [ ] Function validates the file path matches the user's folder
- [ ] Function is marked as `SECURITY DEFINER`

---

## Step 4: Testing Upload Restrictions

### 4.1 Create Test Users

Create two test user accounts (if not already available):
- **User A** (your test account)
- **User B** (another test account)

Note their user IDs from the auth.users table.

### 4.2 Test Case 1: Valid Upload (Should Succeed)

1. Log in as **User A**
2. Navigate to Profile page
3. Upload an avatar image
4. Verify:
   - [ ] Upload succeeds
   - [ ] Image appears in profile
   - [ ] File path is `avatars/{userA-id}/{uuid}.{ext}`

### 4.3 Test Case 2: Cross-User Upload Attempt (Should Fail)

Using a REST client (Postman, curl, etc.) or browser console:

1. Get User A's auth token
2. Attempt to upload to User B's folder:
   ```javascript
   const { data, error } = await supabase.storage
     .from('avatars')
     .upload(`avatars/{userB-id}/malicious.png`, file);
   
   console.log(error); // Should show permission denied
   ```

**Expected Result:**
- [ ] Upload is **rejected** with permission error
- [ ] Error message indicates policy violation
- [ ] No file is created in User B's folder

### 4.4 Test Case 3: Update Own File (Should Succeed)

1. Log in as **User A**
2. Upload a new avatar (overwrites previous)
3. Verify:
   - [ ] Update succeeds
   - [ ] New image replaces old one
   - [ ] File path remains in User A's folder

### 4.5 Test Case 4: Delete Own File (Should Succeed)

1. Log in as **User A**
2. Delete avatar:
   ```javascript
   const { data, error } = await supabase.storage
     .from('avatars')
     .remove([`avatars/{userA-id}/{filename}`]);
   ```

**Expected Result:**
- [ ] Deletion succeeds
- [ ] File is removed from storage
- [ ] Profile shows default avatar

### 4.6 Test Case 5: Delete Other User's File (Should Fail)

1. Log in as **User A**
2. Attempt to delete User B's avatar:
   ```javascript
   const { data, error } = await supabase.storage
     .from('avatars')
     .remove([`avatars/{userB-id}/{filename}`]);
   ```

**Expected Result:**
- [ ] Deletion is **rejected** with permission error
- [ ] User B's file remains intact

### 4.7 Test Case 6: Public Read Access (Should Succeed)

1. Open an **incognito/private browser window** (not logged in)
2. Navigate to User A's profile page
3. Verify:
   - [ ] Avatar image loads correctly
   - [ ] No authentication required to view
   - [ ] Image URL is publicly accessible

---

## Step 5: Production Verification Checklist

Once policies are configured and tested, verify the following in production:

### Storage Configuration
- [ ] `avatars` bucket exists
- [ ] Bucket is marked as **public** (for read access)
- [ ] File size limit is configured (5MB recommended)
- [ ] Allowed MIME types are restricted to images

### Storage Policies
- [ ] All 4 storage policies are active
- [ ] INSERT policy restricts uploads to own folder
- [ ] UPDATE policy restricts updates to own files
- [ ] DELETE policy restricts deletions to own files
- [ ] SELECT policy allows public read access

### Application Code
- [ ] `client/src/lib/uploadAvatar.ts` uses correct path structure
- [ ] `fn_set_avatar()` RPC function exists and is secure
- [ ] Avatar uploads work correctly in production
- [ ] Profile pictures display correctly for all users

### Security Testing
- [ ] Cross-user upload attempts fail
- [ ] Cross-user deletion attempts fail
- [ ] Own-file operations succeed
- [ ] Public read access works for unauthenticated users

---

## Step 6: Monitoring and Maintenance

### Regular Checks (Monthly)

- [ ] Review storage bucket policies for any changes
- [ ] Check for orphaned files (files not linked to users)
- [ ] Monitor storage usage and file counts
- [ ] Review Supabase logs for policy violations

### Security Incident Response

If a policy violation is detected:

1. **Immediate Actions:**
   - Review Supabase logs for the incident
   - Identify the affected user accounts
   - Check for unauthorized file access/uploads
   - Temporarily disable affected accounts if needed

2. **Investigation:**
   - Determine how the policy was bypassed
   - Review recent code changes
   - Check for application vulnerabilities

3. **Remediation:**
   - Remove any unauthorized files
   - Update policies if needed
   - Patch any application vulnerabilities
   - Notify affected users if data was compromised

---

## Troubleshooting

### Issue: "Policy violation" error on legitimate uploads

**Possible Causes:**
- User ID mismatch in token vs. path
- Policy syntax error
- Bucket name mismatch

**Solution:**
1. Verify the user's auth token is valid
2. Check that `auth.uid()` matches the folder path
3. Review policy definitions for typos
4. Test with a fresh login

### Issue: Public read access not working

**Possible Causes:**
- Bucket not marked as public
- SELECT policy missing or incorrect
- CORS configuration blocking access

**Solution:**
1. Verify bucket is set to **public**
2. Confirm SELECT policy allows all reads
3. Check CORS configuration in `server/cors-config.ts`

### Issue: Users can upload to wrong folders

**Possible Causes:**
- INSERT policy not applied
- Policy logic error
- Application code bypassing storage API

**Solution:**
1. Verify INSERT policy is active
2. Check policy uses `storage.foldername()` correctly
3. Review `uploadAvatar.ts` for direct storage manipulation
4. Test with RLS enabled

---

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Row-Level Security](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage Helper Functions](https://supabase.com/docs/reference/javascript/storage-from-upload)

---

## Verification Sign-Off

Once all steps are completed, sign off on this verification:

**Verified By:** ___________________________  
**Date:** ___________________________  
**Production Environment:** ___________________________  
**All Tests Passed:** [ ] Yes [ ] No  
**Notes:**

---

**Security Audit Reference:** SECURITY_AUDIT_REPORT.md, Section 2, Issue #2  
**Last Updated:** November 2, 2025
