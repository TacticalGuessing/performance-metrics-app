// src/middleware.js
import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/authUtils.js';

const PUBLIC_PATHS = [
  '/', 
  '/auth/login', 
  '/auth/register', 
  '/api/auth/login',
  '/api/auth/register',
];

// Paths that require admin role SPECIFICALLY
const ADMIN_ONLY_SPECIFIC_PATHS = [
  '/admin', // Matches /admin, /admin/data-generator, etc.
  '/api/generate-data', // Admin specific API for data generation
  // Add future paths like '/api/admin/users'
];

// Paths that require ANY authenticated user (user or admin)
const AUTHENTICATED_USER_PATHS = [
    '/dashboard',
    '/kpis', // For future KPI detail pages
    '/api/kpis', // For KPI data fetching APIs
    '/api/auth/me', // Getting current user details
    '/api/auth/logout', // Logout API
    // Add other paths that any logged-in user can access
];


export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);

  console.log(`--- MIDDLEWARE START for path: ${pathname} ---`);
  console.log(`Middleware: Token found: ${token ? 'Yes' : 'No'}`);

  // 1. Allow public paths
  if (PUBLIC_PATHS.some(publicPath => pathname === publicPath || (publicPath !== '/' && pathname.startsWith(publicPath)))) {
    console.log(`Middleware: Path ${pathname} is public.`);
    if (token && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
      const decodedToken = await verifyToken(token);
      if (decodedToken) {
        // All logged-in users go to dashboard from auth pages
        console.log(`Middleware: User already logged in, redirecting from ${pathname} to /dashboard.`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Authentication Check for all other paths
  if (!token) {
    console.warn(`Middleware: No token for protected path ${pathname}. Redirecting to login.`);
    // ... (same redirect to login / 401 for API logic as before) ...
    if (pathname.startsWith('/api/')) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    const loginUrl = new URL('/auth/login', request.url); loginUrl.searchParams.set('redirectedFrom', pathname); return NextResponse.redirect(loginUrl);
  }

  // 3. Verify Token (token exists)
  const decodedToken = await verifyToken(token);
  if (!decodedToken) {
    // ... (same invalid token redirect / 401 for API / clear cookie logic as before) ...
    console.warn(`Middleware: Invalid or expired token for path: ${pathname}. Clearing cookie and redirecting to login.`);
    const loginUrl = new URL('/auth/login', request.url); const response = NextResponse.redirect(loginUrl); response.cookies.set('authToken', '', { maxAge: -1, path: '/' });
    if (pathname.startsWith('/api/')) { const apiResponse = NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 }); apiResponse.cookies.set('authToken', '', { maxAge: -1, path: '/' }); return apiResponse; }
    return response;
  }
  
  console.log(`Middleware: Valid token for user ${decodedToken.email}, role: ${decodedToken.role}`);

  // 4. Role-Based Access Control for Admin-Specific Paths
  const requiresAdminForSpecificPath = ADMIN_ONLY_SPECIFIC_PATHS.some(adminPath => pathname.startsWith(adminPath));

  if (requiresAdminForSpecificPath && decodedToken.role !== 'admin') {
    console.warn(`Middleware: Access DENIED. User role '${decodedToken.role}' to ADMIN-ONLY path: ${pathname}.`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Forbidden: Admin access required for this resource.' }, { status: 403 });
    }
    // Redirect non-admins trying to access admin pages to their dashboard
    return NextResponse.redirect(new URL('/dashboard?error=admin_only_area', request.url));
  }

  // 5. Check if path requires at least general authentication (most other non-public paths)
  // This check is implicitly handled because if it wasn't public and token was required, we'd have already passed auth.
  // The AUTHENTICATED_USER_PATHS array can be used for clarity or if some authenticated paths have further specific rules.
  // For now, if it passed token validation and isn't an admin-only path that was denied, we allow it.

  console.log(`Middleware: Access GRANTED for role '${decodedToken.role}' to path: ${pathname}.`);
  // ... (set headers and NextResponse.next() as before) ...
  const requestHeaders = new Headers(request.headers); /* ... */ requestHeaders.set('x-decoded-token-role', decodedToken.role || ''); /* ... */ return NextResponse.next({ request: { headers: requestHeaders }});
}

// Matcher to specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any other static assets you might serve directly from /public
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|assets/).*)', // Added images/ and assets/ as examples
  ],
};