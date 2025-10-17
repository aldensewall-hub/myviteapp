import { useState } from 'react'

export default function Profile() {
  const [styleTag, setStyleTag] = useState('')
  const max = 140
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
          </div>
        </div>
      </div>
      <h1>My Profile</h1>
      <p>Account details and order history will live here.</p>
    </section>
  )
}
