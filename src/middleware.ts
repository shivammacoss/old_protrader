import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const key = new TextEncoder().encode(secretKey);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/signup', '/admin/login', '/api/admin/auth/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticRoute = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.');

  // Allow static files and public routes
  if (isStaticRoute || isPublicRoute) {
    return NextResponse.next();
  }

  // Check for admin routes (pages and API)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminSession = request.cookies.get('admin_session')?.value;
    
    if (!adminSession) {
      // For API routes, return 401 instead of redirect
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ success: false, message: 'Admin authentication required' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const payload = await verifyToken(adminSession);
    // Check for admin type session (super_admin, admin, or moderator roles)
    if (!payload || payload.type !== 'admin') {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ success: false, message: 'Invalid admin session' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // For other API routes, let them handle their own auth
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Protected user routes
  const session = request.cookies.get('session')?.value;
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(session);
  if (!payload || payload.type !== 'user') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
