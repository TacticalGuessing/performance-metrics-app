// src/middleware.js
import { NextResponse } from 'next/server';
// Ensure your jsconfig.json is set up for @/lib alias, or use correct relative path:
// e.g., import { verifyToken, getTokenFromRequest } from './lib/authUtils.js';
import { verifyToken, getTokenFromRequest } from '@/lib/authUtils.js'; 

const PUBLIC_PATHS = [
  '/', // Assuming your homepage is public or handles its own auth logic
  '/auth/login', 
  '/auth/register', 
  '/api/auth/login',    // Login API itself must be public
  '/api/auth/register', // Registration API must be public
  // '/api/auth/me',    // This is NOT public; it requires a token
];

const ADMIN_PATHS = [
  '/admin', // This will match /admin, /admin/data-generator, etc.
  // Add any admin-specific API routes here if they don't fall under a general /api/admin prefix
  // For example: '/api/users/delete' (if that's an admin-only action)
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request); // Get token string using the helper

  console.log(`--- MIDDLEWARE START for path: ${pathname} ---`);
  console.log(`Middleware: Token found in cookie: ${token ? 'Yes (length ' + token.length + ')' : 'No'}`);

  // 1. Allow access to explicitly public paths
  if (PUBLIC_PATHS.some(publicPath => pathname === publicPath || (publicPath !== '/' && pathname.startsWith(publicPath)))) {
    console.log(`Middleware: Path ${pathname} is public.`);
    // If user is logged in (has a valid token) and tries to access login/register, redirect them
    if (token && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
      const decodedTokenForPublicRedirect = await verifyToken(token); // verifyToken is async
      if (decodedTokenForPublicRedirect) { // If token is valid
        console.log(`Middleware: User already logged in, redirecting from ${pathname} to /dashboard.`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    console.log(`Middleware: Allowing public path ${pathname} to proceed.`);
    return NextResponse.next(); // Allow request
  }

  // 2. Authentication Check for all other (protected) paths
  if (!token) {
    console.warn(`Middleware: No token for protected path ${pathname}. Redirecting to login.`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verify Token (token exists at this point)
  const decodedToken = await verifyToken(token); 

  if (!decodedToken) {
    console.warn(`Middleware: Invalid or expired token for path ${pathname}. Clearing cookie and redirecting to login.`);
    const loginUrl = new URL('/auth/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('authToken', '', { maxAge: -1, path: '/' }); // Expire the cookie

    if (pathname.startsWith('/api/')) {
      // For API routes, just return 401 after attempting to clear cookie
      const apiResponse = NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
      apiResponse.cookies.set('authToken', '', { maxAge: -1, path: '/' });
      return apiResponse;
    }
    return response; // For page routes, redirect with cookie cleared
  }

  // 4. Role-Based Access Control (User is authenticated, token is valid)
  const requiresAdmin = ADMIN_PATHS.some(adminPath => pathname.startsWith(adminPath));
  
  console.log(`Middleware RBAC Check: Path: ${pathname}, User Role: '${decodedToken.role}', Requires Admin: ${requiresAdmin}`);

  if (requiresAdmin && decodedToken.role !== 'admin') { 
    console.warn(`Middleware: Access DENIED. User role '${decodedToken.role}' is not 'admin' for admin path: ${pathname}. Redirecting.`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard?error=forbidden_admin_access', request.url));
  }
  
  // 5. If all checks pass, proceed with the request
  console.log(`Middleware: Access GRANTED for role '${decodedToken.role}' to path: ${pathname}.`);
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-decoded-userid', decodedToken.userId?.toString() || ''); // Ensure string
  requestHeaders.set('x-decoded-email', decodedToken.email || '');
  requestHeaders.set('x-decoded-role', decodedToken.role || '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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