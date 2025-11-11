# Biblical Research Platform - Authentication System Documentation

## Overview
This document provides a comprehensive overview of the authentication system implemented in the Biblical Research Platform. The system uses Supabase for authentication with email/password and custom username support, along with email confirmation for security.

## Architecture Summary

The authentication system consists of:
- **Backend API**: Express.js routes handling signup/signin logic
- **Frontend Components**: React components for user interface
- **Database Schema**: PostgreSQL tables for user profiles
- **Supabase Integration**: Authentication service provider

---

## Backend Implementation

### File: `server/routes/auth.ts`

#### Validation Schemas
```typescript
// Username validation schema
const usernameSchema = z.string().min(3).max(24).regex(/^[A-Za-z0-9_]+$/);

// Sign up body schema
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(24).regex(/^[A-Za-z0-9_]+$/),
  displayName: z.string().max(80).optional()
});

// Sign in body schema
const signinSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});
```

#### API Endpoints

##### 1. Username Availability Check
**Endpoint**: `GET /api/auth/username-available?u={username}`

```typescript
router.get('/api/auth/username-available', async (req, res) => {
  try {
    const u = String(req.query.u || '').trim();
    const parsed = usernameSchema.safeParse(u);
    
    if (!parsed.success) {
      return res.json({ ok: true, available: false, reason: 'invalid' });
    }

    const { data, error } = await supabaseAdmin
      .rpc('username_available', { u });
    
    if (error) throw error;
    
    return res.json({ ok: true, available: !!data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});
```

**Response Format**:
```json
{
  "ok": true,
  "available": true/false,
  "reason": "invalid" // only if invalid format
}
```

##### 2. User Registration
**Endpoint**: `POST /api/auth/signup`

```typescript
router.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username, displayName } = signupSchema.parse(req.body);

    // Check if username is already taken
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .single();
      
    if (existingProfile) {
      return res.status(400).json({ ok: false, error: 'Username already taken' });
    }

    // Sign up user with username in metadata
    const { data, error } = await supabaseClient.auth.signUp({
      email, 
      password,
      options: { 
        data: { 
          username, 
          display_name: displayName ?? username 
        } 
      }
    });
    
    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    // Create profile record if user was created
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          username: username.trim().toLowerCase(),
          display_name: displayName ?? username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the signup if profile creation fails
      }
    }

    // Check if email confirmation is needed
    const needsConfirmation = !data.session;
    
    return res.json({ 
      ok: true, 
      userId: data.user?.id ?? null, 
      needsConfirmation,
      message: needsConfirmation ? 'Please check your email to confirm your account' : 'Account created successfully'
    });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e.message });
  }
});
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "user123",
  "displayName": "John Doe" // optional
}
```

**Response Format**:
```json
{
  "ok": true,
  "userId": "uuid-string",
  "needsConfirmation": true/false,
  "message": "Please check your email to confirm your account"
}
```

##### 3. User Sign In
**Endpoint**: `POST /api/auth/signin`

```typescript
router.post('/api/auth/signin', async (req, res) => {
  try {
    const { username, password } = signinSchema.parse(req.body);
    
    // First, check if username looks like an email
    const isEmail = username.includes('@');
    let email = username;
    
    if (!isEmail) {
      // If it's a username, we need to look up the email from the profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .single();
      
      if (profileError || !profileData) {
        return res.status(400).json({ ok: false, error: 'User not found' });
      }
      
      // Get the email from the user record
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.user_id);
      
      if (userError || !userData.user?.email) {
        return res.status(400).json({ ok: false, error: 'User not found' });
      }
      
      email = userData.user.email;
    }
    
    // Sign in with email and password
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(400).json({ ok: false, error: 'Invalid credentials' });
    }
    
    if (!data.session || !data.user) {
      return res.status(400).json({ ok: false, error: 'Sign in failed' });
    }
    
    return res.json({ 
      ok: true, 
      user: data.user,
      session: data.session
    });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e.message });
  }
});
```

**Request Body**:
```json
{
  "username": "user123", // can be username or email
  "password": "password123"
}
```

**Response Format**:
```json
{
  "ok": true,
  "user": { /* Supabase user object */ },
  "session": { /* Supabase session object */ }
}
```

---

## Frontend Implementation

### File: `client/src/hooks/useAuth.ts`

