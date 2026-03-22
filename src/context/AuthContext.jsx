import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(authUser) {
    if (!authUser) { setProfile(null); return }
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id, role, name, email, city, phone, avatar, avatar_url, created_at, organizations(*)')
      .eq('auth_id', authUser.id)
      .single()
    if (!error) setProfile(data || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      fetchProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        await fetchProfile(session?.user ?? null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Realtime: re-fetch profile when org status changes (e.g. admin approves seller)
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`org_status_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'organizations',
          filter: `user_id=eq.${profile.id}`,
        },
        async () => {
          // Re-fetch full profile so org status is updated
          await fetchProfile(user)
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [profile?.id])

  async function signUp({ email, password, name, city, role, orgName, orgPhone }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const { data: prof, error: profErr } = await supabase
      .from('users')
      .insert({ auth_id: data.user.id, name, email, city, role, avatar: initials })
      .select()
      .single()
    if (profErr) throw profErr

    if (role === 'seller') {
      const { error: orgErr } = await supabase
        .from('organizations')
        .insert({ user_id: prof.id, name: orgName || name + "'s Shop", phone: orgPhone || '', status: 'pending' })
      if (orgErr) throw orgErr
    }
    return prof
  }

  async function signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', profile.id)
      .select('id, auth_id, role, name, email, city, phone, avatar, avatar_url, created_at, organizations(*)')
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refetchProfile: () => fetchProfile(user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
