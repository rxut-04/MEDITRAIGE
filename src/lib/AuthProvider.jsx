import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase, isCloudEnabled } from './supabase'

const AuthContext = createContext({
  user: null,
  session: null,
  ready: true,
  cloudEnabled: false,
  signInWithEmail: async () => ({ error: 'Cloud disabled' }),
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!isCloudEnabled)

  useEffect(() => {
    if (!supabase) return

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession ?? null)
        setReady(true)
      }
    )

    return () => {
      active = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const signInWithEmail = useCallback(async (email) => {
    if (!supabase) return { error: 'Cloud sync is not configured' }
    const clean = String(email || '').trim()
    if (!clean) return { error: 'Email is required' }

    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: `${window.location.origin}/triage` },
    })

    return { error: error?.message || null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      ready,
      cloudEnabled: isCloudEnabled,
      signInWithEmail,
      signOut,
    }),
    [ready, session, signInWithEmail, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
