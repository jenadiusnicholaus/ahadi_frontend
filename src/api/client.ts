function getBaseUrl(): string {
  if (typeof import.meta === 'undefined') return ''
  const env = (import.meta as unknown as { env?: { API_BASE_URL?: string } }).env
  return (env?.API_BASE_URL ?? '').replace(/\/$/, '')
}

export function apiUrl(path: string, searchParams?: Record<string, string>): string {
  const base = getBaseUrl()
  const pathNorm = path.replace(/^\//, '')
  const full = base ? `${base}/${pathNorm}` : (typeof window !== 'undefined' ? window.location.origin : '') + '/' + pathNorm
  const url = new URL(full)
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return url.toString()
}

export function assetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = getBaseUrl()
  return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

export async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = apiUrl(path, params)
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}
