/**
 * Timeout helper for non-blocking async operations
 * Prevents auth calls and other async operations from blocking UI
 * 
 * Usage:
 * const result = await withTimeout(supabase().auth.getSession(), 1500);
 * if (!result) {
 *   // Timeout occurred, render guest path
 * }
 */

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 1500
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]);
}

/**
 * Auth-specific timeout helper
 * Returns a null user object if auth times out
 */
export async function authWithTimeout<T extends { data: { user: any } }>(
  authPromise: Promise<T>,
  timeoutMs: number = 1500
): Promise<T | { data: { user: null } }> {
  return Promise.race([
    authPromise,
    new Promise<{ data: { user: null } }>((resolve) => 
      setTimeout(() => resolve({ data: { user: null } }), timeoutMs)
    )
  ]);
}
