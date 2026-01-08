import { ofetch } from 'ofetch'

/**
 * Helper function to make API calls with proper cookie handling
 * Works in both client and server contexts
 */
export async function apiFetch(url: string, options: any = {}) {
  // Use ofetch directly - it handles cookies automatically on same-origin requests
  // For server-side, we need to construct the full URL
  let fullUrl = url

  // On server side, prepend the API base URL if it's a relative path
  if (!process.client && url.startsWith('/')) {
    // Try to get runtime config, but fall back to '/api'
    let baseURL = '/api'
    try {
      const config = useRuntimeConfig()
      baseURL = config.public.apiBase || '/api'
    } catch (e) {
      // useRuntimeConfig not available, use default
    }
    fullUrl = baseURL + url
  }

  // Use ofetch with credentials for cookie handling
  return await ofetch(fullUrl, {
    ...options,
    credentials: 'include'
  })
}
