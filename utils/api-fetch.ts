import { ofetch } from "ofetch";

/**
 * Helper function to make API calls with proper cookie handling
 * Works in both client and server contexts
 */
export async function apiFetch<T = any>(
  url: string,
  options: any = {},
): Promise<T> {
  // Client-side: use ofetch with credentials for cookie handling
  if (process.client) {
    return await ofetch<T>(url, {
      ...options,
      credentials: "include",
    });
  }

  // Server-side: use ofetch with baseURL
  // On server, we need to construct the full URL for external requests
  // or use internal routing for same-server requests
  let fullUrl = url;
  if (url.startsWith("/")) {
    // Get the base URL from runtime config
    let baseURL = "/api";
    try {
      const config = useRuntimeConfig();
      baseURL = config.public.apiBase || "/api";
    } catch (e) {
      // useRuntimeConfig not available, use default
    }
    fullUrl = baseURL + url;
  }

  return await ofetch<T>(fullUrl, options);
}
