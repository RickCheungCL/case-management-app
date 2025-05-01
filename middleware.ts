import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const url = req.nextUrl.pathname;
      const isAdminRoute = url.startsWith('/admin');
      const isDashboard = url.startsWith('/cases') || url === '/';

      if (!token) return false;
      if (isAdminRoute && token.role !== 'ADMIN') return false;
      if (isDashboard && !token) return false;

      return true;
    },
  },
});

export const config = {
  matcher: ['/', '/cases/:path*', '/admin/:path*'],
};
