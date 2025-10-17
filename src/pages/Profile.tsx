import { useEffect, useMemo, useState } from 'react'
import { buildImageUrl } from '../services/products'

export default function Profile() {
  const [styleTag, setStyleTag] = useState('')
  const max = 140
  const STORAGE_KEY = 'profile.styleTag'
  const [saved, setSaved] = useState(false)

  type WardrobeKey = 'pants' | 'tshirts' | 'long-sleeve' | 'button-ups' | 'coats' | 'shoes' | 'shorts'
  const wardrobe: { key: WardrobeKey; label: string; emoji: string }[] = [
    { key: 'pants', label: 'Pants', emoji: '👖' },
    { key: 'tshirts', label: 'T-Shirts', emoji: '👕' },
    { key: 'long-sleeve', label: 'Long Sleeve', emoji: '👚' },
    { key: 'button-ups', label: 'Button Ups', emoji: '👔' },
    { key: 'coats', label: 'Coats', emoji: '🧥' },
    { key: 'shoes', label: 'Shoes', emoji: '👞' },
    { key: 'shorts', label: 'Shorts', emoji: '🩳' },
  ]
  const [openCat, setOpenCat] = useState<WardrobeKey | null>(null)
  const [galleryTab, setGalleryTab] = useState<'posts' | 'wardrobe'>('posts')

  // Build deterministic images per category and tab
  const galleryImages = useMemo(() => {
    if (!openCat) return [] as string[]
    const count = 12
    const w = 600, h = 750 // portrait grid
    const modeTags = galleryTab === 'posts'
      ? ['person','model','portrait','wearing','fashion']
      : ['clothing','apparel','product','studio','flat lay']

    const baseTags: Record<WardrobeKey, string[]> = {
      pants: ['pants','trousers','clothes'],
      'tshirts': ['tshirt','tee','shirt','clothes'],
      'long-sleeve': ['long sleeve shirt','shirt','blouse','clothes'],
      'button-ups': ['button up shirt','oxford','shirt','clothes'],
      coats: ['coat','jacket','outerwear','clothes'],
      shoes: ['shoes','sneakers','footwear'],
      shorts: ['shorts','clothes'],
    }
    const provider = ((import.meta as any).env?.VITE_IMAGE_SOURCE ?? 'loremflickr') === 'unsplash' ? 'unsplash' : 'loremflickr'

    const tagsCSV = [...baseTags[openCat], ...modeTags].map(encodeURIComponent).join(',')
    const images: string[] = []
    for (let i = 0; i < count; i++) {
      // simple signature for stability
      let hsh = 2166136261 >>> 0
      const seed = `${openCat}|${galleryTab}|${i}`
      for (let j = 0; j < seed.length; j++) { hsh ^= seed.charCodeAt(j); hsh = Math.imul(hsh, 16777619) }
      const sig = (hsh >>> 0) % 10000
      images.push(buildImageUrl(provider as any, tagsCSV, sig, w, h))
    }
    return images
  }, [openCat, galleryTab])

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
            <button
              key={item.key}
              type="button"
              className="wardrobe-card"
              aria-label={item.label}
              onClick={() => { setOpenCat(item.key); setGalleryTab('posts') }}
            >
              <div className="wardrobe-icon" aria-hidden>{item.emoji}</div>
              <div className="wardrobe-label">{item.label}</div>
            </button>
          ))}
        </div>
      </section>

      {openCat && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`${wardrobe.find(w => w.key === openCat)?.label} gallery`}>
          <div className="modal-panel">
            <div className="modal-header">
              <h3>{wardrobe.find(w => w.key === openCat)?.label}</h3>
              <button className="modal-close" aria-label="Close" onClick={() => setOpenCat(null)}>✕</button>
            </div>
            <div className="modal-tabs">
              <button
                className={`tab ${galleryTab === 'posts' ? 'active' : ''}`}
                onClick={() => setGalleryTab('posts')}
              >Posts</button>
              <button
                className={`tab ${galleryTab === 'wardrobe' ? 'active' : ''}`}
                onClick={() => setGalleryTab('wardrobe')}
              >Wardrobe</button>
            </div>
            <div className="modal-grid">
              {galleryImages.map((src, idx) => (
                <div className="grid-item" key={idx}>
                  <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
