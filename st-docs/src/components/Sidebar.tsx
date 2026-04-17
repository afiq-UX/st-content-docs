import { useState } from 'react'
import { GROUPS_CONFIG, CONTENT_TYPES } from '../data.ts'

interface SidebarProps {
  activeId: string | null
  onNavigate: (id: string | null) => void
}

export default function Sidebar({ activeId, onNavigate }: SidebarProps) {
  const groups = GROUPS_CONFIG.filter(g =>
    CONTENT_TYPES.some(ct => ct.group === g.label)
  )
  const [openGroups, setOpenGroups] = useState<string[]>(GROUPS_CONFIG.map(g => g.label))
  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    )
  }
  return (
    <aside id="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-logo"><i className="ti ti-bolt" /></div>
        <div className="sb-brand-eyebrow">Suruhanjaya Tenaga</div>
        <div className="sb-brand-title">Content Management<br/>Guide</div>
      </div>
      <div className="sb-topbar">
        <div className="sb-search">
          <i className="ti ti-search sb-search-icon" />
          <input type="text" placeholder="Search content types…" autoComplete="off"/>
        </div>
      </div>
      <div className="sb-nav-scroll">
        {groups.map(g => {
          const items = CONTENT_TYPES.filter(ct => ct.group === g.label)
          const isOpen = openGroups.includes(g.label)
          return (
            <div key={g.label} className={`sb-group ${isOpen ? 'open' : ''}`}>
              <div className="sb-group-header" onClick={() => toggleGroup(g.label)}>
                <div className="sb-group-icon" style={{color: g.color}}>
                  <i className={`ti ${g.icon}`} />
                </div>
                <div className="sb-group-label-wrap">
                  <span className="sb-group-label">{g.label}</span>
                </div>
                <i className="ti ti-chevron-right sb-group-chevron" />
              </div>
              <div className="sb-group-items">
                {items.map(ct => (
                  <div
                    key={ct.id}
                    className={`sb-item ${activeId === ct.id ? 'active' : ''}`}
                    onClick={() => onNavigate(ct.id)}
                  >
                    <span className="sb-item-label">{ct.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="sb-footer">
        <button className="sb-new-btn">
          <i className="ti ti-plus" /> New Content Type
        </button>
      </div>
    </aside>
  )
}