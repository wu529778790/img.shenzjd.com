import { ofetch } from 'ofetch'

/**
 * Helper function to make API calls with proper cookie handling
 * Works in both client and server contexts
 */
export async function apiFetch(url: string, options: any = {}) {
  if (process.client) {
    // Client-side: use $fetch which automatically sends cookies
    const { $fetch } = useNuxtApp()
    return await $fetch(url, options)
  } else {
    // Server-side: use ofetch with explicit config
    const config = useRuntimeConfig()
    const fetcher = ofetch.create({
      baseURL: config.public.apiBase || '/api'
    })
    return await fetcher(url, options)
  }
}
