import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductsAdvanced, buildImageUrl, type Product } from '../services/products'

function titleCaseWords(s: string) {
  return s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : w).join(' ')
}

export default function Store() {
  const { storeSlug = '' } = useParams()
  const [items, setItems] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [useBrandFilter, setUseBrandFilter] = useState<boolean | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const storeName = useMemo(() => titleCaseWords(decodeURIComponent(storeSlug)), [storeSlug])

  type StoreMeta = {
    name: string
    logoUrl?: string
    tagline?: string
    location?: string
    verified?: boolean
    followers?: number
  }

  function getDefaultFollowers(slug: string): number {
    // Deterministic pseudo-random follower baseline per slug
    let h = 2166136261 >>> 0
    for (let i = 0; i < slug.length; i++) { h ^= slug.charCodeAt(i); h = Math.imul(h, 16777619) }
    return 1200 + (h % 4800) // 1.2k - 6k
  }

  const meta: StoreMeta & { storyIntro?: string; storyLong?: string; badges?: { label: string; icon: string }[]; storyVideoUrl?: string } = useMemo(() => {
    const slug = (storeSlug || '').toLowerCase()
    if (slug === 'id-mensware') {
      return {
        name: 'ID Mensware',
        logoUrl: '/stores/id-mensware/logo.png',
        tagline: 'Handmade Brooklyn streetwear',
        location: 'Brooklyn, NY, USA',
        verified: true,
        followers: getDefaultFollowers(slug),
        storyIntro: 'Born in Brooklyn, ID Mensware blends meticulous craft with an everyday silhouette—made for movement, designed to last.',
        storyLong: 'Our studio began as a one-room workshop on a quiet street in Williamsburg. We obsess over fabric feel, and we partner with small mills that share our commitment to low-impact dyeing. Every piece is cut and sewn locally in small runs, which means less waste and more intention. From selvage shirts to charcoal trousers, our pieces are designed to work hard and age beautifully.',
        badges: [
          { label: 'Eco', icon: '♻️' },
          { label: 'Local materials', icon: '🌎' },
          { label: 'Small-batch', icon: '🧵' },
        ],
        storyVideoUrl: '/stores/id-mensware/intro.mp4'
      }
    }
    return {
      name: storeName,
      logoUrl: `/stores/${slug}/logo.png`,
      tagline: `Curated ${storeName.split(' ')[0]} fashion`,
      location: 'Paris, France',
      verified: false,
      followers: getDefaultFollowers(slug),
      storyIntro: `${storeName} curates pieces with a focus on thoughtful fabrication and timeless shape—made to mix and made to last.`,
      storyLong: `Every collection is edited to essentials and designed to be lived in. We work with partners who prioritize responsible dyeing and low-waste cutting floors. The result is a wardrobe that feels personal, comfortable, and built for longevity.`,
      badges: [
        { label: 'Eco', icon: '♻️' },
        { label: 'Local materials', icon: '🌎' },
      ],
      storyVideoUrl: `/stores/${slug}/intro.mp4`
    }
  }, [storeSlug, storeName])

  // Hero image URL with graceful fallbacks
  const heroUrl = `/stores/${(storeSlug || '').toLowerCase()}/hero.jpg`
  const [storyOpen, setStoryOpen] = useState(false)
  type Collection = { slug: string; title: string; coverUrl: string }
  const collections: Collection[] = useMemo(() => {
    const slug = (storeSlug || '').toLowerCase()
    const base = `/stores/${slug}`
    const defs: Collection[] = [
      { slug: 'fall-edit', title: 'Fall Edit', coverUrl: `${base}/collections/fall-edit.jpg` },
      { slug: 'streetwear-drops', title: 'Streetwear Drops', coverUrl: `${base}/collections/streetwear-drops.jpg` },
      { slug: 'handwoven-line', title: 'Handwoven Line', coverUrl: `${base}/collections/handwoven-line.jpg` },
    ]
    return defs
  }, [storeSlug])

  // Follow state persisted in localStorage
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [followers, setFollowers] = useState<number>(meta.followers ?? 0)

  useEffect(() => {
    const baseKey = `store.${storeSlug}`
    try {
      const savedFollow = window.localStorage.getItem(`${baseKey}.following`)
      const savedCount = window.localStorage.getItem(`${baseKey}.followers`)
      setIsFollowing(savedFollow === '1')
      if (savedCount) setFollowers(parseInt(savedCount, 10) || (meta.followers ?? 0))
      else setFollowers(meta.followers ?? 0)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug])

  function toggleFollow() {
    setIsFollowing(prev => {
      const next = !prev
      setFollowers(c => {
        const newCount = Math.max(0, c + (next ? 1 : -1))
        try {
          const baseKey = `store.${storeSlug}`
          window.localStorage.setItem(`${baseKey}.followers`, String(newCount))
        } catch {}
        return newCount
      })
      try {
        const baseKey = `store.${storeSlug}`
        window.localStorage.setItem(`${baseKey}.following`, next ? '1' : '0')
      } catch {}
      return next
    })
  }

  // Optional, curated hero if we know this store
  const hero = useMemo<Product | null>(() => {
    const slug = storeSlug.toLowerCase()
    if (slug === 'id-mensware') {
      return {
        id: 'hero-idmensware-selvage',
        title: 'Selvage Long Sleeve Stretch',
        price: 98.0,
        image: '/featured/selvage-long-sleeve.jpg',
        category: 'long sleeve',
        location: 'Brooklyn, NY',
        brands: ['ID Mensware'],
        color: 'Burgundy',
      } as Product
    }
    return null
  }, [storeSlug])

  // Initial load or when store changes
  useEffect(() => {
    let ignore = false
    setItems([])
    setPage(0)
    setHasMore(true)
    setUseBrandFilter(null)
    setLoading(true)
    fetchProductsAdvanced({ style: 'Casual', page: 0, pageSize: 12 }).then(res => {
      if (ignore) return
      const filtered = res.items.filter(i => i.brands.some(b => b.toLowerCase() === storeName.toLowerCase()))
      if (filtered.length >= 1) {
        setItems(filtered)
        setUseBrandFilter(true)
      } else {
        setItems(res.items)
        setUseBrandFilter(false)
      }
      setHasMore(res.hasMore)
      setPage(1)
    }).finally(() => setLoading(false))
    return () => { ignore = true }
  }, [storeName])

  // Infinite loader
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true)
        fetchProductsAdvanced({ style: 'Casual', page, pageSize: 12 }).then(res => {
          const next = useBrandFilter ? res.items.filter(i => i.brands.some(b => b.toLowerCase() === storeName.toLowerCase())) : res.items
          setItems(prev => [...prev, ...next])
          setHasMore(res.hasMore)
          setPage(p => p + 1)
        }).finally(() => setLoading(false))
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [storeName, page, hasMore, loading, useBrandFilter])

  return (
    <section className="shop-page">
      <div className="store-hero">
        <div className="store-hero-media">
          <img
            className="hero-pan"
            src={heroUrl}
            alt={`${meta.name} storefront`}
            loading="eager"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement
              const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1' | '2'
              const slug = (storeSlug || '').toLowerCase()
              const sig = Math.abs((slug + '|' + meta.name).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
              if (attempt === '0') {
                el.dataset.fallbackAttempt = '1'
                const w = 1600, h = 900
                const tags = ['storefront','boutique','fashion','window','runway','street style', meta.name].map(encodeURIComponent).join(',')
                el.src = buildImageUrl('unsplash', tags, sig, w, h)
                return
              }
              if (attempt === '1') {
                el.dataset.fallbackAttempt = '2'
                const w = 1600, h = 900
                const tags = ['storefront','boutique','fashion','window','street','shop'].map(encodeURIComponent).join(',')
                el.src = buildImageUrl('loremflickr', tags, sig, w, h)
                return
              }
              // Final: SVG banner with initials
              const initials = meta.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
              const bg1 = '#f5efe2'
              const bg2 = '#efe6d3'
              const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='1600' height='900' fill='url(#bg)'/>
  <text x='50%' y='48%' text-anchor='middle' font-family='Poppins, Arial, sans-serif' font-size='240' fill='#2b2b2b' font-weight='800' opacity='0.15'>${initials}</text>
  <text x='50%' y='70%' text-anchor='middle' font-family='Poppins, Arial, sans-serif' font-size='42' fill='#2b2b2b'>${meta.name}</text>
</svg>`
              el.onerror = null
              el.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
            }}
          />
        </div>
        <div className="store-profile overlay">
          <div className="store-logo" aria-hidden>
            <img
              src={meta.logoUrl}
              alt=""
              loading="lazy"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement
                // Generate simple monogram fallback
                const initials = meta.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
                const bg1 = '#f5efe2'
                const bg2 = '#efe6d3'
                const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='160' height='160' rx='20' fill='url(#bg)'/>
  <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Poppins, Arial, sans-serif' font-size='64' fill='#2b2b2b' font-weight='800'>${initials}</text>
</svg>`
                el.onerror = null
                el.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
              }}
            />
          </div>
          <div className="store-meta">
            <div className="store-title-row">
              <h1 className="shop-title" style={{ margin: 0 }}>{meta.name}</h1>
              {meta.verified && <span className="badge-verified" title="Verified">Verified</span>}
            </div>
            {meta.tagline && <p className="store-tagline">{meta.tagline}</p>}
            <div className="store-meta-row">
              {meta.location && <span className="store-location">{meta.location}</span>}
              <button className={`btn-follow ${isFollowing ? 'following' : ''}`} onClick={toggleFollow}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <span className="followers-count">{followers.toLocaleString()} followers</span>
            </div>
          </div>
        </div>
      </div>
      <div className="store-story">
        {/* Optional video intro if available */}
        {meta.storyVideoUrl && (
          <div className="story-media">
            <video
              className="story-video"
              src={meta.storyVideoUrl}
              controls
              preload="metadata"
              onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
            />
          </div>
        )}
        {meta.storyIntro && <p className="story-intro">{meta.storyIntro}</p>}
        {meta.badges && meta.badges.length > 0 && (
          <div className="badge-row">
            {meta.badges.map(b => (
              <span key={b.label} className="badge"><span className="i">{b.icon}</span> {b.label}</span>
            ))}
          </div>
        )}
        <button className="btn-story" onClick={() => setStoryOpen(true)}>Read full story</button>
      </div>

      {/* Featured Collections */}
      <section className="collections">
        <div className="collections-header">
          <h2>Featured Collections</h2>
        </div>
        <div className="collections-scroller">
          {collections.map((c) => (
            <a key={c.slug} className="collection-card" href={`/stores/${encodeURIComponent(storeSlug || '')}/collections/${encodeURIComponent(c.slug)}`}>
              <span className="cover">
                <img
                  src={c.coverUrl}
                  alt={`${c.title} cover`}
                  loading="lazy"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement
                    const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1'
                    const sig = Math.abs(((storeSlug||'') + '|' + c.slug).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    if (attempt === '0') {
                      el.dataset.fallbackAttempt = '1'
                      const w = 960, h = 640
                      const tags = ['storefront','boutique','editorial','fashion','window','runway'].map(encodeURIComponent).join(',')
                      el.src = buildImageUrl('unsplash', tags, sig, w, h)
                      return
                    }
                    const w = 960, h = 640
                    const tags = ['storefront','boutique','fashion'].map(encodeURIComponent).join(',')
                    el.src = buildImageUrl('loremflickr', tags, sig, w, h)
                  }}
                />
              </span>
              <span className="title">{c.title}</span>
            </a>
          ))}
        </div>
      </section>

      {hero && (
        <div className="product-grid large-cards">
          <article key={hero.id} className="product-card big">
            <div className="big-img-wrap">
              <img
                src={hero.image}
                alt={hero.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1' | '2' | '3'
                  if (attempt === '0') {
                    el.dataset.fallbackAttempt = '1'
                    const w = 800, h = 1000
                    const people = ['person','model','portrait','street','fashion','wearing']
                    const catMap: Record<string, string[]> = {
                      'long sleeve': ['long sleeve','shirt','blouse'],
                    }
                    const parts = [hero.color.toLowerCase(), ...(catMap[hero.category]||[]), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((hero.id + '|' + hero.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('unsplash', query, sig, w, h)
                    return
                  }
                  if (attempt === '1') {
                    el.dataset.fallbackAttempt = '2'
                    const w = 800, h = 1000
                    const people = ['person','model','portrait','street','fashion','wearing']
                    const tagMap: Record<string, string[]> = {
                      'long sleeve': ['shirt','blouse','clothes'],
                    }
                    const parts = [hero.color.toLowerCase(), ...(tagMap[hero.category]||['clothes']), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((hero.id + '|' + hero.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('loremflickr', query, sig, w, h)
                    return
                  }
                  if (attempt === '2') {
                    el.dataset.fallbackAttempt = '3'
                    const bg1 = '#f5efe2'
                    const bg2 = '#efe6d3'
                    const shirt = '#6b1f2a'
                    const label = `${hero.color} ${hero.category}`
                    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='800' height='1000' fill='url(#bg)'/>
  <circle cx='400' cy='360' r='70' fill='#cfc7b6'/>
  <path d='M260 450 Q400 380 540 450 L560 660 Q400 740 240 660 Z' fill='${shirt}' opacity='0.9'/>
  <text x='400' y='820' font-family='Poppins, Arial, sans-serif' font-size='28' fill='#2b2b2b' text-anchor='middle'>${label}</text>
</svg>`
                    el.onerror = null
                    el.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                    return
                  }
                  el.onerror = null
                }}
              />
            </div>
            <div className="big-info">
              <h3 className="city">{hero.location}</h3>
              <div className="brands">{hero.brands.join(', ')}</div>
              <div className="brands">{hero.color} {hero.category}</div>
            </div>
          </article>
        </div>
      )}

      <div className="product-grid large-cards">
        {items.map(p => (
          <article key={p.id} className="product-card big">
            <div className="big-img-wrap">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1' | '2' | '3'
                  if (attempt === '0') {
                    el.dataset.fallbackAttempt = '1'
                    const w = 800, h = 1000
                    const people = ['person','model','portrait','street','fashion','wearing']
                    const catMap: Record<string, string[]> = {
                      'short sleeve': ['t-shirt','tee','short sleeve'],
                      'long sleeve': ['long sleeve','shirt','blouse'],
                      'jackets': ['jacket','outerwear','coat'],
                      'jeans': ['jeans','denim'],
                      'pants': ['pants','trousers'],
                      'sweaters': ['sweater','knitwear'],
                      'hoodies': ['hoodie','sweatshirt'],
                      'dresses': ['dress'],
                      'skirts': ['skirt'],
                      'accessories': ['handbag','bag','accessories'],
                    }
                    const parts = [p.color.toLowerCase(), ...(catMap[p.category]||[]), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((p.id + '|' + p.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('unsplash', query, sig, w, h)
                    return
                  }
                  if (attempt === '1') {
                    el.dataset.fallbackAttempt = '2'
                    const w = 800, h = 1000
                    const people = ['person','model','portrait','street','fashion','wearing']
                    const tagMap: Record<string, string[]> = {
                      'short sleeve': ['tshirt','shirt','clothes'],
                      'long sleeve': ['shirt','blouse','clothes'],
                      'jackets': ['jacket','coat','outerwear'],
                      'jeans': ['jeans','denim','clothes'],
                      'pants': ['pants','trousers','clothes'],
                      'sweaters': ['sweater','knitwear','clothes'],
                      'hoodies': ['hoodie','sweatshirt','clothes'],
                      'dresses': ['dress','clothes'],
                      'skirts': ['skirt','clothes'],
                      'accessories': ['bag','handbag','accessories'],
                    }
                    const parts = [p.color.toLowerCase(), ...(tagMap[p.category]||['clothes']), ...people]
                    const query = parts.map(encodeURIComponent).join(',')
                    const sig = Math.abs((p.id + '|' + p.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                    el.src = buildImageUrl('loremflickr', query, sig, w, h)
                    return
                  }
                  if (attempt === '2') {
                    el.dataset.fallbackAttempt = '3'
                    const bg1 = '#f5efe2'
                    const bg2 = '#efe6d3'
                    const shirt = '#2b2b2b'
                    const label = `${p.color} ${p.category}`
                    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${bg1}'/>
      <stop offset='100%' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect x='0' y='0' width='800' height='1000' fill='url(#bg)'/>
  <circle cx='400' cy='360' r='70' fill='#cfc7b6'/>
  <path d='M260 450 Q400 380 540 450 L560 660 Q400 740 240 660 Z' fill='${shirt}' opacity='0.9'/>
  <text x='400' y='820' font-family='Poppins, Arial, sans-serif' font-size='28' fill='#2b2b2b' text-anchor='middle'>${label}</text>
</svg>`
                    el.onerror = null
                    el.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                    return
                  }
                  el.onerror = null
                }}
              />
            </div>
            <div className="big-info">
              <h3 className="city">{p.location}</h3>
              <div className="brands">{p.brands.join(', ')}</div>
              <div className="brands">{p.color} {p.category}</div>
            </div>
          </article>
        ))}
      </div>

      {loading && <p className="status">Loading…</p>}
      <div ref={sentinelRef} aria-hidden="true" />
      {!hasMore && <p className="status">You have reached the end.</p>}
      {storyOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <h3>Our story</h3>
              <button className="modal-close" aria-label="Close" onClick={() => setStoryOpen(false)}>✕</button>
            </div>
            <div className="modal-grid">
              <div className="grid-item" style={{ gridColumn: '1 / -1' }}>
                <div style={{ padding: '12px 12px 0', color: '#2b2b2b' }}>
                  <p style={{ marginTop: 0 }}>{meta.storyLong}</p>
                </div>
              </div>
              {[1,2,3].map(n => (
                <div key={n} className="grid-item">
                  <div className="img-wrap">
                    <img
                      src={`/stores/${(storeSlug||'').toLowerCase()}/story/${n}.jpg`}
                      alt={`${meta.name} story ${n}`}
                      loading="lazy"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement
                        const attempt = (el.dataset.fallbackAttempt || '0') as '0' | '1'
                        const sig = Math.abs(((storeSlug||'') + '|' + meta.name + '|' + n).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                        if (attempt === '0') {
                          el.dataset.fallbackAttempt = '1'
                          const w = 800, h = 1000
                          const tags = ['atelier','workshop','fabric','details','fashion','editorial'].map(encodeURIComponent).join(',')
                          el.src = buildImageUrl('unsplash', tags, sig, w, h)
                          return
                        }
                        const w = 800, h = 1000
                        const tags = ['atelier','workshop','fashion','details'].map(encodeURIComponent).join(',')
                        el.src = buildImageUrl('loremflickr', tags, sig, w, h)
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="grid-item" style={{ gridColumn: '1 / -1' }}>
                <div style={{ padding: '0 12px 12px', color: '#6b6b6b', fontSize: '0.95rem' }}>
                  <p>Questions about fit, fabric, or care? Reach us anytime—this is what we love to talk about.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
