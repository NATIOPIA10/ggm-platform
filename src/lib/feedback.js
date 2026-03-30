import { supabase } from './supabase'

// ── SUBMIT FEEDBACK ─────────────────────────────
export async function submitFeedback({ userId, role, type, message, rating, imageFile }) {
  let image_url = null

  if (imageFile) {
    try {
      const ext  = imageFile.name.split('.').pop()
      const path = `feedback/${userId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('feedback-images')
        .upload(path, imageFile)
      if (!uploadErr) {
        const { data } = supabase.storage.from('feedback-images').getPublicUrl(path)
        image_url = data.publicUrl
      }
    } catch (e) {
      console.warn('Image upload failed:', e.message)
    }
  }

  const { data, error } = await supabase
    .from('feedbacks')
    .insert({ user_id: userId, role, type, message, rating: rating || null, image_url, status: 'pending' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── GET USER FEEDBACKS ──────────────────────────
export async function getUserFeedbacks(userId) {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── ADMIN: GET ALL FEEDBACKS ────────────────────
export async function adminGetFeedbacks({ type, role, status } = {}) {
  let q = supabase
    .from('feedbacks')
    .select('*, users(name, email, avatar, avatar_url)')
    .order('created_at', { ascending: false })

  if (type)   q = q.eq('type', type)
  if (role)   q = q.eq('role', role)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

// ── ADMIN: UPDATE FEEDBACK ──────────────────────
export async function adminUpdateFeedback(id, updates) {
  const { data, error } = await supabase
    .from('feedbacks')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

// ── ADMIN: GET FEEDBACK STATS ───────────────────
export async function getFeedbackStats() {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('type, status, rating')
  if (error) throw error

  const items = data || []
  return {
    total:    items.length,
    pending:  items.filter(f => f.status === 'pending').length,
    reviewed: items.filter(f => f.status === 'reviewed').length,
    resolved: items.filter(f => f.status === 'resolved').length,
    avgRating: items.filter(f => f.rating).length
      ? (items.filter(f => f.rating).reduce((s, f) => s + f.rating, 0) / items.filter(f => f.rating).length).toFixed(1)
      : null,
    byType: {
      bug:        items.filter(f => f.type === 'bug').length,
      suggestion: items.filter(f => f.type === 'suggestion').length,
      complaint:  items.filter(f => f.type === 'complaint').length,
      general:    items.filter(f => f.type === 'general').length,
    }
  }
}

// ── REALTIME SUBSCRIPTION ───────────────────────
export function subscribeFeedbacks(callback) {
  return supabase
    .channel('feedbacks_admin')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'feedbacks'
    }, payload => callback(payload.new))
    .subscribe()
}
