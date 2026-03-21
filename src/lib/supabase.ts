import { createClient } from '@supabase/supabase-js'

// @supabase/auth-js accesses globalThis.localStorage *directly* (not via the
// storage adapter) in its lock-debug initialiser (locks.js line 12). Next.js 15
// injects a broken stub in the Node runtime where the object exists but
// getItem is not a real function. Patch it to a safe no-op before the module runs.
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  ;(globalThis as unknown as Record<string, unknown>).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  }
}

// Storage adapter for Supabase auth — also safe on the server after the patch above.
const safeStorage = {
  getItem: (key: string): string | null => {
    try { return localStorage.getItem(key) } catch { return null }
  },
  setItem: (key: string, value: string): void => {
    try { localStorage.setItem(key, value) } catch {}
  },
  removeItem: (key: string): void => {
    try { localStorage.removeItem(key) } catch {}
  },
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      storage: safeStorage,
    },
  }
)
