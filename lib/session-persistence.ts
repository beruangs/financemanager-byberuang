/**
 * Session Persistence for iOS PWA
 * iOS PWA doesn't share cookies with Safari, so we need to persist session differently
 */

const SESSION_STORAGE_KEY = 'finance-manager-session';
const SESSION_EXPIRY_KEY = 'finance-manager-session-expiry';

interface StoredSession {
  email: string;
  timestamp: number;
}

/**
 * Check if we're running as a PWA (standalone mode)
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (iOS PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return isStandalone || isIOSStandalone;
}

/**
 * Store session info in localStorage for PWA persistence
 */
export function persistSession(email: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const session: StoredSession = {
      email,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    
    // Set expiry to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    localStorage.setItem(SESSION_EXPIRY_KEY, expiryDate.toISOString());
    
    console.log('Session persisted for PWA');
  } catch (error) {
    console.error('Failed to persist session:', error);
  }
}

/**
 * Get persisted session from localStorage
 */
export function getPersistedSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    const expiryData = localStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (!sessionData || !expiryData) return null;
    
    // Check if session has expired
    const expiryDate = new Date(expiryData);
    if (expiryDate < new Date()) {
      clearPersistedSession();
      return null;
    }
    
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Failed to get persisted session:', error);
    return null;
  }
}

/**
 * Clear persisted session
 */
export function clearPersistedSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    console.log('Persisted session cleared');
  } catch (error) {
    console.error('Failed to clear persisted session:', error);
  }
}

/**
 * Check if we have a valid persisted session
 */
export function hasValidPersistedSession(): boolean {
  return getPersistedSession() !== null;
}
