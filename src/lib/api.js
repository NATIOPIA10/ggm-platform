import { supabase } from './supabase'

// ═══════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════
export async function getProducts({ category, city, minPrice, maxPrice, minRating, sort = 'newest', search, limit = 40 } = {}) {
  let q = supabase
    .from('products')
    .select(`
      *,
      categories(name, icon),
      organizations(name, verified),
      reviews(rating)
    `)
    .eq('status', 'approved')
    .limit(limit)

  if (category) q = q.eq('category_id', category)
  if (city)     q = q.eq('city', city)
  if (minPrice) q = q.gte('price', minPrice)
  if (maxPrice) q = q.lte('price', maxPrice)
  if (search)   q = q.ilike('title', `%${search}%`)

  if (sort === 'price-asc')  q = q.order('price', { ascending: true })
  else if (sort === 'price-desc') q = q.order('price', { ascending: false })
  else                             q = q.order('created_at', { ascending: false })

  const { data, error } = await q
  if (error) throw error

  // Compute avg rating client-side
  return (data || []).map(p => ({
    ...p,
    avg_rating: p.reviews?.length
      ? +(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)
      : null,
    review_count: p.reviews?.length || 0,
  }))
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, icon),
      organizations(name, verified),
      users!seller_id(name, city, avatar, avatar_url),
      reviews(*),
      favorites(user_id)
    `)
    .eq('id', id)
    .single()
  if (error) throw error

  // Increment view count once per session
  try {
    const viewKey = 'viewed_' + id
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, '1')
      await supabase.from('products').update({ views: (data.views || 0) + 1 }).eq('id', id)
    }
  } catch(e) {}

  // Fetch reviewer user data separately to get avatar_url
  const reviews = data.reviews || []
  if (reviews.length) {
    const userIds = [...new Set(reviews.map(r => r.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, name, avatar, avatar_url')
      .in('id', userIds)
    if (users) {
      const userMap = Object.fromEntries(users.map(u => [u.id, u]))
      data.reviews = reviews.map(r => ({ ...r, users: userMap[r.user_id] || null }))
    }
  }

  return {
    ...data,
    avg_rating: data.reviews?.length
      ? +(data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1)
      : null,
    review_count: data.reviews?.length || 0,
  }
}

export async function createProduct(payload) {
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
  if (error) throw error
  return data?.[0] || null
}

export async function updateProduct(id, payload) {
  const updates = { ...payload }
  if (!payload.hasOwnProperty('status')) updates.status = 'pending'
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0] || null
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function getSellerProducts(sellerId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, icon)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ═══════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data || []
}

export async function createCategory(payload) {
  const { data, error } = await supabase.from('categories').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ═══════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════
export async function createOrder({ userId, sellerId, items, deliveryLocation, phone, notes }) {
  const totalPrice = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const { data: order, error } = await supabase
    .from('orders')
    .insert({ user_id: userId, seller_id: sellerId, total_price: totalPrice, delivery_location: deliveryLocation, phone, notes })
    .select()
    .single()
  if (error) throw error

  const orderItems = items.map(i => ({ order_id: order.id, product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price }))
  const { error: itemErr } = await supabase.from('order_items').insert(orderItems)
  if (itemErr) throw itemErr
  return order
}

export async function getCustomerOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(title, images)), users!seller_id(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getSellerOrders(sellerId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(title, images)), users!user_id(name, avatar)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAllOrders({ status, sellerId, search } = {}) {
  let q = supabase
    .from('orders')
    .select(`
      *,
      order_items(*, products(title, images)),
      customer:users!user_id(name, email, avatar, avatar_url),
      seller:users!seller_id(name, email, avatar, avatar_url),
      organizations!seller_id(name)
    `)
    .order('created_at', { ascending: false })

  if (status)   q = q.eq('status', status)
  if (sellerId) q = q.eq('seller_id', sellerId)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function adminUpdateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
  if (error) throw error
  return data?.[0]
}

// ═══════════════════════════════════════════════
// MESSAGES / THREADS
// ═══════════════════════════════════════════════
export async function getOrCreateThread({ userId, sellerId, productId }) {
  // Look for existing thread
  const { data: existing } = await supabase
    .from('thread_participants')
    .select('thread_id, threads(*)')
    .eq('user_id', userId)
    .eq('threads.product_id', productId)

  if (existing?.length) {
    const thread = existing.find(e => {
      return e.threads?.product_id === productId
    })
    if (thread) return thread.threads
  }

  // Create new thread
  const { data: thread, error } = await supabase
    .from('threads')
    .insert({ product_id: productId })
    .select()
    .single()
  if (error) throw error

  await supabase.from('thread_participants').insert([
    { thread_id: thread.id, user_id: userId },
    { thread_id: thread.id, user_id: sellerId },
  ])
  return thread
}

export async function getThreadsForUser(userId) {
  const { data, error } = await supabase
    .from('thread_participants')
    .select(`
      threads(
        *,
        products(title, images),
        thread_participants(user_id)
      )
    `)
    .eq('user_id', userId)
  if (error) throw error

  const threads = (data || []).map(d => d.threads).filter(Boolean)

  // Fetch all participant user data separately to get avatar_url
  const allUserIds = [...new Set(
    threads.flatMap(t => (t.thread_participants || []).map(p => p.user_id))
  )]

  if (allUserIds.length) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, avatar, avatar_url')
      .in('id', allUserIds)

    if (users) {
      const userMap = Object.fromEntries(users.map(u => [u.id, u]))
      return threads.map(t => ({
        ...t,
        thread_participants: (t.thread_participants || []).map(p => ({
          ...p,
          users: userMap[p.user_id] || null
        }))
      }))
    }
  }

  return threads
}

export async function getMessages(threadId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, users!sender_id(name, avatar)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage({ threadId, senderId, receiverId, productId, content }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ thread_id: threadId, sender_id: senderId, receiver_id: receiverId, product_id: productId, content })
    .select()
    .single()
  if (error) throw error

  // Update thread last_message
  await supabase.from('threads').update({ last_message: content, last_time: new Date().toISOString() }).eq('id', threadId)
  return data
}

export function subscribeToMessages(threadId, callback) {
  return supabase
    .channel(`messages:${threadId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `thread_id=eq.${threadId}`,
    }, payload => callback(payload.new))
    .subscribe()
}

