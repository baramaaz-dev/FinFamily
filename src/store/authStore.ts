import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabaseClient, signIn, signOut } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  error: string | null
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  error: null,

  init: async () => {
    const { data: { session } } = await supabaseClient.auth.getSession()
    set({ session, loading: false })

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      set({ session })
    })
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const data = await signIn(email, password)
      set({ session: data.session, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  logout: async () => {
    await signOut()
    set({ session: null })
  },
}))
