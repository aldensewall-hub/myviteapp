export type User = { email: string }

const STORAGE_KEY = 'auth.user'

function readUser(): User | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (obj && typeof obj.email === 'string') return { email: obj.email }
    return null
  } catch {
    return null
  }
}

let cachedUser: User | null = readUser()
const listeners = new Set<(u: User | null) => void>()

export function getUser(): User | null {
  if (cachedUser === undefined) cachedUser = readUser()
  return cachedUser
}

export async function login(email: string, password: string): Promise<User> {
  // Simple mock validation: require basic email shape and non-empty password
  const emailOk = /.+@.+\..+/.test(email)
  if (!emailOk) throw new Error('Enter a valid email address')
  if (!password || password.length < 3) throw new Error('Password must be at least 3 characters')

  // Simulate a small delay as if calling a server
  await new Promise((r) => setTimeout(r, 300))
  const user: User = { email }
  try { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user)) } catch {}
  cachedUser = user
  for (const fn of listeners) fn(cachedUser)
  return user
}

export function logout(): void {
  try { if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY) } catch {}
  cachedUser = null
  for (const fn of listeners) fn(cachedUser)
}

export function subscribe(fn: (u: User | null) => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
