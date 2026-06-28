export interface User {
  id: number
  login: string
  avatar_url: string
  name?: string
  email?: string
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}
