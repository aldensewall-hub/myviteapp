import { useEffect, useState } from 'react'

export default function Profile() {
  const [styleTag, setStyleTag] = useState('')
  const max = 140
  const STORAGE_KEY = 'profile.styleTag'
  const [saved, setSaved] = useState(false)

  const wardrobe = [
    { key: 'pants', label: 'Pants', emoji: '👖' },
    { key: 'tshirts', label: 'T-Shirts', emoji: '👕' },
    { key: 'long-sleeve', label: 'Long Sleeve', emoji: '👚' },
    { key: 'button-ups', label: 'Button Ups', emoji: '👔' },
    { key: 'coats', label: 'Coats', emoji: '🧥' },
    { key: 'shoes', label: 'Shoes', emoji: '👞' },
    { key: 'shorts', label: 'Shorts', emoji: '🩳' },
  ]

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      if (v) setStyleTag(v)
    } catch {}
  }, [])

  // Save to localStorage when it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, styleTag)
    } catch {}
  }, [styleTag])
  return (
    <section className="profile-page">
      <div className="profile-header">
        <div className="polaroid" aria-label="Profile picture placeholder">
          <div className="polaroid-photo">
            <div className="silhouette" aria-hidden />
            <span className="camera" aria-hidden>📷</span>
          </div>
          <div className="polaroid-caption">Profile</div>
        </div>
        <div className="style-tag-wrap">
          <label htmlFor="styleTag">Style Tag</label>
          <textarea
            id="styleTag"
            maxLength={max}
            value={styleTag}
            onChange={(e) => setStyleTag(e.target.value)}
            placeholder="Add a brief description (max 140 chars)"
          />
          <div className="help">
            <span>Max 140 characters</span>
            <span className="counter" data-counter>{styleTag.length} / {max}</span>
            <div className="actions">
              <button
                type="button"
                className="btn-save"
                onClick={() => {
                  try {
                    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, styleTag)
                    setSaved(true)
                    setTimeout(() => setSaved(false), 1200)
                  } catch {}
                }}
              >Save</button>
              {saved && <span className="saved">Saved</span>}
            </div>
          </div>
        </div>
      </div>
  

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-value">12</div>
          <div className="stat-label">Tagged Stores</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">34</div>
          <div className="stat-label">Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">18</div>
          <div className="stat-label">Favorites</div>
        </div>
      </div>

      <section className="wardrobe" aria-label="Digital Wardrobe">
        <div className="wardrobe-header">
          <h2>Digital Wardrobe</h2>
        </div>
        <div className="wardrobe-scroller">
          {wardrobe.map((item) => (
            <button key={item.key} type="button" className="wardrobe-card" aria-label={item.label}>
              <div className="wardrobe-icon" aria-hidden>{item.emoji}</div>
              <div className="wardrobe-label">{item.label}</div>
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}
