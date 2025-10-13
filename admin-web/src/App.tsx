import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import type { Order, OrderStatus } from './types'
import AssignModal from './components/AssignModal'
import OrderTable from './components/OrderTable'

import { auth } from './store/auth'

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.adminLogin(username, password)
      if (data.user.role !== 'admin') throw new Error('该账号不是管理员')
      auth.setToken(data.accessToken)
      auth.setUser(data.user)
      onLogin()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={submit} className="login-box">
        <h2>管理员登录</h2>
        {error && <div className="error">{error}</div>}
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="用户名" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" />
        <button disabled={loading}>{loading ? '登录中...' : '登录'}</button>
      </form>
    </div>
  )
}

const statuses: {key:''|OrderStatus, label:string}[] = [
  { key:'', label:'全部' },
  { key:'pending', label:'待接单' },
  { key:'offered', label:'待接收' },
  { key:'assigned', label:'待签到' },
  { key:'checkedIn', label:'已签到' },
  { key:'awaitingConfirm', label:'待确认' },
  { key:'done', label:'已完成' },
]

export default function App(){
  const [authed, setAuthed] = useState(auth.isAdminAuthed())

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }
  const [status, setStatus] = useState<''|OrderStatus>('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [assignId, setAssignId] = useState<string|null>(null)

  async function load(){
    setLoading(true)
    try{
      const qs = new URLSearchParams()
      if (status) qs.set('status', status)
      const data: Order[] = await api.listOrders(qs.toString())
      setOrders(data || [])
    }catch(e:any){
      alert(e.message || '加载失败')
    }finally{
      setLoading(false)
    }
  }
  useEffect(()=>{ load() }, [status])

  const filtered = useMemo(()=>{
    const k = keyword.trim()
    if (!k) return orders
    return orders.filter(o => (
      (o._id && o._id.includes(k)) ||
      (o.customerName && o.customerName.includes(k)) ||
      (o.technicianName && o.technicianName.includes(k)) ||
      (o.device && o.device.includes(k)) ||
      (o.issue && o.issue.includes(k)) ||
      (o.address && o.address.includes(k)) ||
      (o.locationAddress && o.locationAddress.includes(k))
    ))
  }, [orders, keyword])

  return (
    <div className="container">
      <div className="title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h1>Repair Demo · 管理后台</h1>
        <div className="spacer"/>
        <button className="btn" onClick={load} disabled={loading}>{loading?'刷新中…':'刷新'}</button>
      </div>

      <div className="row">
        <select value={status} onChange={e=>setStatus(e.target.value as any)}>
          {statuses.map(s => <option key={s.label} value={s.key}>{s.label}</option>)}
        </select>
        <input className="input" placeholder="搜索：ID/客户/师傅/设备/问题/地址" value={keyword} onChange={e=>setKeyword(e.target.value)} style={{minWidth:280}} />
        <div className="spacer"/>
        <span className="muted small">API: {import.meta.env.VITE_API_BASE || 'http://localhost:3000'}</span>
      </div>

      <OrderTable data={filtered} onAssign={setAssignId}/>

      {assignId && (
        <AssignModal orderId={assignId} onClose={()=>setAssignId(null)} onOK={()=>{ setAssignId(null); load(); }}/>
      )}
    </div>
  )
}
