const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || ''

async function http(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type','application/json')
  if (ADMIN_TOKEN) headers.set('X-Admin-Token', ADMIN_TOKEN)
  const res = await fetch(API_BASE + path, { ...options, headers })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); msg = j.message || msg } catch {}
    throw new Error(msg)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

export const api = {
  // orders
  listOrders: (qs: string = '') => http('/orders' + (qs ? ('?' + qs) : '')),
  offer: (id: string, data: {technicianId:string, technicianName:string, adminId?:string, adminName?:string}) =>
    http(`/orders/${id}/offer`, { method:'POST', body: JSON.stringify(data) }),
  // technicians: you can wire this to your real API. For demo we return a hard-coded list.
  listTechnicians: async () => {
    // replace with real endpoint: return http('/technicians')
    return [
      { id:'tech_001', name:'王师傅' },
      { id:'tech_002', name:'李师傅' },
      { id:'tech_003', name:'赵师傅' },
    ]
  }
}
