import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: ['/management/:path*', '/settings/:path*', '/config/:path*']
}