This is the main authentication hook that manages user state:

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          // Get profile data for complete user info
          try {
            const profile = await getMyProfile();
            const mappedUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: profile?.display_name || profile?.username || supabaseUser.user_metadata?.name || 'User',
              createdAt: new Date(supabaseUser.created_at || '')
            };
            setUser(mappedUser);
          } catch (profileError) {
            // Fallback to basic user data if profile fetch fails
            const mappedUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || 'User',
              createdAt: new Date(supabaseUser.created_at || '')
            };
            setUser(mappedUser);
          }
        }
      } catch (error) {
        console.info('Auth check completed, no active session');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (supabaseUser) {
        const mappedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || 'User',
          createdAt: new Date(supabaseUser.created_at || '')
        };
        setUser(mappedUser);
        return { user: mappedUser, error: null };
      }
      return { user: null, error: 'Login failed' };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isLoggedIn: !!user,
    getProfile: getMyProfile,
  };
}
```

### File: `client/src/lib/auth.ts`

Contains utility functions for authentication:

```typescript
export interface AuthResponse {
  success: boolean;
  message: string;
  error?: any;
  data?: any;
}

// Password Authentication System
export async function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('🔑 Signing in with password for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      return {
        success: false,
        message: error.message || 'Failed to sign in',
        error
      };
    }

    console.log('✅ Sign in successful:', data.user?.email);
    return {
      success: true,
      message: 'Signed in successfully'
    };
  } catch (error) {
    console.error('❌ Unexpected sign in error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}

export async function signUpWithPassword(email: string, password: string, username?: string, displayName?: string, marketingOptIn?: boolean): Promise<AuthResponse> {
  try {
    console.log('📝 Signing up with password for:', email, 'with metadata:', { username, displayName, marketingOptIn });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || '',
          display_name: displayName || username || '',
          marketing_opt_in: marketingOptIn || false
        }
      }
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create account',
        error
      };
    }

    console.log('✅ Sign up successful:', data.user?.email, 'Session created:', !!data.session);
    console.log('📋 User metadata sent to Supabase:', data.user?.user_metadata);
    
    return {
      success: true,
      message: data.session ? 'Account created successfully!' : 'Please check your email to confirm your account',
      data
    };
  } catch (error) {
    console.error('❌ Unexpected sign up error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}
```

### File: `client/src/components/auth/AuthModals.tsx`

Main authentication UI component with sign-up and sign-in forms:

#### Key Functions:

**Username Availability Check**:
```typescript
const checkUsernameAvailability = async (username: string) => {
  if (!username.trim() || username.length < 3) {
    setUsernameStatus('idle')
    return
  }

  setUsernameStatus('checking')
  
  try {
    const response = await fetch(`/api/auth/username-available?u=${encodeURIComponent(username)}`);
    const result = await response.json();
    
    if (result.ok && result.available) {
      setUsernameStatus('available')
    } else {
      setUsernameStatus('unavailable')
    }
  } catch (error) {
    console.error('Username check failed:', error)
    setUsernameStatus('unavailable')
  }
}
```

**Sign Up Handler**:
```typescript
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validation checks
  if (!signUpData.displayName.trim() || !signUpData.username.trim() || !signUpData.email.trim() || !signUpData.password.trim()) {
    toast({
      title: "Missing Information",
      description: "Please fill in all required fields.",
      variant: "destructive"
    })
    return
  }

  if (signUpData.password.length < 8) {
    toast({
      title: "Password Too Short",
      description: "Password must be at least 8 characters long.",
      variant: "destructive"
    })
    return
  }

  if (usernameStatus !== 'available') {
    toast({
      title: "Username Not Available",
      description: "Please choose a different username.",
      variant: "destructive"
    })
    return
  }

  setIsLoading(true)
  try {
    // Use the backend signup API
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: signUpData.email,
        password: signUpData.password,
        username: signUpData.username,
        displayName: signUpData.displayName || signUpData.username
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      toast({
        title: "Sign Up Failed",
        description: result.error || "Something went wrong",
        variant: "destructive"
      })
    } else {
      if (result.needsConfirmation) {
        toast({
          title: "Check Your Email! 📧",
          description: result.message || `We sent a confirmation link to ${signUpData.email}`,
        })
      } else {
        toast({
          title: "Account Created! ✨",
          description: "Welcome! You've been signed in automatically.",
        })
      }
      
      onCloseSignUp()
      setSignUpData({ displayName: '', username: '', email: '', password: '', marketingOptIn: false })
      setUsernameStatus('idle')
      
      // Refresh the page to load the new session
      window.location.reload()
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive"
    })
  } finally {
    setIsLoading(false)
  }
}
```

**Sign In Handler**:
```typescript
const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!signInData.username.trim() || !signInData.password.trim()) {
    toast({
      title: "Missing Information",
      description: "Please enter both username and password.",
      variant: "destructive"
    })
    return
  }

  setIsLoading(true)
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: signInData.username,
        password: signInData.password
      }),
    })

    const result = await response.json()
    
    if (!result.ok) {
      toast({
        title: "Sign In Failed",
        description: result.error || "Invalid username or password",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Welcome Back! ✨",
        description: "You've been signed in successfully.",
      })
      onCloseSignIn()
      setSignInData({ username: '', password: '' })
      
      // Refresh the page to load the new session
      window.location.reload()
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive"
    })
  } finally {
    setIsLoading(false)
  }
}
```

### File: `client/src/components/auth/CombinedAuthModal.tsx`

Alternative tabbed authentication interface combining sign-in and sign-up:

#### Key Features:
- Tabbed interface with "Sign In" and "Sign Up" tabs
- Password visibility toggle
- Email and username validation
- Integrated form handling

---

## Database Schema

### File: `shared/schema.ts`

#### Users Table
```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

