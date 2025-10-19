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
  const [remoteImages, setRemoteImages] = useState<string[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [localUploads, setLocalUploads] = useState<string[]>([])
  const localKey = (cat: WardrobeKey, tab: 'posts' | 'wardrobe') => `uploads.${cat}.${tab}`
  const baseApi: string | undefined = (import.meta as any).env?.VITE_PRODUCTS_API_URL

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

  // Load uploaded media from backend if configured
  useEffect(() => {
    let ignore = false
    async function run() {
      if (!openCat) return
      setIsLoadingMedia(true)
      try {
        if (!baseApi) { setRemoteImages([]); return }
        const url = new URL('/media', baseApi)
        url.searchParams.set('category', openCat)
        url.searchParams.set('tab', galleryTab)
        const r = await fetch(url.toString())
        if (!ignore && r.ok) {
          const j = await r.json()
          const items = Array.isArray(j.items) ? j.items : []
          setRemoteImages(items.map((i: any) => i.url).filter(Boolean))
        }
      } catch {
        if (!ignore) setRemoteImages([])
      } finally {
        if (!ignore) setIsLoadingMedia(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [openCat, galleryTab])

  // Load local uploads fallback
  useEffect(() => {
    if (!openCat) return
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(localKey(openCat, galleryTab)) : null
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) setLocalUploads(arr.filter((s: any) => typeof s === 'string'))
    } catch { setLocalUploads([]) }
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
              {isLoadingMedia && <div className="grid-loading">Loading…</div>}
              {[...localUploads, ...remoteImages, ...galleryImages].slice(0, 12).map((src, idx) => (
                <div className="grid-item" key={idx}>
                  <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <label className="btn-upload">
                <input type="file" accept="image/*" hidden onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !openCat) return
                  try {
                    if (!baseApi) {
                      // Fallback: persist as data URL in localStorage
                      const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.onerror = reject
                        reader.readAsDataURL(f)
                      })
                      const dataUrl = await toDataUrl(file)
                      setLocalUploads(prev => {
                        const next = [dataUrl, ...prev]
                        try { if (typeof window !== 'undefined') window.localStorage.setItem(localKey(openCat, galleryTab), JSON.stringify(next)) } catch {}
                        return next
                      })
                      return
                    }
                    const fd = new FormData()
                    fd.set('category', openCat)
                    fd.set('tab', galleryTab)
                    fd.set('file', file)
                    const r = await fetch(new URL('/upload', baseApi).toString(), { method: 'POST', body: fd })
                    if (r.ok) {
                      const j = await r.json()
                      if (j?.url) setRemoteImages(prev => [j.url, ...prev])
                    } else {
                      alert('Upload failed')
                    }
                  } catch {
                    alert('Upload error')
                  } finally {
                    e.currentTarget.value = ''
                  }
                }} />
                Upload photo
              </label>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
