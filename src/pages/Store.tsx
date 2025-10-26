import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProductsAdvanced, buildImageUrl, type Product, type Style } from '../services/products'

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
  const BRAND_FOCUS = 'ID Mensware'
  const brandFocusLow = BRAND_FOCUS.toLowerCase()

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

  // Filters and sorting
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'default'>('default')
  const [styleFilter, setStyleFilter] = useState<Style>('Casual')
  const [collectionFilter, setCollectionFilter] = useState<string>('')
  const [materialFilter, setMaterialFilter] = useState<string>('')
  const [colorFilter, setColorFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'shop' | 'styled'>('shop')
  const [communityPosts, setCommunityPosts] = useState<string[]>([])

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

  // No featured hero card injected into the catalog; grid begins immediately after filters

  // Initial load or when store or primary filters change
  useEffect(() => {
    let ignore = false
    setItems([])
    setPage(0)
    setHasMore(true)
    setUseBrandFilter(null)
    setLoading(true)
    fetchProductsAdvanced({ style: styleFilter, page: 0, pageSize: 12 }).then(res => {
      if (ignore) return
      const filtered = res.items.filter(i => i.brands.some(b => b.toLowerCase() === brandFocusLow))
      if (filtered.length >= 1) {
        setItems(applySecondaryFilters(filtered))
        setUseBrandFilter(true)
      } else {
        const remapped = res.items.map(i => ({ ...i, brands: [BRAND_FOCUS] }))
        setItems(applySecondaryFilters(remapped))
        setUseBrandFilter(false)
      }
      setHasMore(res.hasMore)
      setPage(1)
    }).finally(() => setLoading(false))
    return () => { ignore = true }
  }, [storeName, styleFilter, collectionFilter, materialFilter, colorFilter, sortBy])

  // Infinite loader
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true)
        fetchProductsAdvanced({ style: styleFilter, page, pageSize: 12 }).then(res => {
          let base = res.items
          if (useBrandFilter) base = res.items.filter(i => i.brands.some(b => b.toLowerCase() === brandFocusLow))
          else base = res.items.map(i => ({ ...i, brands: [BRAND_FOCUS] }))
          const next = applySecondaryFilters(base)
          setItems(prev => sortItems([...prev, ...next]))
          setHasMore(res.hasMore)
          setPage(p => p + 1)
        }).finally(() => setLoading(false))
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [storeName, page, hasMore, loading, useBrandFilter, styleFilter, collectionFilter, materialFilter, colorFilter, sortBy])

  // Helper: secondary filters (collection, material, color) and sorting
  function getCollectionCategories(slug: string): string[] | null {
    const map: Record<string, string[]> = {
      'fall-edit': ['jackets','sweaters','long sleeve'],
      'streetwear-drops': ['hoodies','pants','jeans'],
      'handwoven-line': ['long sleeve','accessories'],
    }
    return map[slug] || null
  }
  function applySecondaryFilters(src: Product[]): Product[] {
    let arr = src
    if (collectionFilter) {
      const cats = getCollectionCategories(collectionFilter)
      if (cats) {
        const set = new Set(cats)
        arr = arr.filter(i => set.has(i.category))
      }
    }
    if (materialFilter) arr = arr.filter(i => (i as any).material === materialFilter)
    if (colorFilter) arr = arr.filter(i => i.color === colorFilter)
    return sortItems(arr)
  }
  function sortItems(arr: Product[]): Product[] {
    if (sortBy === 'price-asc') return [...arr].sort((a,b) => a.price - b.price)
    if (sortBy === 'price-desc') return [...arr].sort((a,b) => b.price - a.price)
    return arr
  }

  // Build image for Styled View (people wearing it)
  function styledImage(p: Product): string {
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
    const parts = [p.color.toLowerCase(), ...(catMap[(p as any).category]||[]), ...people]
    const query = parts.map(encodeURIComponent).join(',')
    const sig = Math.abs((p.id + '|' + p.category + '|styled').split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
    return buildImageUrl('unsplash', query, sig, w, h)
  }

  // Load Community ("Seen in the wild") posts: try backend first, then localStorage, then leave empty
  useEffect(() => {
    let ignore = false
    async function loadCommunity() {
      const baseApi: string | undefined = (import.meta as any).env?.VITE_PRODUCTS_API_URL
      const slug = (storeSlug || '').toLowerCase()
      const results: string[] = []
      if (baseApi) {
        try {
          const url = new URL('/media', baseApi)
          url.searchParams.set('tab', 'posts')
          url.searchParams.set('store', slug)
          url.searchParams.set('tag', 'wild')
          const r = await fetch(url.toString())
          if (r.ok) {
            const j = await r.json().catch(() => ({} as any))
            if (Array.isArray(j.items)) {
              for (const it of j.items) if (it?.url) results.push(it.url)
            }
          }
        } catch {/* ignore */}
      }
      if (!results.length && typeof window !== 'undefined') {
        try {
          const keys = ['pants','long-sleeve','jackets','jeans','hoodies','sweaters','short-sleeve','accessories','skirts','dresses']
          for (const k of keys) {
            const raw = window.localStorage.getItem(`uploads.${k}.posts`)
            const arr = raw ? JSON.parse(raw) : []
            if (Array.isArray(arr)) for (const u of arr) if (typeof u === 'string') results.push(u)
          }
        } catch {/* ignore */}
      }
      // Dedupe and limit
      const uniq = Array.from(new Set(results)).slice(0, 20)
      if (!ignore) setCommunityPosts(uniq)
    }
    loadCommunity()
    return () => { ignore = true }
  }, [storeSlug])

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

      {/* Community - Seen in the wild */}
      <section className="community">
        <h2>Community</h2>
        <div className="community-sub">Seen in the wild</div>
        <div className="community-scroller">
          {communityPosts.length === 0 && [1,2,3,4,5,6].map(n => {
            const sig = Math.abs(((storeSlug||'') + '|wild|' + n).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
            const w = 320, h = 400
            const tags = [meta.name, 'street style','candid','fashion','wearing'].map(encodeURIComponent).join(',')
            const url = buildImageUrl('unsplash', tags, sig, w, h)
            return (
              <div key={`ph-${n}`} className="community-card"><img src={url} alt="Community post" loading="lazy" /></div>
            )
          })}
          {communityPosts.map((u, i) => (
            <div key={`cp-${i}`} className="community-card">
              <img
                src={u}
                alt="Community post"
                loading="lazy"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const sig = Math.abs(((storeSlug||'') + '|wild|' + i).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10000
                  const w = 320, h = 400
                  const tags = [meta.name, 'street style','candid','fashion','wearing'].map(encodeURIComponent).join(',')
                  el.onerror = null
                  el.src = buildImageUrl('loremflickr', tags, sig, w, h)
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Filters and Sorting */}
      <div className="store-filters">
        <div className="row">
          <div className="view-toggle" role="tablist" aria-label="View mode">
            <button
              role="tab"
              aria-selected={viewMode==='shop'}
              className={`seg ${viewMode==='shop'?'active':''}`}
              onClick={() => setViewMode('shop')}
            >Shop View</button>
            <button
              role="tab"
              aria-selected={viewMode==='styled'}
              className={`seg ${viewMode==='styled'?'active':''}`}
              onClick={() => setViewMode('styled')}
            >Styled View</button>
          </div>
          <label>
            Sort
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="default">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
          <label>
            Style
            <select value={styleFilter} onChange={e => setStyleFilter(e.target.value as Style)}>
              <option value="Streetwear">Streetwear</option>
              <option value="Casual">Casual</option>
              <option value="Luxury">Luxury</option>
            </select>
          </label>
          <label>
            Collection
            <select value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)}>
              <option value="">All</option>
              {collections.map(c => (
                <option key={c.slug} value={c.slug}>{c.title}</option>
              ))}
            </select>
          </label>
          <label>
            Material
            <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}>
              <option value="">All</option>
              {Array.from(new Set(items.map(i => (i as any).material).filter(Boolean))).map(m => (
                <option key={m as string} value={m as string}>{m as string}</option>
              ))}
            </select>
          </label>
          <label>
            Color
            <select value={colorFilter} onChange={e => setColorFilter(e.target.value)}>
              <option value="">All</option>
              {Array.from(new Set(items.map(i => i.color))).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      

      <div className="product-grid masonry large-cards">
        {items.map(p => {
          const sig = Math.abs((p.id + '|' + p.category).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 10
          const variant = sig < 3 ? 'tall' : ''
          return (
          <article key={p.id} className={`product-card big ${variant}`}>
            <div className="big-img-wrap">
              <img
                src={viewMode === 'styled' ? styledImage(p) : p.image}
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
        )})}
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