// ═══════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════
export async function createReview({ userId, sellerId, productId, rating, comment }) {
  const { data, error } = await supabase
    .from('reviews')
    .upsert({ user_id: userId, seller_id: sellerId, product_id: productId, rating, comment }, { onConflict: 'user_id,product_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

async function enrichReviewsWithUsers(reviews) {
  const userIds = [...new Set(reviews.map(r => r.user_id))]
  if (!userIds.length) return reviews
  const { data: users } = await supabase
    .from('users')
    .select('id, name, avatar, avatar_url')
    .in('id', userIds)
  if (!users) return reviews
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))
  return reviews.map(r => ({ ...r, users: userMap[r.user_id] || r.users }))
}

export async function getReviewsByProduct(productId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return enrichReviewsWithUsers(data || [])
}

export async function getReviewsBySeller(sellerId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, products(title)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return enrichReviewsWithUsers(data || [])
}

export async function getUserReviews(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, products(title, images)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ═══════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════
export async function toggleFavorite(userId, productId) {
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('favorites').insert({ user_id: userId, product_id: productId })
    return true
  }
}

export async function getFavorites(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, products(*, categories(name, icon), organizations(name, verified), reviews(rating))')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map(f => ({
    ...f.products,
    avg_rating: f.products?.reviews?.length
      ? +(f.products.reviews.reduce((s, r) => s + r.rating, 0) / f.products.reviews.length).toFixed(1)
      : null,
    review_count: f.products?.reviews?.length || 0,
  }))
}

export async function isFavorited(userId, productId) {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()
  return !!data
}

// ═══════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════
export async function adminGetUsers() {
  const { data, error } = await supabase.from('users').select('*, organizations(name, status)').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function adminGetSellers() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*, users(name, email, city)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function adminGetAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), organizations(name), users!seller_id(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function adminUpdateOrganization(orgId, updates) {
  const { data, error } = await supabase.from('organizations').update(updates).eq('id', orgId).select()
  if (error) throw error
  return data
}

export async function adminUpdateProduct(productId, updates) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', productId).select()
  if (error) throw error
  return data
}

export async function adminDeleteUser(userId) {
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) throw error
}

export async function adminGetStats() {
  const [usersRes, productsRes, ordersRes, orgsRes] = await Promise.all([
    supabase.from('users').select('id, role'),
    supabase.from('products').select('id, status'),
    supabase.from('orders').select('total_price, status'),
    supabase.from('organizations').select('id, status'),
  ])
  const totalRevenue = (ordersRes.data || [])
    .filter(o => o.status !== 'rejected')
    .reduce((s, o) => s + Number(o.total_price), 0)
  return {
    users:           (usersRes.data || []).length,
    sellers:         (orgsRes.data || []).length,
    products:        (productsRes.data || []).length,
    orders:          (ordersRes.data || []).length,
    pendingSellers:  (orgsRes.data || []).filter(o => o.status === 'pending').length,
    pendingProducts: (productsRes.data || []).filter(p => p.status === 'pending').length,
    totalRevenue,
  }
}

// ═══════════════════════════════════════════════
// STORAGE - Product Images
// ═══════════════════════════════════════════════
export async function uploadProductImage(file, productId) {
  try {
    const ext  = file.name.split('.').pop()
    const path = `products/${productId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) {
      console.warn('Image upload failed (bucket may not exist):', error.message)
      return null
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.warn('Image upload skipped:', e.message)
    return null
  }
}
