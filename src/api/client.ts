type Env = { API_BASE_URL?: string; API_AUTH_PREFIX?: string }

function getEnv(): Env {
  if (typeof import.meta === 'undefined') return {}
  return (import.meta as unknown as { env?: Env }).env ?? {}
}

function getBaseUrl(): string {
  return (getEnv().API_BASE_URL ?? '').replace(/\/$/, '')
}

export function getAuthPrefix(): string {
  const prefix = getEnv().API_AUTH_PREFIX ?? 'auth'
  return prefix.replace(/^\/|\/$/g, '')
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

export async function post<T>(path: string, body: unknown): Promise<T> {
  const url = apiUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}
