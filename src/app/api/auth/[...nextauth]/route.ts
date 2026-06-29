import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// 扩展 Session 和 User 类型
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user?: {
      id?: string
      githubUsername?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id?: string
    githubUsername?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    githubUsername?: string | null
  }
}

interface GitHubProfile {
  login?: string
}

interface AccountShape {
  access_token?: string
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
    async jwt({ token, account, profile }: { token: JWT; account?: AccountShape | null; profile?: unknown }) {
      if (account) {
        token.accessToken = account.access_token
        token.githubUsername = (profile as GitHubProfile | undefined)?.login || null
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken
      if (session.user) {
        session.user.githubUsername = token.githubUsername ?? undefined
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
