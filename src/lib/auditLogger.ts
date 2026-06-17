import { supabase } from './supabase';

/**
 * Sends a security-relevant event to the secure server audit logging endpoint.
 * This ensures compliance with OWASP ASVS V7.
 *
 * @param action - Structured action identifier (e.g. 'APPOINTMENT_STATUS_UPDATED', 'SUSPICIOUS_MALFORMED_INPUT')
 * @param details - Contextual details (must NOT contain passwords, raw tokens, or sensitive user PII)
 */
export async function logAuditEvent(action: string, details: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.warn('Logging skipped: No authenticated session found');
      return;
    }

    // Sanitize client-side details to prevent sensitive data leakage (redundancy check for ASVS compliance)
    let safeDetails = details;
    const sensitiveTokens = ['password', 'token', 'secret', 'key'];
    if (sensitiveTokens.some(t => details.toLowerCase().includes(t))) {
      safeDetails = '[REDACTED SENSITIVE DATA]';
    }

    const response = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, details: safeDetails })
    });

    if (!response.ok) {
      console.error('Audit logger backend returned error status:', response.status);
    }
  } catch (err) {
    console.error('Secure audit logging transport failed:', err);
  }
}
