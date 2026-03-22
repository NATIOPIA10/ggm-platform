// Price formatting
export function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '-'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M Birr'
  if (num >= 1_000)     return num.toLocaleString() + ' Birr'
  return num + ' Birr'
}

// Date formatting
export function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Time formatting
export function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// Relative time
export function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return formatDate(d)
}

// Get initials from name
export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

// Stars display
export function starsDisplay(rating) {
  const n = Math.round(rating || 0)
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

// Ethiopian cities
export const CITIES = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Adama', 'Hawassa',
  'Bahir Dar', 'Dessie', 'Jimma', 'Jijiga', 'Shashamane',
  'Bishoftu', 'Sodo', 'Arba Minch', 'Harar', 'Dilla',
]

// Order statuses
export const ORDER_STATUSES = ['pending', 'accepted', 'processing', 'delivered', 'completed']

export function orderStatusColor(status) {
  const map = { pending: 'amber', accepted: 'blue', processing: 'blue', delivered: 'green', completed: 'green', rejected: 'red' }
  return map[status] || 'gray'
}

// Truncate text
export function truncate(str, n = 80) {
  if (!str) return ''
  return str.length <= n ? str : str.slice(0, n) + '...'
}
