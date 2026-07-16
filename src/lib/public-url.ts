import type { NextRequest } from 'next/server';

function isLocalhost(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return true;
  }
}

/** Returns a public origin without allowing a local development URL in production. */
export function getPublicOrigin(request: NextRequest) {
  const configuredOrigin = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  if (configuredOrigin && !isLocalhost(configuredOrigin)) return configuredOrigin;

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  if (forwardedHost) return `${forwardedProtocol}://${forwardedHost}`;

  return new URL(request.url).origin;
}
