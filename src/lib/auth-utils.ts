// Centralize NextAuth instance to avoid multiple initializations.
// Re-export the canonical `auth` from auth-config.
export { auth } from './auth-config';
