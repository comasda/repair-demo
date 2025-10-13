import React, { useEffect, useState } from 'react'
import { api } from '../api'
import type { Technician } from '../types'

interface Props {
  orderId: string | null
  onClose: () => void
  onOK: () => void
}

export default function AssignModal({ orderId, onClose, onOK }: Props) {
  const [techs, setTechs] = useState<Technician[]>([])
  const [tech, setTech] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.listTechnicians().then(setTechs)
  }, [])

  async function submit() {
    if (!orderId || !tech) return
    const t = techs.find(t => t.id === tech)!
    setLoading(true)
    try {
      await api.offer(orderId, { technicianId: t.id, technicianName: t.name })
      onOK()
    } catch (e:any) {
      alert(e.message || '指派失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:'0 0 8px'}}>指派工单</h3>
        <div className="row">
          <select value={tech} onChange={e=>setTech(e.target.value)} style={{minWidth:220}}>
            <option value="">选择师傅</option>
            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="spacer" />
        </div>
        <div className="row" style={{justifyContent:'flex-end'}}>
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!tech||loading} onClick={submit}>
            {loading ? '提交中…' : '确定指派'}
          </button>
        </div>
        <div className="small muted">提示：指派后订单进入“待接收（offered）”，由师傅在小程序里选择接受或拒绝。</div>
      </div>
    </div>
  )
}
