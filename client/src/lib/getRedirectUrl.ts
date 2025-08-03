export function getRedirectUrl(): string {
  // In development, use the current origin
  if (import.meta.env.DEV) {
    return `${window.location.origin}/auth/callback`;
  }
  
  // In production, use the Replit deployment URL
  const replitUrl = import.meta.env.VITE_REPLIT_URL || window.location.origin;
  return `${replitUrl}/auth/callback`;
}