import { create } from 'zustand'
import { supabase, signIn, signOut } from '@/lib/supabase'

export const useAuthStore = create((set) => ({
  session: null,
  loading: true,
  error: null,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
    })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const data = await signIn(email, password)
      set({ session: data.session, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  logout: async () => {
    await signOut()
    set({ session: null })
  },
}))