#### Profiles Table
```typescript
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id),
  email: text("email").notNull(),
  username: text("username").unique(),
  display_name: text("display_name"),
  avatar_url: text("avatar_url"),
  bio: text("bio"),
  tier: text("tier").default("free"), // 'free' or 'premium' or 'staff'
  role: text("role").default("user"), // 'user' or 'mod' or 'admin'
  premium_until: timestamp("premium_until"),
  stripe_customer_id: text("stripe_customer_id"),
  recovery_passkey_hash: text("recovery_passkey_hash"),
  marketing_opt_in: boolean("marketing_opt_in").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Authentication Flow

### Sign Up Process
1. **Frontend Form Validation**:
   - Display name (required)
   - Username (3-24 chars, alphanumeric + underscore)
   - Email (valid email format)
   - Password (minimum 8 characters)

2. **Username Availability Check**:
   - Real-time validation via `GET /api/auth/username-available`
   - Visual feedback with check/error icons

3. **Backend Processing**:
   - Validate input with Zod schemas
   - Check username uniqueness in profiles table
   - Create Supabase Auth user with metadata
   - Create corresponding profile record
   - Return confirmation status

4. **Email Confirmation**:
   - If Supabase requires email confirmation, user receives email
   - Frontend shows appropriate message
   - Page refreshes after successful signup

### Sign In Process
1. **Frontend Form**:
   - Username/email field (accepts both)
   - Password field
   - Password visibility toggle

2. **Backend Processing**:
   - Determine if input is email or username
   - If username, lookup email from profiles table
   - Authenticate with Supabase using email/password
   - Return session data

3. **Session Management**:
   - Page refreshes to load new session
   - `useAuth` hook automatically detects new session
   - User profile data loaded from database

---

## Additional Features

### Username Validation Rules
- **Length**: 3-24 characters
- **Characters**: Letters, numbers, underscore only (`/^[A-Za-z0-9_]+$/`)
- **Case**: Stored in lowercase
- **Uniqueness**: Checked against profiles table

### Password Requirements
- **Minimum Length**: 8 characters
- **No complexity requirements** (handled by Supabase)

### Email Confirmation
- **Configurable**: Based on Supabase project settings
- **User Feedback**: Clear messaging about confirmation status
- **Automatic**: Handled by Supabase email service

### Error Handling
- **Input Validation**: Zod schemas on backend
- **User Feedback**: Toast notifications for all errors
- **Graceful Degradation**: Profile creation failure doesn't break signup
- **Specific Messages**: Clear error descriptions for debugging

---

## Security Features

### Backend Security
- **Input Validation**: Zod schemas prevent injection
- **Username Sanitization**: Trimmed and lowercased
- **Admin Client**: Uses `supabaseAdmin` for privileged operations
- **Error Boundaries**: Graceful error handling

### Frontend Security
- **HTTPS Required**: Supabase requires secure connections
- **Session Management**: Automatic session refresh
- **CSRF Protection**: JSON API with proper headers
- **Input Sanitization**: Real-time username cleaning

### Database Security
- **Row Level Security**: Implemented on all user tables
- **UUID Primary Keys**: Prevents enumeration attacks
- **Unique Constraints**: Email and username uniqueness enforced
- **Timestamp Tracking**: Created/updated timestamps for auditing

---

## Configuration Requirements

### Supabase Settings
1. **Email Auth**: Enabled for password-based authentication
2. **Email Confirmation**: Configure based on security needs
3. **Redirect URLs**: Set for email confirmation links
4. **RLS Policies**: Ensure proper row-level security

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- Supabase configuration in `client/src/lib/supabaseClient.ts`

---

## Files Overview

| File | Purpose | Key Functions |
|------|---------|---------------|
| `server/routes/auth.ts` | Backend API endpoints | signup, signin, username-check |
| `client/src/hooks/useAuth.ts` | React authentication hook | User state management |
| `client/src/lib/auth.ts` | Auth utility functions | signInWithPassword, signUpWithPassword |
| `client/src/components/auth/AuthModals.tsx` | Main auth UI | Sign-up/sign-in forms |
| `client/src/components/auth/CombinedAuthModal.tsx` | Tabbed auth UI | Alternative auth interface |
| `client/src/lib/userDataApi.ts` | User data operations | Profile management |
| `shared/schema.ts` | Database schema | Users and profiles tables |

This authentication system provides a complete, secure, and user-friendly experience with both email/password authentication and custom username support, along with proper email confirmation flow.