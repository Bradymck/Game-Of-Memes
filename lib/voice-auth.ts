import { NextRequest, NextResponse } from 'next/server';

/**
 * Authenticate voice API requests via Bearer token.
 * Returns null if valid, or an error response if invalid.
 */
export function authenticateVoiceRequest(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const secret = process.env.VOICE_API_SECRET;

  if (!secret) {
    console.error('[Voice Auth] VOICE_API_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
