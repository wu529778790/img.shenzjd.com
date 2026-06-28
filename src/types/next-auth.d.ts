import type { Session, User } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }

  interface User {
    githubUsername?: string
  }
}
