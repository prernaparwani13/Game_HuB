type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

export function safeJsonParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function loadJson<T>(key: string, fallback: T): T {
  const parsed = safeJsonParse<T>(localStorage.getItem(key))
  return parsed ?? fallback
}

export function saveJson<T extends Json>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

