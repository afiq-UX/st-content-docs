import { GROUPS_CONFIG, CONTENT_TYPES } from '../data.ts'

interface WelcomeViewProps {
  onNavigate: (id: string | null) => void
}

export default function WelcomeView({ onNavigate }: WelcomeViewProps) {
  const totalTypes = CONTENT_TYPES.length

  return (
    <div className="main-inner">
      <div className="welcome-hero">
        <div className="welcome-eyebrow"><i className="ti ti-bolt" /> st.gov.my · Drupal 11</div>
        <h1>Content Management Guide</h1>
        <p>Reference documentation for the Operations Team. Covers all content types, their fields, and the taxonomy categories used across the site.</p>
        <div className="welcome-stats">
          <span className="stat-chip"><i className="ti ti-layers" /> {totalTypes} Content Types</span>
          <span className="stat-chip"><i className="ti ti-tags" /> 13 Taxonomy Vocabularies</span>
          <span className="stat-chip"><i className="ti ti-language" /> Bilingual EN / BM</span>
          <span className="stat-chip"><i className="ti ti-cube" /> Drupal 11</span>
        </div>
      </div>

      <div className="welcome-callout">
        <i className="ti ti-info-circle" />
        <span><strong>How to use this guide:</strong> Select a content type from the sidebar or click a group card below.</span>
      </div>

      <div className="group-grid">
        {GROUPS_CONFIG.map(g => {
          const items = CONTENT_TYPES.filter(ct => ct.group === g.label)
          if (!items.length) return null
          return (
            <div
              key={g.label}
              className="group-card"
              style={{'--card-accent': g.color} as React.CSSProperties}
              onClick={() => onNavigate(items[0].id)}
            >
              <div className="group-card-icon" style={{color: g.color}}>
                <i className={`ti ${g.icon}`} />
              </div>
              <div className="group-card-title">{g.label}</div>
              <div className="group-card-desc">{g.desc}</div>
              <div className="group-card-count">
                <i className="ti ti-layers" /> {items.length} content type{items.length !== 1 ? 's' : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}