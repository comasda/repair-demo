import React from 'react'
import type { Order } from '../types'

function Badge({ status, text }: { status: string, text: string }) {
  return <span className={`badge status-${status}`}>{text}</span>
}

interface Props {
  data: Order[]
  onAssign: (id: string) => void
}

export default function OrderTable({ data, onAssign }: Props) {
  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>创建时间</th>
            <th>客户</th>
            <th>设备/问题</th>
            <th>地址</th>
            <th>师傅</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map(o => (
            <tr key={o._id}>
              <td className="muted small">{o._id}</td>
              <td>{o.time || '-'}</td>
              <td>{o.customerName || '-'}</td>
              <td>{(o.device||'-') + (o.issue?(' / '+o.issue):'')}</td>
              <td>{o.address || o.locationAddress || '-'}</td>
              <td>{o.technicianName || '-'}</td>
              <td><Badge status={o.status} text={o.statusText || o.status} /></td>
              <td>
                {(o.status==='pending' || o.status==='offered') && (
                  <button className="btn primary" onClick={()=>onAssign(o._id)}>
                    {o.status==='pending' ? '指派' : '改派'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
