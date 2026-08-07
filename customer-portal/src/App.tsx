import { useState, useEffect } from 'react'

// Base configurations
const API_BASE = 'http://localhost:8080'

interface Category {
  id: number
  name: string
  slug: string
  description?: string
}

interface Brand {
  id: number
  name: string
  slug: string
  description?: string
  logoUrl?: string
}

interface Product {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  imageUrl: string
  category: Category
  brand?: Brand
}

interface CartItem {
  product: Product
  quantity: number
}

interface Review {
  id: number
  user: string
  rating: number
  comment: string
  date: string
}

interface OrderItem {
  id: number
  product: Product
  quantity: number
  price: number
}

interface Order {
  id: number
  orderNumber: string
  createdAt: string
  totalAmount: number
  status: string
  items: OrderItem[]
}

export default function App() {
  // Navigation & Views
  const [currentView, setCurrentView] = useState<string>('home')
  
  // Data State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasError, setHasError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  // Interaction State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })
  const [wishlist, setWishlist] = useState<number[]>(() => {
    const saved = localStorage.getItem('wishlist')
    return saved ? JSON.parse(saved) : []
  })
  
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [priceRange, setPriceRange] = useState<number>(10000)
  
  // Auth State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [usernameInput, setUsernameInput] = useState<string>('john_doe')
  const [passwordInput, setPasswordInput] = useState<string>('CustomerPass123!')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false)
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState<boolean>(false)
  
  // Theme State
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'light')

  // Product details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedProductReviews, setSelectedProductReviews] = useState<Review[]>([])
  const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(false)

  // Selection states for product detail layout
  const [selectedColor, setSelectedColor] = useState<string>('Jet Black')
  const [selectedSize, setSelectedSize] = useState<string>('44mm')
  const [quantityInput, setQuantityInput] = useState<number>(1)
  const [activeThumbnail, setActiveThumbnail] = useState<string | null>(null)

  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor('Jet Black')
      setSelectedSize('44mm')
      setQuantityInput(1)
      setActiveThumbnail(null)
    }
  }, [selectedProduct])

  // Location State
  const [location, setLocation] = useState<string>('India')
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false)

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Fetch initial categories and products
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const catRes = await fetch(`${API_BASE}/api/categories`)
        const prodRes = await fetch(`${API_BASE}/api/products`)

        if (!catRes.ok || !prodRes.ok) {
          throw new Error('API server returned error code')
        }

        const catData = await catRes.json()
        const prodData = await prodRes.json()

        setCategories(catData)
        setProducts(prodData)
        setHasError(false)
      } catch (err: any) {
        console.error(err)
        setHasError(true)
        setErrorMessage('Failed to connect to the database API. Please make sure the Spring Boot server is running on port 8080.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch orders when user changes or view becomes 'orders'
  useEffect(() => {
    if (currentView === 'orders' && token) {
      fetchOrders()
    }
  }, [currentView, token])

  const fetchOrders = async () => {
    setIsOrdersLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setOrders([])
    } finally {
      setIsOrdersLoading(false)
    }
  }

  // Handle Sign In
  const handleSignIn = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault()
    setAuthError(null)
    setIsAuthLoading(true)
    const username = customUser || usernameInput
    const password = customPass || passwordInput
    try {
      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        setUser(data)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data))
        setCurrentView('profile')
      } else {
        const errText = await res.text()
        setAuthError(errText || 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setAuthError('Connection refused. Please check the backend service.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  // Handle Log Out
  const handleLogOut = () => {
    setToken(null)
    setUser(null)
    setOrders([])
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentView('home')
  }

  // Handle placing a demo order
  const handleCheckout = () => {
    if (!token) {
      setCurrentView('profile')
      setAuthError('Please sign in or create an account to proceed with checkout.')
      return
    }

    if (cart.length === 0) return

    // Simulate ordering or call mock API (the backend order creation logic can be handled or client-side success alert shown)
    alert('Thank you for your purchase! Your order has been placed successfully.')
    setCart([])
    setCurrentView('orders')
  }

  // Helper to map image path
  const getProductImage = (imageUrl: string, slug: string) => {
    const map: Record<string, string> = {
      'gooseneck-lamp': '/assets/images/prod_camera.png',
      'travertine-candle': '/assets/images/prod_watch.png',
      'ribbed-vase': '/assets/images/prod_earbuds.png',
      'leather-pouch': '/assets/images/prod_backpack.png',
      'boucle-chair': '/assets/images/hero_composite.png',
    }
    if (map[slug]) return map[slug]
    if (imageUrl && imageUrl.startsWith('assets/')) return `/${imageUrl}`
    return '/assets/images/prod_watch.png'
  }

  // Helper to map category slugs to beautiful matching images
  const getCategoryImage = (slug: string) => {
    const map: Record<string, string> = {
      'lighting': '/assets/images/cat_accessories.png',
      'decor': '/assets/images/cat_women.png',
      'lifestyle': '/assets/images/cat_men.png'
    }
    return map[slug] || `/assets/images/cat_${slug}.png`
  }

  // Helper to format prices into INR strings matching mock layouts
  const formatPrice = (price: number) => {
    return `₹${Math.round(price).toLocaleString('en-IN')}`
  }

  // Map backend Category IDs to CSS background tokens
  const getCategoryBgColor = (categoryId: number) => {
    const colors = ['#f1f3e7', '#f9ebdf', '#e4edf7', '#f5ece4', '#ecdff9']
    return colors[(categoryId - 1) % colors.length]
  }

  // View specific product details and reviews
  const viewProductDetails = async (product: Product) => {
    setSelectedProduct(product)
    setCurrentView('product-detail')
    setIsReviewsLoading(true)
    setSelectedProductReviews([])
    try {
      const res = await fetch(`${API_BASE}/api/reviews/product/${product.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedProductReviews(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsReviewsLoading(false)
    }
  }

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
      }
      return [...prev, { product, quantity }]
    })
  }

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId))
      return
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item))
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  // Wishlist operations
  const toggleWishlist = (productId: number) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      }
      return [...prev, productId]
    })
  }

  // Total calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  // Filters calculation
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === null || product.category.id === selectedCategory
    const matchesPrice = product.price <= priceRange
    return matchesSearch && matchesCategory && matchesPrice
  })

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo" onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>
            Hype<span className="logo-dot">.</span>
          </h1>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => { setCurrentView('home'); setSelectedCategory(null); }}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Home</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentView === 'shop' ? 'active' : ''}`}
                onClick={() => setCurrentView('shop')}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>Shop</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentView === 'categories' ? 'active' : ''}`}
                onClick={() => setCurrentView('categories')}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                <span>Categories</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentView === 'wishlist' ? 'active' : ''}`}
                onClick={() => setCurrentView('wishlist')}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span>Wishlist</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
                onClick={() => setCurrentView('orders')}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                <span>Orders</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
                onClick={() => setCurrentView('profile')}
              >
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Profile</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-utilities">
            <button 
              className="utility-btn" 
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="theme-icon-light" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg className="theme-icon-dark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            {token && (
              <button className="utility-btn" onClick={handleLogOut} title="Log Out">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            )}
          </div>

          <div className="promo-banner-card">
            <h3>Get 10% OFF</h3>
            <p>on your first order</p>
            <button className="promo-signup-btn" onClick={() => setCurrentView('profile')}>SIGN UP</button>
            <div className="promo-decorative-line">
              <svg viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 25 C 20 5, 40 5, 60 20 C 75 30, 85 15, 95 10" stroke="var(--color-accent, #c2db3a)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="main-content" style={{ flexGrow: 1 }}>
        
        {/* Top Header */}
        <header className="top-header">
          {/* Search Bar */}
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Search for products, brands and more..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (currentView !== 'shop') setCurrentView('shop')
              }}
            />
          </div>

          <div className="header-right">
            {/* Location Selector */}
            <div className="location-selector" style={{ position: 'relative' }}>
              <svg className="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div className="location-info">
                <span className="location-label" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deliver to</span>
                <button 
                  className="location-value-btn" 
                  onClick={() => setShowLocationDropdown(prev => !prev)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  <span>{location}</span>
                  <svg className="dropdown-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
              {showLocationDropdown && (
                <ul className="location-dropdown" style={{ display: 'block', position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 0', minWidth: '120px', boxShadow: 'var(--shadow-md)' }}>
                  {['India', 'USA', 'UK', 'Germany', 'Japan'].map(loc => (
                    <li 
                      key={loc} 
                      onClick={() => { setLocation(loc); setShowLocationDropdown(false); }}
                      style={{ padding: '8px 16px', cursor: 'pointer', fontWeight: location === loc ? 600 : 400 }}
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cart Icon */}
            <button className="cart-btn" onClick={() => setCurrentView('cart')} title="Shopping Cart">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {totalCartCount > 0 && <span className="cart-badge">{totalCartCount}</span>}
            </button>

            {/* Profile Quick Access */}
            <div className="header-avatar" onClick={() => setCurrentView('profile')} style={{ cursor: 'pointer' }} title="View Profile">
              <img src="/assets/images/cat_men.png" alt="User profile" className="avatar-img" />
            </div>
          </div>
        </header>

        {/* View container */}
        <div id="view-container" style={{ padding: '20px 40px 40px 0' }}>
          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <h2>Loading Hype Catalog...</h2>
              <div className="ticks" style={{ margin: '20px auto' }}></div>
            </div>
          ) : hasError ? (
            <div className="empty-state-card" style={{ padding: '40px' }}>
              <div className="empty-state-illustration" style={{ color: 'var(--color-danger)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 className="empty-state-title">Server Connection Failed</h3>
              <p className="empty-state-desc">{errorMessage}</p>
            </div>
          ) : (
            <>
              {/* Home View */}
              {currentView === 'home' && (
                <div>
                  <section className="hero-section">
                    <div className="hero-content">
                      <span className="hero-tagline">NEW COLLECTION</span>
                      <h2 className="hero-headline">STYLE THAT<br />MOVES <span className="highlight-text">YOU</span></h2>
                      <p className="hero-description">Discover curated, high-end design assets and ambient items for your workspace.</p>
                      
                      <div className="hero-actions">
                        <button className="shop-now-btn" onClick={() => setCurrentView('shop')}>
                          <span>SHOP NOW</span>
                          <span className="arrow-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="hero-visual">
                      <div className="hero-bg-circle"></div>
                      <img src="/assets/images/hero_composite.png" alt="Featured Hype products" className="hero-main-img" />
                      <div className="hero-promo-card">
                        <span className="promo-title">Summer Sale</span>
                        <span className="promo-desc">UP TO</span>
                        <span className="promo-pct">50%</span>
                        <span className="promo-off">OFF</span>
                      </div>
                    </div>
                  </section>

                  {/* Categories Row */}
                  <section className="categories-section">
                    <div className="category-grid">
                      {categories.slice(0, 5).map(cat => (
                        <button 
                          key={cat.id} 
                          className="category-card" 
                          onClick={() => { setSelectedCategory(cat.id); setCurrentView('shop'); }}
                          style={{ border: 'none', width: '100%', textAlign: 'left', background: getCategoryBgColor(cat.id) }}
                        >
                          <div className="category-info">
                            <span className="category-title">{cat.name}</span>
                            <span className="category-subtitle">Department</span>
                          </div>
                          <img src={getCategoryImage(cat.slug)} alt={cat.name} className="category-img" />
                        </button>
                      ))}
                      <button 
                        className="category-card all-categories-card"
                        onClick={() => setCurrentView('categories')}
                        style={{ border: 'none' }}
                      >
                        <div className="all-categories-content">
                          <div className="all-categories-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                          </div>
                          <span className="all-categories-text">All Departments</span>
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* Featured Products */}
                  <section className="featured-section" style={{ marginTop: '40px' }}>
                    <div className="section-header">
                      <h2 className="section-title">Featured Products</h2>
                      <button className="view-all-link" onClick={() => setCurrentView('shop')} style={{ border: 'none', background: 'none' }}>
                        <span>View All Products</span>
                        <span className="arrow-circle-small">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </span>
                      </button>
                    </div>

                    <div className="products-and-deals-grid">
                      <div className="products-grid">
                        {products.slice(0, 4).map(product => (
                          <div key={product.id} className="product-card">
                            <div className="product-card-top" onClick={() => viewProductDetails(product)} style={{ cursor: 'pointer' }}>
                              <span className="discount-badge">-20%</span>
                              <button 
                                className={`wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                              >
                                <svg className="heart-icon" viewBox="0 0 24 24" fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              </button>
                              <div className="product-img-wrapper">
                                <img src={getProductImage(product.imageUrl, product.slug)} alt={product.name} className="product-img" />
                              </div>
                              <div className="quick-view-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </div>
                            </div>
                            <div className="product-card-bottom">
                              <div className="product-details" onClick={() => viewProductDetails(product)} style={{ cursor: 'pointer' }}>
                                <span className="product-cat">{product.category.name}</span>
                                <h3 className="product-name">{product.name}</h3>
                                <div className="product-price-row">
                                  <span className="price-current">{formatPrice(product.price)}</span>
                                  <span className="price-original" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '6px' }}>{formatPrice(product.price * 1.25)}</span>
                                </div>
                              </div>
                              <button 
                                className="add-to-cart-btn" 
                                onClick={() => addToCart(product)}
                                title="Add to Cart"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="deals-block">
                        <div className="deals-content">
                          <span className="deals-badge">Exclusive</span>
                          <h3 className="deals-title">Stoneware &<br /><span className="deals-highlight">Travertine</span></h3>
                          <p className="deals-description">Imported Italian travertine stone accessories curated by AURA studios.</p>
                          <button className="deals-action-btn" onClick={() => { setSelectedCategory(2); setCurrentView('shop'); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          </button>
                        </div>
                        <div className="deals-visual">
                          <img src="/assets/images/gift_box.png" alt="Exclusive deal container" className="giftbox-img" />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* Shop View */}
              {currentView === 'shop' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2>Catalog Products ({filteredProducts.length})</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => setSelectedCategory(null)} 
                        className={`filter-tab ${selectedCategory === null ? 'active' : ''}`}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)', background: selectedCategory === null ? 'var(--text-primary)' : 'var(--bg-card)', color: selectedCategory === null ? 'var(--bg-card)' : 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        All
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)} 
                          className={`filter-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                          style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)', background: selectedCategory === cat.id ? 'var(--text-primary)' : 'var(--bg-card)', color: selectedCategory === cat.id ? 'var(--bg-card)' : 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px' }}>
                    {/* Filters Sidebar */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', height: 'fit-content' }}>
                      <h4 style={{ marginBottom: '16px' }}>Max Price: {formatPrice(priceRange)}</h4>
                      <input 
                        type="range" 
                        min="10" 
                        max="10000" 
                        value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-accent)', marginBottom: '24px' }}
                      />

                      <h4 style={{ marginBottom: '12px' }}>Filter by Keywords</h4>
                      <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                      />
                    </div>

                    {/* Products Grid */}
                    <div>
                      {filteredProducts.length === 0 ? (
                        <div className="empty-state-card" style={{ padding: '40px', background: 'var(--bg-card)' }}>
                          <h3 className="empty-state-title">No Products Match Your Filter</h3>
                          <button className="btn-primary-action" onClick={() => { setSelectedCategory(null); setSearchQuery(''); setPriceRange(1000); }}>
                            Reset Filters
                          </button>
                        </div>
                      ) : (
                        <div className="products-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                          {filteredProducts.map(product => (
                            <div key={product.id} className="product-card">
                              <div className="product-card-top" onClick={() => viewProductDetails(product)} style={{ cursor: 'pointer' }}>
                                <span className="discount-badge">-20%</span>
                                <button 
                                  className={`wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                                >
                                  <svg className="heart-icon" viewBox="0 0 24 24" fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                </button>
                                <div className="product-img-wrapper">
                                  <img src={getProductImage(product.imageUrl, product.slug)} alt={product.name} className="product-img" />
                                </div>
                                <div className="quick-view-overlay">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </div>
                              </div>
                              <div className="product-card-bottom">
                                <div className="product-details" onClick={() => viewProductDetails(product)} style={{ cursor: 'pointer' }}>
                                  <span className="product-cat">{product.category.name}</span>
                                  <h3 className="product-name">{product.name}</h3>
                                  <div className="product-price-row">
                                    <span className="price-current">{formatPrice(product.price)}</span>
                                    <span className="price-original" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '6px' }}>{formatPrice(product.price * 1.25)}</span>
                                  </div>
                                </div>
                                <button 
                                  className="add-to-cart-btn" 
                                  onClick={() => addToCart(product)}
                                  title="Add to Cart"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Categories View */}
              {currentView === 'categories' && (
                <div>
                  <h2 style={{ marginBottom: '24px' }}>Product Departments</h2>
                  <div className="category-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        className="category-card" 
                        onClick={() => { setSelectedCategory(cat.id); setCurrentView('shop'); }}
                        style={{ border: 'none', height: '180px', width: '100%', textAlign: 'left', background: getCategoryBgColor(cat.id) }}
                      >
                        <div className="category-info">
                          <span className="category-title" style={{ fontSize: '1.5rem' }}>{cat.name}</span>
                          <span className="category-subtitle">{cat.description || 'Collection'}</span>
                        </div>
                        <img src={getCategoryImage(cat.slug)} alt={cat.name} className="category-img" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wishlist View */}
              {currentView === 'wishlist' && (
                <div>
                  <h2 style={{ marginBottom: '24px' }}>My Wishlist</h2>
                  {wishlist.length === 0 ? (
                    <div className="empty-state-card" style={{ padding: '60px 40px', background: 'var(--bg-card)' }}>
                      <div className="empty-state-illustration" style={{ width: '64px', height: '64px', background: 'rgba(194, 219, 58, 0.1)', color: 'var(--text-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </div>
                      <h3 className="empty-state-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Your Wishlist is Empty</h3>
                      <p className="empty-state-desc" style={{ maxWidth: '400px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>Save your favorite items here so you can find them quickly whenever you return.</p>
                      <button 
                        onClick={() => setCurrentView('shop')}
                        style={{
                          background: 'var(--color-accent, #c2db3a)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '24px',
                          padding: '12px 28px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="products-grid">
                      {products.filter(p => wishlist.includes(p.id)).map(product => (
                        <div key={product.id} className="product-card">
                          <div className="product-card-top" onClick={() => viewProductDetails(product)} style={{ cursor: 'pointer' }}>
                            <span className="discount-badge">-20%</span>
                            <button 
                              className="wishlist-btn active"
                              onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                            >
                              <svg className="heart-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </button>
                            <div className="product-img-wrapper">
                              <img src={getProductImage(product.imageUrl, product.slug)} alt={product.name} className="product-img" />
                            </div>
                            <div className="quick-view-overlay">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </div>
                          </div>
                          <div className="product-card-bottom">
                            <div className="product-details" onClick={() => viewProductDetails(product)} style={{ cursor: 'pointer' }}>
                              <span className="product-cat">{product.category.name}</span>
                              <h3 className="product-name">{product.name}</h3>
                              <div className="product-price-row">
                                <span className="price-current">{formatPrice(product.price)}</span>
                                <span className="price-original" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '6px' }}>{formatPrice(product.price * 1.25)}</span>
                              </div>
                            </div>
                            <button 
                              className="add-to-cart-btn" 
                              onClick={() => { addToCart(product); toggleWishlist(product.id); }}
                              title="Move to Cart"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cart View */}
              {currentView === 'cart' && (
                <div>
                  <h2 style={{ marginBottom: '24px' }}>Shopping Cart</h2>
                  {cart.length === 0 ? (
                    <div className="empty-state-card" style={{ padding: '40px', background: 'var(--bg-card)' }}>
                      <h3 className="empty-state-title">Your Cart is Empty</h3>
                      <button className="btn-primary-action" onClick={() => setCurrentView('shop')}>
                        Explore Shop
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px' }}>
                      {/* Cart Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {cart.map(item => (
                          <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', gap: '20px' }}>
                            <img src={getProductImage(item.product.imageUrl, item.product.slug)} alt={item.product.name} style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--bg-body)', borderRadius: '8px', padding: '4px' }} />
                            <div style={{ flexGrow: 1 }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.product.category.name}</span>
                              <h3 style={{ fontSize: '1.1rem', margin: '4px 0' }}>{item.product.name}</h3>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(item.product.price)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 'bold' }}>-</button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--border-color)', fontWeight: 'bold' }}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.product.id)} style={{ color: 'var(--color-danger)', marginLeft: '12px' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Summary Panel */}
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '20px' }}>Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span>Subtotal</span>
                          <span>{formatPrice(cartSubtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span>Shipping</span>
                          <span>Free</span>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.2rem', marginBottom: '24px' }}>
                          <span>Total</span>
                          <span>{formatPrice(cartSubtotal)}</span>
                        </div>
                        <button 
                          className="btn-primary-action" 
                          onClick={handleCheckout}
                          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                        >
                          Place Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Orders View */}
              {currentView === 'orders' && (
                <div>
                  <h2 style={{ marginBottom: '24px' }}>Customer Orders</h2>
                  {!token ? (
                    <div className="empty-state-card" style={{ padding: '40px', background: 'var(--bg-card)' }}>
                      <h3 className="empty-state-title">Please Sign In to View Orders</h3>
                      <button className="btn-primary-action" onClick={() => setCurrentView('profile')}>
                        Go to Profile
                      </button>
                    </div>
                  ) : isOrdersLoading ? (
                    <div style={{ padding: '20px 0', textAlign: 'center' }}>Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="empty-state-card" style={{ padding: '60px 40px', background: 'var(--bg-card)' }}>
                      <div className="empty-state-illustration" style={{ width: '64px', height: '64px', background: 'rgba(194, 219, 58, 0.1)', color: 'var(--text-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px' }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      </div>
                      <h3 className="empty-state-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>No Orders Yet</h3>
                      <p className="empty-state-desc" style={{ maxWidth: '400px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>Looks like you haven't placed any orders yet. Start shopping to fill your history!</p>
                      <button 
                        onClick={() => setCurrentView('shop')}
                        style={{
                          background: 'var(--color-accent, #c2db3a)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '24px',
                          padding: '12px 28px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {orders.map(order => (
                        <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div>
                              <span style={{ fontWeight: 600, display: 'block' }}>Order #{order.orderNumber}</span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Placed on: {new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, background: order.status === 'DELIVERED' ? 'var(--color-accent-bg)' : '#fff3cd', color: order.status === 'DELIVERED' ? 'var(--color-success)' : '#856404' }}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <div>
                            {order.items && order.items.map(item => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img src={getProductImage(item.product.imageUrl, item.product.slug)} alt={item.product.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                  <span>{item.product.name} (x{item.quantity})</span>
                                </div>
                                <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px', fontWeight: 600 }}>
                            <span>Total Amount</span>
                            <span>{formatPrice(order.totalAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile View */}
              {currentView === 'profile' && (
                <div>
                  <h2 style={{ marginBottom: '24px' }}>Account Settings</h2>
                  {token && user ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-accent-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user.username}</h3>
                          <span style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '16px' }}>Authorized Details</h3>
                        <p style={{ marginBottom: '8px' }}><strong>Username:</strong> {user.username}</p>
                        <p style={{ marginBottom: '20px' }}><strong>Role permissions:</strong> {user.roles.join(', ')}</p>
                        <button className="btn-secondary-action" onClick={handleLogOut}>
                          Sign Out of Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '450px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '40px' }}>
                      <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>Sign in to Hype.</h3>
                      {authError && (
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(231,29,54,0.1)', color: 'var(--color-danger)', fontSize: '0.9rem', marginBottom: '16px' }}>
                          {authError}
                        </div>
                      )}
                      <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>Username</label>
                          <input 
                            type="text" 
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>Password</label>
                          <input 
                            type="password" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                            required
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="btn-primary-action"
                          style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}
                          disabled={isAuthLoading}
                        >
                          {isAuthLoading ? 'Authenticating...' : 'Sign In'}
                        </button>
                      </form>

                      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Want to login quickly as John Doe?</span>
                        <button 
                          onClick={() => { setUsernameInput('john_doe'); setPasswordInput('CustomerPass123!'); handleSignIn(undefined, 'john_doe', 'CustomerPass123!'); }}
                          className="btn-secondary-action"
                          style={{ display: 'block', width: '100%', marginTop: '8px' }}
                        >
                          Auto Login as Guest
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Product Detail Page View */}
              {currentView === 'product-detail' && selectedProduct && (
                <div>
                  {/* Breadcrumbs */}
                  <div className="product-breadcrumbs" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    <span onClick={() => { setCurrentView('home'); setSelectedProduct(null); }} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Home</span> / <span onClick={() => { setCurrentView('shop'); setSelectedProduct(null); }} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Shop</span> / <span onClick={() => { setSelectedCategory(selectedProduct.category.id); setCurrentView('shop'); }} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{selectedProduct.category.name}</span> / <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedProduct.name}</span>
                  </div>

                  {/* Two-Column Layout Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    
                    {/* Left Column: Images */}
                    <div>
                      <div style={{ position: 'relative', background: 'var(--bg-body)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', minHeight: '380px' }}>
                        <img 
                          src={activeThumbnail || getProductImage(selectedProduct.imageUrl, selectedProduct.slug)} 
                          alt={selectedProduct.name} 
                          style={{ width: '100%', maxHeight: '350px', objectFit: 'contain' }} 
                        />
                        <button style={{ position: 'absolute', top: '20px', right: '20px', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        </button>
                      </div>

                      {/* Thumbnail row */}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        {[
                          getProductImage(selectedProduct.imageUrl, selectedProduct.slug),
                          '/assets/images/prod_earbuds.png',
                          '/assets/images/prod_backpack.png'
                        ].map((thumbUrl, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setActiveThumbnail(thumbUrl)}
                            style={{
                              width: '70px',
                              height: '70px',
                              borderRadius: '12px',
                              background: 'var(--bg-body)',
                              padding: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: (activeThumbnail === thumbUrl || (!activeThumbnail && idx === 0))
                                ? '2px solid var(--color-accent, #c2db3a)' 
                                : '1px solid var(--border-color)'
                            }}
                          >
                            <img src={thumbUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Info & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--color-accent, #c2db3a)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                        {selectedProduct.brand ? selectedProduct.brand.name : selectedProduct.category.name}
                      </span>
                      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)', lineHeight: 1.2 }}>{selectedProduct.name}</h2>
                      
                      {/* Rating and Reviews */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <span style={{ background: '#2ec4b6', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ★ 4.6
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>(1420 reviews)</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>|</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>SKU: NS-{selectedProduct.slug.toUpperCase().substring(0, 4)}-BLK</span>
                      </div>

                      {/* Price Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800 }}>{formatPrice(selectedProduct.price)}</span>
                        <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatPrice(selectedProduct.price * 1.25)}</span>
                        <span style={{ background: '#f5ecd8', color: '#856404', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>20% OFF</span>
                      </div>

                      {/* Description */}
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px', fontSize: '0.95rem' }}>
                        {selectedProduct.description || 'Ultra-crisp 1.78-inch AMOLED display smart watch with Bluetooth calling, 100+ sports modes, and 7-day battery endurance.'}
                      </p>

                      {/* Colors selection */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Color: {selectedColor}</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {['Jet Black', 'Silver Gray', 'Olive Green'].map(color => (
                            <button 
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: selectedColor === color ? '2px solid var(--color-accent, #c2db3a)' : '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size selection */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Size:</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {['44mm', '48mm'].map(size => (
                            <button 
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: selectedSize === size ? '2px solid var(--color-accent, #c2db3a)' : '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantity & Stock Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          <button onClick={() => setQuantityInput(prev => Math.max(1, prev - 1))} style={{ padding: '10px 16px', background: 'var(--bg-body)', fontWeight: 'bold', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>-</button>
                          <span style={{ padding: '10px 20px', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>{quantityInput}</span>
                          <button onClick={() => setQuantityInput(prev => prev + 1)} style={{ padding: '10px 16px', background: 'var(--bg-body)', fontWeight: 'bold', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>+</button>
                        </div>
                        <span style={{ color: '#2ec4b6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ✓ In Stock
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button 
                          onClick={() => { addToCart(selectedProduct, quantityInput); setCurrentView('cart'); }}
                          style={{
                            background: 'var(--color-accent, #c2db3a)',
                            color: '#000',
                            padding: '16px 32px',
                            borderRadius: '16px',
                            fontWeight: 'bold',
                            flexGrow: 2,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(194, 219, 58, 0.2)',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: 'none'
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          BUY NOW
                        </button>
                        
                        <button 
                          onClick={() => addToCart(selectedProduct, quantityInput)}
                          style={{
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            border: '2px solid var(--text-primary)',
                            padding: '16px 24px',
                            borderRadius: '16px',
                            fontWeight: 'bold',
                            flexGrow: 1,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          <span>ADD TO CART</span>
                        </button>

                        <button 
                          onClick={() => toggleWishlist(selectedProduct.id)}
                          style={{
                            background: 'var(--bg-card)',
                            color: wishlist.includes(selectedProduct.id) ? 'var(--color-danger)' : 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            width: '56px',
                            height: '56px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill={wishlist.includes(selectedProduct.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Customer Reviews ({selectedProductReviews.length})</h3>
                    {isReviewsLoading ? (
                      <div>Loading reviews...</div>
                    ) : selectedProductReviews.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No reviews yet for this product.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedProductReviews.map(review => (
                          <div key={review.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <strong>{review.user}</strong>
                              <span style={{ color: 'var(--color-accent, #c2db3a)', fontWeight: 'bold' }}>{'★'.repeat(review.rating)}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
