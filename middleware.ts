import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();  // Allow iframe embedding for Farcaster
  
  // Remove X-Frame-Options entirely when using CSP frame-ancestors
  // response.headers.set('X-Frame-Options', 'ALLOWALL'); // This conflicts with CSP frame-ancestors
  
  // More permissive CSP for iframe embedding
  // In production, you might want to be more restrictive, but for development and Farcaster compatibility, allow all
  const isProduction = process.env.NODE_ENV === 'production';
  const frameAncestors = isProduction 
    ? "'self' https://*.farcaster.xyz https://*.warpcast.com https://*.frames.sh https://*.vercel.app https://*.trycloudflare.com https://*.cloudflare.com"
    : "*";
    
  response.headers.set(
    'Content-Security-Policy',
    `frame-ancestors ${frameAncestors}; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; object-src 'none';`
  );
  
  // Additional iframe compatibility headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};