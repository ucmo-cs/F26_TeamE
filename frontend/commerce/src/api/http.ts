export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
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
