import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import type { Session, User } from 'next-auth'

// 扩展 Session 和 User 类型
declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }

  interface User {
    githubUsername?: string
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
    async jwt({ token, account, profile }: { token: any; account?: any; profile?: any }) {
      if (account) {
        token.accessToken = account.access_token
        token.githubUsername = profile?.login || null
      }
      return token
    },
    async session({ session, token }: { session: Session; token: any }) {
      session.accessToken = token.accessToken
      if (session.user) {
        (session.user as any).githubUsername = token.githubUsername
      }
      return session
    },
  },
  // 使用默认的登录页面（NextAuth 内置的 /api/auth/signin）
  // 不再需要独立的 /login 页面
  // pages: {
  //   signIn: '/login',
  //   error: '/login',
  // },
}

export const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
