import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import type { Session } from 'next-auth'

// 扩展 Session 类型以包含 accessToken
declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }
}

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'public_repo repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: any; account?: any; profile?: any }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }: { session: Session; token: any }) {
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

export const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
