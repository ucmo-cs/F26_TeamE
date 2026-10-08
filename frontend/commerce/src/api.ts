const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) as Record<string, unknown> : null

  if (!response.ok) {
    const message =
      (data?.error as string | undefined)
      || (data?.detail as string | undefined)
      || (data?.message as string | undefined)
      || `Request failed (${response.status})`
    throw new Error(message)
  }

  return data as T
}

export function money(value: unknown) {
  if (value == null || value === '') return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))
}

export function percent(value: unknown) {
  if (value == null || value === '') return '—'
  return `${Number(value).toFixed(2)}%`
}

export function formatDate(value: unknown) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString()
}
