import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  // NextAuth's middleware token is augmented at runtime with the custom role claim.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    if (path.startsWith('/admin') && token?.role === 'community') {
      const url = req.nextUrl.clone();
      url.pathname = '/community';
      url.search = '';
      return NextResponse.redirect(url);
    }

    // Redirect logged-in users away from login/setup to admin
    if ((path.startsWith('/admin/login') || path.startsWith('/admin/setup')) && token) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/admin/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req?.nextUrl?.pathname ?? '';

        // Allow setup page without auth (for creating first admin)
        if (path === '/admin/setup' || path.startsWith('/admin/api/setup')) {
          return true;
        }

        // Allow login page without auth
        if (path === '/admin/login') {
          return true;
        }

        // Allow invited administrators to define their first password.
        if (path === '/admin/activate') {
          return true;
        }

        if (path.startsWith('/admin') && !['admin', 'super_admin'].includes(token?.role as string)) {
          if (token?.role === 'community') return true;
          return false;
        }

        // Protect admin routes - require token
        if (path.startsWith('/admin')) {
          return !!token;
        }

        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};
