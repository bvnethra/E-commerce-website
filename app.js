document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     Application Global State & API Service
     ========================================================================== */
  const AppState = {
    currentView: 'home',
    simulatedState: 'normal', // 'normal', 'loading', 'empty', 'error'
    cartCount: 2,
    wishlistCount: 3,
    theme: localStorage.getItem('theme') || 'light',
    location: 'India',
    searchQuery: '',
    viewMode: 'grid',
    sortOption: 'popularity',
    currentPage: 1,
    itemsPerPage: 8,
    selectedVariant: { color: null, size: null },
    lightboxIndex: 0,
    lightboxImages: [],
    listingFilters: {
      categories: [],
      brands: [],
      minPrice: 0,
      maxPrice: 100000,
      minRating: 0,
      discount: 0,
      availability: [],
      colors: [],
      sizes: [],
      shipping: [],
      special: []
    }
  };

  // Simulated Async API Service with Instant Resolution
  const ApiService = {
    fetchViewData(viewName) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ state: 'success', data: ApiService.getMockData(viewName) });
        }, 100);
      });
    },

    getMockData(viewName) {
      const mockDb = {
        products: [
          {
            id: 1,
            name: 'Noise Ultra 2 Max',
            cat: 'Smart Watch',
            brand: 'Noise',
            price: '₹4,999',
            originalPrice: '₹6,999',
            numericPrice: 4999,
            discount: 28,
            badge: '-28%',
            rating: 4.8,
            reviewCount: 342,
            inStock: true,
            stockCount: 14,
            sku: 'SKU-NWT-9021',
            deliveryBadge: 'Express Shipping in 2 Days',
            warranty: '1 Year Brand Warranty',
            returnPolicy: '30 Days Money Back Guarantee',
            sellerInfo: 'Hype Direct Official Store • Verified Retailer',
            shortDesc: 'Amoled display smartwatch with Bluetooth calling, 100+ sports modes, and 7-day battery backup.',
            description: 'Experience next-gen smart wearable tech with Noise Ultra 2 Max. Features an ultra-bright AMOLED display, stainless steel dial frame, real-time SpO2 & heart rate monitoring, and seamless Bluetooth HD calling.',
            img: 'assets/images/prod_watch.png',
            images: ['assets/images/prod_watch.png'],
            variants: {
              colors: ['Black', 'Silver', 'Midnight Blue'],
              sizes: ['Standard Dial (44mm)']
            },
            specs: {
              'Display': '1.78" HD AMOLED Touchscreen',
              'Battery Life': 'Up to 7 Days (250mAh)',
              'Connectivity': 'Bluetooth 5.3 + HD Calling',
              'Water Resistance': 'IP68 Waterproof',
              'Compatibility': 'iOS 11+ & Android 7.0+',
              'Shipping': 'Express Shipping in 2 Days'
            }
          },
          {
            id: 2,
            name: 'boAt Airdopes 181',
            cat: 'Earbuds',
            brand: 'boAt',
            price: '₹1,299',
            originalPrice: '₹1,999',
            numericPrice: 1299,
            discount: 35,
            badge: 'HOT -35%',
            rating: 4.6,
            reviewCount: 218,
            inStock: true,
            stockCount: 28,
            sku: 'SKU-BAT-1810',
            deliveryBadge: 'Express Shipping in 2 Days',
            warranty: '1 Year Replacement Warranty',
            returnPolicy: '30 Days Easy Return Policy',
            sellerInfo: 'boAt Audio Official Store • Authorised Reseller',
            shortDesc: 'True wireless earbuds with ENx noise cancellation, 20-hour playback, and ASAP fast charging.',
            description: 'Tune out background noise and immerse yourself in Signature boAt Bass with Airdopes 181. Equipped with ENx technology for crystal-clear calls, 10mm drivers, and IPX4 splash resistance.',
            img: 'assets/images/prod_earbuds.png',
            images: ['assets/images/prod_earbuds.png'],
            variants: {
              colors: ['Carbon Black', 'Vintage White', 'Bold Blue'],
              sizes: ['One Size']
            },
            specs: {
              'Driver Size': '10mm Dynamic Drivers',
              'Playback Time': 'Up to 20 Hours with Case',
              'Fast Charging': '10 min charge = 90 min playback',
              'Noise Cancellation': 'ENx™ Tech Environmental Noise Cancellation',
              'Shipping': 'Express Shipping in 2 Days'
            }
          },
          {
            id: 3,
            name: 'Canon EOS M50 Mark II',
            cat: 'Camera',
            brand: 'Canon',
            price: '₹54,990',
            originalPrice: '₹59,999',
            numericPrice: 54990,
            discount: 8,
            badge: '-8%',
            rating: 4.9,
            reviewCount: 114,
            inStock: true,
            stockCount: 6,
            sku: 'SKU-CAN-5002',
            deliveryBadge: 'Express Shipping in 2 Days',
            warranty: '2 Years Canon India Warranty',
            returnPolicy: '30 Days Return Guarantee',
            sellerInfo: 'Canon Pro Camera Outlet • Certified Seller',
            shortDesc: '4K mirrorless camera with 24.1MP CMOS sensor, Eye Auto Focus, and vertical video recording.',
            description: 'Capture stunning high-resolution photos and cinema-quality 4K videos with the Canon EOS M50 Mark II. Ideal for content creators, vloggers, and professional photographers alike.',
            img: 'assets/images/prod_camera.png',
            images: ['assets/images/prod_camera.png'],
            variants: {
              colors: ['Black'],
              sizes: ['EF-M15-45mm IS STM Lens Kit']
            },
            specs: {
              'Sensor': '24.1 MP APS-C CMOS Sensor',
              'Video Resolution': '4K UHD 24p / Full HD 60p',
              'Autofocus': 'Dual Pixel CMOS AF with Eye Detection',
              'Screen': '3.0" Vari-Angle Touchscreen LCD',
              'Shipping': 'Express Shipping in 2 Days'
            }
          },
          {
            id: 4,
            name: 'Urban Explorer Pro',
            cat: 'Backpack',
            brand: 'Hype',
            price: '₹2,999',
            originalPrice: '₹3,999',
            numericPrice: 2999,
            discount: 25,
            badge: '-25%',
            rating: 4.7,
            reviewCount: 189,
            inStock: true,
            stockCount: 19,
            sku: 'SKU-EXP-4029',
            deliveryBadge: 'Express Shipping in 2 Days',
            warranty: '1 Year Craftsmanship Guarantee',
            returnPolicy: '30 Days Free Return Guarantee',
            sellerInfo: 'Hype Official Gear Store • Verified Seller',
            shortDesc: 'Water-resistant laptop backpack with USB charging port, anti-theft pocket, and 30L capacity.',
            description: 'Designed for commuters, travelers, and daily adventurers. The Urban Explorer Pro features padded 15.6" laptop protection, ergonomic breathable shoulder straps, and hidden passport security compartments.',
            img: 'assets/images/prod_backpack.png',
            images: ['assets/images/prod_backpack.png'],
            variants: {
              colors: ['Stealth Black', 'Army Green', 'Navy Blue'],
              sizes: ['30 Liters']
            },
            specs: {
              'Capacity': '30 Liters Volume',
              'Laptop Compartment': 'Fits up to 15.6" Laptops',
              'Material': 'Water-Repellent 900D Nylon Cordura',
              'Special Features': 'External USB Port + Anti-Theft Lockable Zip',
              'Shipping': 'Express Shipping in 2 Days'
            }
          },
          {
            id: 5,
            name: 'Hype Stealth Runner',
            cat: 'Shoes',
            brand: 'Hype',
            price: '₹3,499',
            originalPrice: '₹4,999',
            numericPrice: 3499,
            discount: 30,
            badge: '-30%',
            rating: 4.7,
            reviewCount: 156,
            inStock: true,
            stockCount: 22,
            sku: 'SKU-SH-5012',
            deliveryBadge: 'Express Shipping in 2 Days',
            warranty: '6 Months Sole Warranty',
            returnPolicy: '30 Days Size Replacement Guarantee',
            sellerInfo: 'Hype Footwear Store • Verified Seller',
            shortDesc: 'Ultra-lightweight mesh running shoes with responsive foam cushioning and high grip rubber outsole.',
            description: 'Engineered for speed, durability, and daily comfort. The Hype Stealth Runner features a breathable knit upper, high-rebound EVA midsole, and multi-surface traction tread.',
            img: 'assets/images/cat_shoes.png',
            images: ['assets/images/cat_shoes.png'],
            variants: {
              colors: ['Triple Black', 'Neon Red', 'Heather Grey'],
              sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10']
            },
            specs: {
              'Upper Material': 'Breathable Engineered Knit Mesh',
              'Midsole': 'High-Rebound Responsive Foam',
              'Outsole': 'Non-Slip Anti-Abrasion Rubber',
              'Closure': 'Lace-Up Ergonomic Support',
              'Shipping': 'Express Shipping in 2 Days'
            }
          },
          {
            id: 6,
            name: 'Minimalist Leather Wallet',
            cat: 'Accessories',
            brand: 'Hype',
            price: '₹999',
            originalPrice: '₹1,499',
            numericPrice: 999,
            discount: 33,
            badge: '-33%',
            rating: 4.8,
            reviewCount: 290,
            inStock: true,
            stockCount: 35,
            sku: 'SKU-WLT-6011',
            deliveryBadge: 'Express Shipping in 2 Days',
            warranty: '1 Year Leather Quality Guarantee',
            returnPolicy: '30 Days Money Back Guarantee',
            sellerInfo: 'Hype Accessories Official • Verified Retailer',
            shortDesc: 'Slim top-grain genuine leather bi-fold wallet with RFID blocking layer and 8 card slots.',
            description: 'Handcrafted from 100% genuine top-grain leather. Sleek slim profile fits comfortably in front or back pockets while protecting cards against electronic theft.',
            img: 'assets/images/cat_accessories.png',
            images: ['assets/images/cat_accessories.png'],
            variants: {
              colors: ['Mahogany', 'Obsidian Black', 'Tan Brown'],
              sizes: ['Slim Bifold']
            },
            specs: {
              'Material': '100% Top-Grain Genuine Leather',
              'Security': 'Integrated RFID Blocking Technology',
              'Card Capacity': 'Holds 8 Cards + Cash Pocket',
              'Dimensions': '10.5cm x 8.0cm x 1.2cm',
              'Shipping': 'Express Shipping in 2 Days'
            }
          }
        ],
        categories: [
          { name: 'Men', subtitle: 'Collection', bg: '#f1f3e7', img: 'assets/images/cat_men.png' },
          { name: 'Women', subtitle: 'Collection', bg: '#f9ebdf', img: 'assets/images/cat_women.png' },
          { name: 'Electronics', subtitle: 'Gadgets', bg: '#e4edf7', img: 'assets/images/cat_electronics.png' },
          { name: 'Shoes', subtitle: 'Collection', bg: '#f5ece4', img: 'assets/images/cat_shoes.png' },
          { name: 'Accessories', subtitle: 'Collection', bg: '#ecdff9', img: 'assets/images/cat_accessories.png' }
        ],
        orders: [
          { id: '#ORD-9824', date: 'August 4, 2026', items: 3, total: '₹9,297', status: 'Delivered', statusClass: 'success' },
          { id: '#ORD-8711', date: 'July 28, 2026', items: 1, total: '₹4,999', status: 'In Transit', statusClass: 'pending' },
          { id: '#ORD-7502', date: 'June 15, 2026', items: 2, total: '₹3,498', status: 'Delivered', statusClass: 'success' }
        ],
        notifications: [
          { id: 1, title: 'Summer Flash Sale is Live!', desc: 'Get up to 50% discount on select accessories and apparel today.', time: '10 mins ago', unread: true },
          { id: 2, title: 'Order Delivered', desc: 'Your order #ORD-9824 has been safely delivered to your address.', time: '2 hours ago', unread: true },
          { id: 3, title: 'Price Drop Alert', desc: 'Noise Ultra 2 Max is now available at ₹4,999. Grab it fast!', time: '1 day ago', unread: false }
        ],
        reviews: [
          { user: 'Alex Rivera', rating: 5, comment: 'Outstanding quality and fast delivery! Super impressed with Hype.', date: 'Aug 2, 2026' },
          { user: 'Sarah Jenkins', rating: 4, comment: 'Great products, high durability. Highly recommended for daily use.', date: 'Jul 29, 2026' }
        ]
      };
      return mockDb[viewName] || mockDb.products;
    }
  };

  /* ==========================================================================
     Skeleton Generator Components (Zero Layout Shift)
     ========================================================================== */
  const Skeletons = {
    productGrid(count = 4) {
      let cardsHtml = '';
      for (let i = 0; i < count; i++) {
        cardsHtml += `
          <div class="product-card-skeleton" role="status" aria-label="Loading product content">
            <div class="sk-img skeleton"></div>
            <div class="sk-meta">
              <div class="skeleton skeleton-text short"></div>
              <div class="skeleton skeleton-text title"></div>
              <div class="skeleton skeleton-text medium"></div>
            </div>
            <div class="sk-footer">
              <div class="skeleton skeleton-text short" style="width: 80px; height: 20px;"></div>
              <div class="skeleton skeleton-circle" style="width: 40px; height: 40px;"></div>
            </div>
          </div>
        `;
      }
      return `<div class="products-grid">${cardsHtml}</div>`;
    },

    categories(count = 6) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="category-card skeleton" style="height: 140px; border-radius: var(--radius-lg);" role="status"></div>
        `;
      }
      return `<div class="category-grid">${html}</div>`;
    },

    home() {
      return `
        <div style="display: flex; flex-direction: column; gap: 40px;" role="status">
          <div class="hero-section" style="min-height: 420px;">
            <div class="hero-content" style="width: 50%;">
              <div class="skeleton skeleton-badge" style="width: 120px; height: 24px; margin-bottom: 16px;"></div>
              <div class="skeleton skeleton-text" style="height: 48px; width: 90%; margin-bottom: 16px;"></div>
              <div class="skeleton skeleton-text" style="height: 48px; width: 70%; margin-bottom: 24px;"></div>
              <div class="skeleton skeleton-btn" style="width: 160px; height: 50px;"></div>
            </div>
            <div class="hero-visual" style="width: 45%;">
              <div class="skeleton skeleton-box" style="height: 350px; border-radius: var(--radius-xl);"></div>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <div class="skeleton skeleton-text title" style="width: 200px; margin-bottom: 20px;"></div>
            ${Skeletons.categories(6)}
          </div>

          <div style="margin-top: 20px;">
            <div class="skeleton skeleton-text title" style="width: 240px; margin-bottom: 20px;"></div>
            ${Skeletons.productGrid(4)}
          </div>
        </div>
      `;
    },

    table(rows = 5, cols = 4) {
      let headerCells = '';
      for (let c = 0; c < cols; c++) {
        headerCells += `<th><div class="skeleton skeleton-text medium" style="margin: 0;"></div></th>`;
      }
      let rowHtml = '';
      for (let r = 0; r < rows; r++) {
        let cells = '';
        for (let c = 0; c < cols; c++) {
          cells += `<td><div class="skeleton skeleton-text" style="margin: 0; width: ${60 + (c * 10)}%;"></div></td>`;
        }
        rowHtml += `<tr>${cells}</tr>`;
      }
      return `
        <div class="data-table-card" role="status">
          <table class="app-table skeleton-table">
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${rowHtml}</tbody>
          </table>
        </div>
      `;
    },

    dashboard() {
      return `
        <div style="display: flex; flex-direction: column; gap: 30px;" role="status">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
            ${Array(4).fill(0).map(() => `
              <div class="kpi-card-skeleton">
                <div style="display: flex; flex-direction: column; gap: 8px; width: 60%;">
                  <div class="skeleton skeleton-text short"></div>
                  <div class="skeleton skeleton-text title"></div>
                </div>
                <div class="skeleton skeleton-circle" style="width: 48px; height: 48px;"></div>
              </div>
            `).join('')}
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="skeleton-chart-card">
              <div class="skeleton skeleton-text title" style="width: 180px;"></div>
              <div class="skeleton-chart-bars">
                ${Array(7).fill(0).map(() => `<div class="skeleton skeleton-bar" style="height: ${40 + Math.random() * 50}%;"></div>`).join('')}
              </div>
            </div>
            <div class="skeleton-chart-card">
              <div class="skeleton skeleton-text title" style="width: 140px;"></div>
              <div class="skeleton skeleton-circle" style="width: 160px; height: 160px; margin: 20px auto;"></div>
            </div>
          </div>
        </div>
      `;
    },

    notifications() {
      return `
        <div class="notifications-list" role="status">
          ${Array(4).fill(0).map(() => `
            <div class="notification-card">
              <div class="skeleton skeleton-circle" style="width: 42px; height: 42px; flex-shrink: 0;"></div>
              <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;">
                <div class="skeleton skeleton-text medium"></div>
                <div class="skeleton skeleton-text short"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    profile() {
      return `
        <div style="display: flex; flex-direction: column; gap: 24px;" role="status">
          <div style="display: flex; align-items: center; gap: 20px; background: var(--bg-card); padding: 24px; border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
            <div class="skeleton skeleton-circle" style="width: 80px; height: 80px;"></div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="skeleton skeleton-text title" style="width: 180px;"></div>
              <div class="skeleton skeleton-text short" style="width: 120px;"></div>
            </div>
          </div>
          <div style="background: var(--bg-card); padding: 30px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 20px;">
            <div class="skeleton skeleton-text title" style="width: 220px;"></div>
            <div class="skeleton skeleton-text" style="height: 44px; width: 100%;"></div>
            <div class="skeleton skeleton-text" style="height: 44px; width: 100%;"></div>
            <div class="skeleton skeleton-btn" style="width: 140px;"></div>
          </div>
        </div>
      `;
    }
  };

  /* ==========================================================================
     Universal Reusable EmptyState Component Engine (Part 4)
     ========================================================================== */
  const EmptyStates = {
    get(type = 'default', customProps = {}) {
      return '';
    }
  };

  /* ==========================================================================
     Exclusive Search Results View Engine (Combined Search & Multi-Filter)
     ========================================================================== */
  function renderSearchResultsView(query) {
    if (!viewContainer) return;
    if (query !== undefined) {
      AppState.searchQuery = query;
    }
    AppState.currentView = 'shop';
    renderProductListingView();
  }

  /* ==========================================================================
     Cart Management & Toast Notification System
     ========================================================================== */
  function addToCart(productId, qty = 1, color = null, size = null) {
    const allProducts = ApiService.getMockData('products');
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    if (!AppState.cart) AppState.cart = [];

    const targetColor = color || AppState.selectedVariant?.color || product.variants?.colors?.[0] || 'Default';
    const targetSize = size || AppState.selectedVariant?.size || product.variants?.sizes?.[0] || 'Standard';

    const existingItem = AppState.cart.find(item => item.product.id == productId && item.color === targetColor && item.size === targetSize);
    if (existingItem) {
      existingItem.qty += qty;
    } else {
      AppState.cart.push({
        product: product,
        qty: qty,
        color: targetColor,
        size: targetSize
      });
    }

    updateCartBadge();
    showToastNotification(`Added "${product.name}" to your Cart!`);
  }

  function updateCartBadge() {
    if (!AppState.cart) AppState.cart = [];
    const totalQty = AppState.cart.reduce((sum, item) => sum + item.qty, 0);
    AppState.cartCount = totalQty;
    document.querySelectorAll('#cart-badge, .cart-count-badge, #header-cart-btn .badge').forEach(badge => {
      badge.textContent = totalQty;
    });
  }

  function showToastNotification(message) {
    document.querySelectorAll('.app-toast-alert').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'app-toast-alert';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" style="width: 20px; height: 20px; flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function renderCartView() {
    if (!viewContainer) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!AppState.cart || AppState.cart.length === 0) {
      viewContainer.innerHTML = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">Shopping Cart</h2>
            <p class="view-subtitle">Your cart is currently empty</p>
          </div>
        </div>
        <div style="background: var(--bg-card); padding: 48px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--bg-body); display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="width: 32px; height: 32px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Your Cart is Empty</h3>
          <p style="color: var(--text-secondary); max-width: 400px; font-size: 0.95rem;">You haven't added any products to your cart yet. Discover trending style & electronics in our catalog!</p>
          <button class="btn-primary-action" data-nav-target="shop" style="margin-top: 8px;">
            <span>Browse Products</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      `;
      bindGlobalNavigationEvents();
      return;
    }

    const subtotal = AppState.cart.reduce((sum, item) => sum + (item.product.numericPrice * item.qty), 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    const contentHtml = `
      <div class="view-section-header">
        <div>
          <h2 class="view-title">Shopping Cart</h2>
          <p class="view-subtitle">Review your ${AppState.cart.reduce((s, i) => s + i.qty, 0)} items before checkout</p>
        </div>
        <button class="btn-secondary-action" id="clear-cart-btn" style="padding: 8px 16px; font-size: 0.85rem; color: var(--color-danger); border-color: rgba(231,29,54,0.2);">Clear Cart</button>
      </div>

      <div class="cart-layout-grid" style="display: grid; grid-template-columns: 1fr 360px; gap: 28px; align-items: start;">
        <!-- Left: Cart Items List -->
        <div class="cart-items-container" style="display: flex; flex-direction: column; gap: 16px;">
          ${AppState.cart.map((item, idx) => `
            <div class="cart-item-card" style="background: var(--bg-card); padding: 20px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 20px;">
              <img src="${item.product.img}" alt="${item.product.name}" style="width: 90px; height: 90px; object-fit: contain; background: var(--bg-body); border-radius: var(--radius-md); padding: 8px; flex-shrink: 0; cursor: pointer;" class="cart-item-img" data-product-id="${item.product.id}">
              
              <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                  <h4 class="cart-item-title" style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); cursor: pointer;" data-product-id="${item.product.id}">${item.product.name}</h4>
                  <button class="remove-cart-item-btn" data-cart-index="${idx}" title="Remove Item" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; transition: color 0.2s;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>

                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.85rem; color: var(--text-secondary);">
                  <span>Brand: <strong style="color: var(--text-primary);">${item.product.brand}</strong></span>
                  <span>•</span>
                  <span>Color: <strong style="color: var(--text-primary);">${item.color}</strong></span>
                  <span>•</span>
                  <span>Option: <strong style="color: var(--text-primary);">${item.size}</strong></span>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
                  <div class="quantity-control" style="transform: scale(0.9); transform-origin: left center;">
                    <button class="qty-btn cart-qty-minus" data-cart-index="${idx}">-</button>
                    <input type="text" class="qty-input" value="${item.qty}" readonly style="width: 36px;">
                    <button class="qty-btn cart-qty-plus" data-cart-index="${idx}">+</button>
                  </div>

                  <div style="text-align: right;">
                    <span style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">₹${(item.product.numericPrice * item.qty).toLocaleString('en-IN')}</span>
                    <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">(${item.product.price} each)</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Right: Order Summary -->
        <div class="cart-summary-card" style="background: var(--bg-card); padding: 24px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 20px; position: sticky; top: 90px;">
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 14px;">Order Summary</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.95rem;">
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Subtotal (${AppState.cart.reduce((s, i) => s + i.qty, 0)} items)</span>
              <strong style="color: var(--text-primary);">₹${subtotal.toLocaleString('en-IN')}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Shipping Fee</span>
              <span style="color: var(--color-success); font-weight: 700;">${shipping === 0 ? 'FREE (Express 2 Days)' : '₹99'}</span>
            </div>

            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Estimated Tax</span>
              <span style="color: var(--text-muted);">Included</span>
            </div>
          </div>

          <div style="border-top: 1px dashed var(--border-color); padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Total Amount</span>
            <span style="font-size: 1.4rem; font-weight: 800; color: var(--color-accent);">₹${total.toLocaleString('en-IN')}</span>
          </div>

          <button class="btn-primary-action" id="checkout-btn" style="width: 100%; justify-content: center; padding: 14px; font-size: 1rem;">
            <span>Proceed to Checkout</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>

          <div style="display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 16px; font-size: 0.8rem; color: var(--text-muted);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--color-success);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>256-Bit SSL Encrypted Secure Checkout</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--color-accent);"><polyline points="20 6 9 17 4 12"/></svg>
              <span>30-Day Money Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    `;

    viewContainer.innerHTML = contentHtml;

    // Bind Cart Events
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        AppState.cart = [];
        updateCartBadge();
        renderCartView();
      });
    }

    document.querySelectorAll('.remove-cart-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-cart-index'), 10);
        AppState.cart.splice(idx, 1);
        updateCartBadge();
        renderCartView();
      });
    });

    document.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-cart-index'), 10);
        if (AppState.cart[idx].qty > 1) {
          AppState.cart[idx].qty--;
          updateCartBadge();
          renderCartView();
        }
      });
    });

    document.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-cart-index'), 10);
        if (AppState.cart[idx].qty < (AppState.cart[idx].product.stockCount || 50)) {
          AppState.cart[idx].qty++;
          updateCartBadge();
          renderCartView();
        }
      });
    });

    document.querySelectorAll('.cart-item-img, .cart-item-title').forEach(el => {
      el.addEventListener('click', () => {
        const pid = el.getAttribute('data-product-id');
        openProductDetailsModal(pid);
      });
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        showToastNotification('Order placed successfully! Thank you for shopping with Hype.');
        AppState.cart = [];
        updateCartBadge();
        renderCartView();
      });
    }

    bindGlobalNavigationEvents();
  }

  /* ==========================================================================
     MODULE 1 — Enhanced Enterprise Product Listing Controller & Filtering Engine
     ========================================================================== */
  
  // Dynamic URL Synchronization
  function syncFiltersToURL() {
    const params = new URLSearchParams();
    const f = AppState.listingFilters;

    if (f.categories && f.categories.length > 0) params.set('category', f.categories.join(','));
    if (f.brands && f.brands.length > 0) params.set('brand', f.brands.join(','));
    if (f.minPrice > 0) params.set('minPrice', f.minPrice);
    if (f.maxPrice < 100000) params.set('maxPrice', f.maxPrice);
    if (f.minRating > 0) params.set('minRating', f.minRating);
    if (f.discount > 0) params.set('discount', f.discount);
    if (f.availability && f.availability.length > 0) params.set('availability', f.availability.join(','));
    if (f.colors && f.colors.length > 0) params.set('color', f.colors.join(','));
    if (f.sizes && f.sizes.length > 0) params.set('size', f.sizes.join(','));
    if (f.shipping && f.shipping.length > 0) params.set('shipping', f.shipping.join(','));
    if (f.special && f.special.length > 0) params.set('special', f.special.join(','));
    if (AppState.searchQuery) params.set('search', AppState.searchQuery);
    if (AppState.sortOption && AppState.sortOption !== 'popularity') params.set('sort', AppState.sortOption);

    const queryString = params.toString();
    const newUrl = window.location.pathname + (queryString ? '?' + queryString : '');
    window.history.replaceState({ filters: f, search: AppState.searchQuery }, '', newUrl);
  }

  function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const f = AppState.listingFilters;

    if (params.has('category')) f.categories = params.get('category').split(',').filter(Boolean);
    if (params.has('brand')) f.brands = params.get('brand').split(',').filter(Boolean);
    if (params.has('minPrice')) f.minPrice = parseInt(params.get('minPrice'), 10) || 0;
    if (params.has('maxPrice')) f.maxPrice = parseInt(params.get('maxPrice'), 10) || 100000;
    if (params.has('minRating')) f.minRating = parseFloat(params.get('minRating')) || 0;
    if (params.has('discount')) f.discount = parseInt(params.get('discount'), 10) || 0;
    if (params.has('availability')) f.availability = params.get('availability').split(',').filter(Boolean);
    if (params.has('color')) f.colors = params.get('color').split(',').filter(Boolean);
    if (params.has('size')) f.sizes = params.get('size').split(',').filter(Boolean);
    if (params.has('shipping')) f.shipping = params.get('shipping').split(',').filter(Boolean);
    if (params.has('special')) f.special = params.get('special').split(',').filter(Boolean);
    if (params.has('search')) {
      AppState.searchQuery = params.get('search');
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = AppState.searchQuery;
    }
    if (params.has('sort')) AppState.sortOption = params.get('sort');
  }

  window.addEventListener('popstate', () => {
    loadFiltersFromURL();
    if (AppState.currentView === 'shop') {
      renderProductListingView();
    }
  });

  // Calculate live product count for each brand
  function getBrandProductCounts(allProducts) {
    const counts = {};
    allProducts.forEach(p => {
      const b = p.brand || 'Hype';
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }

  // Multi-Filter Compound Engine
  function getFilteredProducts() {
    let allProducts = ApiService.getMockData('products');
    const f = AppState.listingFilters;
    const query = (AppState.searchQuery || '').toLowerCase().trim();

    return allProducts.filter(p => {
      // 1. Search Query Filter
      if (query) {
        const nameMatch = p.name.toLowerCase().includes(query);
        const catMatch = p.cat.toLowerCase().includes(query);
        const brandMatch = (p.brand || '').toLowerCase().includes(query);
        const descMatch = (p.description || p.shortDesc || '').toLowerCase().includes(query);
        if (!nameMatch && !catMatch && !brandMatch && !descMatch) return false;
      }

      // 2. Multi-Select Categories
      if (f.categories && f.categories.length > 0) {
        const catName = p.cat.toLowerCase();
        const matchesCategory = f.categories.some(c => c.toLowerCase() === catName);
        if (!matchesCategory) return false;
      }

      // 3. Multi-Select Brands
      if (f.brands && f.brands.length > 0) {
        const brandName = (p.brand || 'Hype').toLowerCase();
        const matchesBrand = f.brands.some(b => b.toLowerCase() === brandName);
        if (!matchesBrand) return false;
      }

      // 4. Price Range (minPrice & maxPrice)
      if (p.numericPrice < f.minPrice || p.numericPrice > f.maxPrice) return false;

      // 5. Rating Threshold (minRating)
      if (f.minRating > 0 && p.rating < f.minRating) return false;

      // 6. Discount Threshold
      if (f.discount > 0 && p.discount < f.discount) return false;

      // 7. Availability Filter
      if (f.availability && f.availability.length > 0) {
        const status = p.inStock ? 'in-stock' : 'out-of-stock';
        if (!f.availability.includes(status)) return false;
      }

      // 8. Color Swatches Filter
      if (f.colors && f.colors.length > 0) {
        const prodColors = (p.variants && p.variants.colors) ? p.variants.colors.map(c => c.toLowerCase()) : [];
        const matchesColor = f.colors.some(c => prodColors.some(pc => pc.includes(c.toLowerCase()) || c.toLowerCase().includes(pc)));
        if (!matchesColor) return false;
      }

      // 9. Size Pills Filter
      if (f.sizes && f.sizes.length > 0) {
        const prodSizes = (p.variants && p.variants.sizes) ? p.variants.sizes.map(s => s.toLowerCase()) : [];
        const matchesSize = f.sizes.some(s => prodSizes.some(ps => ps.includes(s.toLowerCase()) || s.toLowerCase().includes(ps)));
        if (!matchesSize) return false;
      }

      // 10. Shipping Filter
      if (f.shipping && f.shipping.length > 0) {
        const delBadge = (p.deliveryBadge || '').toLowerCase();
        const matchesShipping = f.shipping.some(s => {
          if (s === 'free') return delBadge.includes('free') || p.numericPrice > 999;
          if (s === 'fast' || s === 'express') return delBadge.includes('express') || delBadge.includes('2 days');
          return true;
        });
        if (!matchesShipping) return false;
      }

      // 11. Special Badges Filter
      if (f.special && f.special.length > 0) {
        const badgeText = (p.badge || '').toLowerCase();
        const matchesSpecial = f.special.some(sp => {
          if (sp === 'top-rated') return p.rating >= 4.7;
          if (sp === 'best-sellers') return p.reviewCount > 150;
          if (sp === 'featured') return p.discount > 20 || p.rating >= 4.8;
          if (sp === 'new-arrivals') return p.id >= 4;
          if (sp === 'trending') return p.reviewCount > 200;
          return true;
        });
        if (!matchesSpecial) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (AppState.sortOption) {
        case 'price-asc': return a.numericPrice - b.numericPrice;
        case 'price-desc': return b.numericPrice - a.numericPrice;
        case 'rating': return b.rating - a.rating;
        case 'newest': return b.id - a.id;
        case 'bestselling': return b.reviewCount - a.reviewCount;
        case 'discount': return b.discount - a.discount;
        default: return (b.reviewCount * b.rating) - (a.reviewCount * a.rating); // Popularity
      }
    });
  }

  // Render Product Listing View
  function renderProductListingView(overrideCategory = null) {
    if (!viewContainer) return;

    if (overrideCategory) {
      if (!AppState.listingFilters.categories.includes(overrideCategory)) {
        AppState.listingFilters.categories = [overrideCategory];
      }
    }

    syncFiltersToURL();

    const allProducts = ApiService.getMockData('products');
    const brandCounts = getBrandProductCounts(allProducts);
    const filtered = getFilteredProducts();
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / AppState.itemsPerPage));
    if (AppState.currentPage > totalPages) AppState.currentPage = 1;

    const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, startIndex + AppState.itemsPerPage);

    const availableBrands = ['Noise', 'boAt', 'Canon', 'Hype', 'Apple', 'Nike', 'Adidas', 'Sony'];
    const availableCategories = ['Smart Watch', 'Earbuds', 'Camera', 'Backpack', 'Shoes', 'Accessories', 'Men', 'Women'];
    const availableColors = [
      { name: 'Black', hex: '#000000' },
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Blue', hex: '#1E88E5' },
      { name: 'Red', hex: '#E53935' },
      { name: 'Grey', hex: '#757575' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Brown', hex: '#6D4C41' }
    ];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // Active Filter Chips Builder
    const activeFilterPills = [];
    const f = AppState.listingFilters;

    if (AppState.searchQuery) {
      activeFilterPills.push({ type: 'search', label: `Search: "${AppState.searchQuery}"` });
    }
    (f.categories || []).forEach(c => activeFilterPills.push({ type: 'category', val: c, label: `Category: ${c}` }));
    (f.brands || []).forEach(b => activeFilterPills.push({ type: 'brand', val: b, label: `Brand: ${b}` }));
    if (f.minPrice > 0 || f.maxPrice < 100000) {
      activeFilterPills.push({ type: 'price', label: `₹${f.minPrice.toLocaleString()} - ₹${f.maxPrice.toLocaleString()}` });
    }
    if (f.minRating > 0) activeFilterPills.push({ type: 'rating', label: `${f.minRating}★ & Above` });
    if (f.discount > 0) activeFilterPills.push({ type: 'discount', label: `${f.discount}%+ Off` });
    (f.availability || []).forEach(a => activeFilterPills.push({ type: 'availability', val: a, label: a === 'in-stock' ? 'In Stock' : 'Out of Stock' }));
    (f.colors || []).forEach(c => activeFilterPills.push({ type: 'color', val: c, label: `Color: ${c}` }));
    (f.sizes || []).forEach(s => activeFilterPills.push({ type: 'size', val: s, label: `Size: ${s}` }));
    (f.shipping || []).forEach(s => activeFilterPills.push({ type: 'shipping', val: s, label: s === 'free' ? 'Free Shipping' : 'Express Shipping' }));
    (f.special || []).forEach(s => activeFilterPills.push({ type: 'special', val: s, label: s.replace('-', ' ').toUpperCase() }));

    const activeFiltersHtml = activeFilterPills.length > 0 ? `
      <div class="active-filters-bar">
        <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">Active Filters (${activeFilterPills.length}):</span>
        ${activeFilterPills.map(chip => `
          <span class="filter-chip-pill">
            ${chip.label}
            <button class="chip-remove-btn" data-remove-type="${chip.type}" data-remove-val="${chip.val || ''}">×</button>
          </span>
        `).join('')}
        <button class="clear-all-chip-btn" id="clear-all-filters-btn">Clear All</button>
      </div>
    ` : '';

    const contentHtml = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="#home" data-nav-target="home">Home</a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">Shop Products</span>
      </nav>

      <div class="listing-header-row">
        <div>
          <h2 class="view-title">Product Catalog</h2>
          <p class="view-subtitle">Showing ${paginatedProducts.length} of ${totalCount} matching products</p>
        </div>

        <div class="listing-controls-bar">
          <button class="mobile-filter-trigger-btn" id="open-mobile-filter-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span>Filter (${activeFilterPills.length})</span>
          </button>

          <div class="view-mode-toggle">
            <button class="view-mode-btn ${AppState.viewMode === 'grid' ? 'active' : ''}" id="view-mode-grid-btn" title="Grid View">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
            <button class="view-mode-btn ${AppState.viewMode === 'list' ? 'active' : ''}" id="view-mode-list-btn" title="List View">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>

          <select id="sort-select" class="sort-select" aria-label="Sort products">
            <option value="popularity" ${AppState.sortOption === 'popularity' ? 'selected' : ''}>Sort by: Popularity</option>
            <option value="newest" ${AppState.sortOption === 'newest' ? 'selected' : ''}>Sort by: Newest</option>
            <option value="price-asc" ${AppState.sortOption === 'price-asc' ? 'selected' : ''}>Price: Low → High</option>
            <option value="price-desc" ${AppState.sortOption === 'price-desc' ? 'selected' : ''}>Price: High → Low</option>
            <option value="rating" ${AppState.sortOption === 'rating' ? 'selected' : ''}>Highest Rated</option>
            <option value="bestselling" ${AppState.sortOption === 'bestselling' ? 'selected' : ''}>Best Selling</option>
            <option value="discount" ${AppState.sortOption === 'discount' ? 'selected' : ''}>Discount %</option>
          </select>
        </div>
      </div>

      ${activeFiltersHtml}

      <div class="listing-layout">
        <!-- Desktop Filter Sidebar -->
        <aside class="filter-sidebar">
          
          <!-- Category Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Categories</span>
            </div>
            <div class="filter-options-list">
              ${availableCategories.map(c => {
                const checked = (f.categories || []).includes(c);
                return `
                  <div class="filter-checkbox-item" data-filter-type="category" data-filter-val="${c}">
                    <div class="filter-checkbox-left">
                      <div class="custom-checkbox ${checked ? 'checked' : ''}">
                        <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span>${c}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Brand Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Brands</span>
            </div>
            <div class="filter-options-list">
              ${availableBrands.map(b => {
                const checked = (f.brands || []).includes(b);
                const count = brandCounts[b] || 0;
                return `
                  <div class="filter-checkbox-item" data-filter-type="brand" data-filter-val="${b}">
                    <div class="filter-checkbox-left">
                      <div class="custom-checkbox ${checked ? 'checked' : ''}">
                        <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span>${b}</span>
                    </div>
                    <span class="item-count-badge">${count}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Price Filter (Slider & Inputs & Presets) -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Price Range</span>
            </div>
            <div class="price-inputs-row">
              <div class="price-input-box">
                <span>₹</span>
                <input type="number" id="min-price-input" value="${f.minPrice}" min="0" max="100000" step="500">
              </div>
              <span style="color: var(--text-muted); font-weight: bold;">–</span>
              <div class="price-input-box">
                <span>₹</span>
                <input type="number" id="max-price-input" value="${f.maxPrice}" min="0" max="100000" step="500">
              </div>
            </div>
            <div class="price-slider-track">
              <div class="price-slider-fill" style="left: ${(f.minPrice/100000)*100}%; right: ${100 - (f.maxPrice/100000)*100}%;"></div>
            </div>
            <div class="price-slider-range">
              <input type="range" id="min-price-slider" min="0" max="100000" step="500" value="${f.minPrice}">
              <input type="range" id="max-price-slider" min="0" max="100000" step="500" value="${f.maxPrice}">
            </div>
            <div class="price-preset-pills">
              <button class="preset-pill" data-price-preset="0-500">₹0–₹500</button>
              <button class="preset-pill" data-price-preset="500-1000">₹500–₹1k</button>
              <button class="preset-pill" data-price-preset="1000-5000">₹1k–₹5k</button>
              <button class="preset-pill" data-price-preset="5000-100000">₹5k+</button>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Rating Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Customer Rating</span>
            </div>
            <div class="rating-stars-list">
              ${[4, 3, 2, 1].map(r => `
                <div class="rating-filter-row ${f.minRating === r ? 'selected' : ''}" data-rating-val="${r}">
                  <span class="gold-stars">${'★'.repeat(r)}${'☆'.repeat(5-r)}</span>
                  <span>${r}★ & Above</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Discount Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Discount</span>
            </div>
            <div class="badge-chips-wrap">
              ${[10, 20, 30, 40, 50].map(d => `
                <button class="badge-chip ${f.discount === d ? 'selected' : ''}" data-discount-val="${d}">
                  ${d}%+ Off
                </button>
              `).join('')}
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Availability Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Availability</span>
            </div>
            <div class="filter-options-list">
              <div class="filter-checkbox-item" data-filter-type="availability" data-filter-val="in-stock">
                <div class="filter-checkbox-left">
                  <div class="custom-checkbox ${(f.availability||[]).includes('in-stock') ? 'checked' : ''}"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                  <span>In Stock</span>
                </div>
              </div>
              <div class="filter-checkbox-item" data-filter-type="availability" data-filter-val="out-of-stock">
                <div class="filter-checkbox-left">
                  <div class="custom-checkbox ${(f.availability||[]).includes('out-of-stock') ? 'checked' : ''}"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                  <span>Out of Stock</span>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Color Swatches Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Colors</span>
            </div>
            <div class="color-swatches-grid">
              ${availableColors.map(color => {
                const selected = (f.colors || []).includes(color.name);
                return `
                  <button class="color-swatch-item ${selected ? 'selected' : ''}" data-color-val="${color.name}" style="background-color: ${color.hex};" title="${color.name}"></button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Size Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Sizes</span>
            </div>
            <div class="size-pills-grid">
              ${availableSizes.map(size => {
                const selected = (f.sizes || []).includes(size);
                return `
                  <div class="size-pill-item ${selected ? 'selected' : ''}" data-size-val="${size}">
                    ${size}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Special & Shipping Filters -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Special & Shipping</span>
            </div>
            <div class="badge-chips-wrap">
              <button class="badge-chip ${(f.shipping||[]).includes('free') ? 'selected' : ''}" data-shipping-val="free">Free Shipping</button>
              <button class="badge-chip ${(f.shipping||[]).includes('express') ? 'selected' : ''}" data-shipping-val="express">Express Delivery</button>
              <button class="badge-chip ${(f.special||[]).includes('new-arrivals') ? 'selected' : ''}" data-special-val="new-arrivals">New Arrivals</button>
              <button class="badge-chip ${(f.special||[]).includes('best-sellers') ? 'selected' : ''}" data-special-val="best-sellers">Best Sellers</button>
              <button class="badge-chip ${(f.special||[]).includes('featured') ? 'selected' : ''}" data-special-val="featured">Featured</button>
            </div>
          </div>

        </aside>

        <!-- Product Grid / List Section -->
        <div id="product-grid-container">
          ${paginatedProducts.length === 0 ? `
            <div class="filter-empty-state-card">
              <div class="empty-state-icon-circle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 36px; height: 36px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
              <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary);">No Products Found</h3>
              <p style="color: var(--text-secondary); max-width: 440px; font-size: 0.95rem; line-height: 1.5;">
                We couldn't find any products matching all of your selected filters. Try broadening your criteria or clearing filters.
              </p>
              <div class="empty-state-actions-row">
                <button class="btn-primary-action" id="empty-clear-filters-btn">Clear All Filters</button>
                <button class="btn-secondary-action" id="empty-continue-btn">Continue Shopping</button>
              </div>
            </div>
          ` : `
            <div class="products-grid ${AppState.viewMode === 'list' ? 'list-view' : ''}">
              ${paginatedProducts.map(p => `
                <div class="product-card" data-product-id="${p.id}">
                  <div class="product-card-top">
                    <span class="discount-badge">${p.badge}</span>
                    <button class="wishlist-btn" aria-label="Add to wishlist" data-product-id="${p.id}">
                      <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                    <div class="product-img-wrapper">
                      <img src="${p.img}" alt="${p.name}" class="product-img">
                    </div>
                  </div>
                  <div class="product-card-bottom">
                    <div class="product-details">
                      <span class="product-cat">${p.brand} • ${p.cat}</span>
                      <h3 class="product-name">${p.name}</h3>
                      <div class="details-rating-row" style="margin-bottom: 6px;">
                        <span class="rating-stars">★★★★★</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${p.rating} (${p.reviewCount})</span>
                      </div>
                      <div class="product-price-row">
                        <span class="price-current">${p.price}</span>
                        <span class="price-original">${p.originalPrice}</span>
                      </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn-secondary-action quick-view-btn" data-quick-view-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem;">Quick View</button>
                      <button class="add-to-cart-btn" title="Add to Cart">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Pagination Bar -->
            ${totalPages > 1 ? `
              <div class="pagination-bar-container">
                <span style="font-size: 0.88rem; color: var(--text-secondary);">Page ${AppState.currentPage} of ${totalPages}</span>
                <div class="pagination-pages">
                  <button class="page-btn" id="prev-page-btn" ${AppState.currentPage === 1 ? 'disabled' : ''}>‹</button>
                  ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                    <button class="page-btn ${page === AppState.currentPage ? 'active' : ''}" data-page="${page}">${page}</button>
                  `).join('')}
                  <button class="page-btn" id="next-page-btn" ${AppState.currentPage === totalPages ? 'disabled' : ''}>›</button>
                </div>
              </div>
            ` : ''}
          `}
        </div>
      </div>

      <!-- Mobile Bottom Sheet Drawer -->
      <div class="mobile-filter-drawer-backdrop" id="mobile-filter-backdrop"></div>
      <div class="mobile-filter-bottom-sheet" id="mobile-filter-sheet">
        <div class="mobile-sheet-header">
          <span class="mobile-sheet-title">Filter Products</span>
          <button id="close-mobile-filter-btn" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--text-primary);">✕</button>
        </div>
        <div class="mobile-sheet-body">
          <p style="font-size:0.85rem; color:var(--text-muted);">Adjust your criteria to filter available items.</p>
        </div>
        <div class="mobile-sheet-footer">
          <button class="btn-secondary-action" id="mobile-clear-btn" style="padding: 12px 20px;">Reset</button>
          <button class="mobile-sheet-apply-btn" id="mobile-apply-btn">Apply Filters (${totalCount})</button>
        </div>
      </div>
    `;

    viewContainer.innerHTML = contentHtml;
    bindListingEvents();
    bindProductCardListeners();
  }

  // Bind All Listing & Filtering Interactive Events with Debounce
  let filterDebounceTimer = null;
  function triggerDebouncedFilterUpdate() {
    const gridContainer = document.getElementById('product-grid-container');
    if (gridContainer) gridContainer.innerHTML = Skeletons.productGrid(4);

    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(() => {
      AppState.currentPage = 1;
      renderProductListingView();
    }, 250);
  }

  function bindListingEvents() {
    const gridBtn = document.getElementById('view-mode-grid-btn');
    const listBtn = document.getElementById('view-mode-list-btn');
    if (gridBtn && listBtn) {
      gridBtn.addEventListener('click', () => { AppState.viewMode = 'grid'; renderProductListingView(); });
      listBtn.addEventListener('click', () => { AppState.viewMode = 'list'; renderProductListingView(); });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        AppState.sortOption = e.target.value;
        triggerDebouncedFilterUpdate();
      });
    }

    // Checkbox Filters (Categories, Brands, Availability)
    document.querySelectorAll('.filter-checkbox-item[data-filter-type]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = item.getAttribute('data-filter-type');
        const val = item.getAttribute('data-filter-val');
        const key = type === 'category' ? 'categories' : (type === 'brand' ? 'brands' : 'availability');
        let arr = AppState.listingFilters[key] || [];

        if (arr.includes(val)) {
          arr = arr.filter(i => i !== val);
        } else {
          arr.push(val);
        }
        AppState.listingFilters[key] = arr;
        triggerDebouncedFilterUpdate();
      });
    });

    // Price Inputs & Sliders
    const minInput = document.getElementById('min-price-input');
    const maxInput = document.getElementById('max-price-input');
    const minSlider = document.getElementById('min-price-slider');
    const maxSlider = document.getElementById('max-price-slider');

    if (minInput && maxInput && minSlider && maxSlider) {
      const updatePrices = (minVal, maxVal) => {
        AppState.listingFilters.minPrice = Math.max(0, parseInt(minVal, 10) || 0);
        AppState.listingFilters.maxPrice = Math.min(100000, parseInt(maxVal, 10) || 100000);
        triggerDebouncedFilterUpdate();
      };

      minInput.addEventListener('change', () => updatePrices(minInput.value, maxInput.value));
      maxInput.addEventListener('change', () => updatePrices(minInput.value, maxInput.value));
      minSlider.addEventListener('input', () => updatePrices(minSlider.value, maxSlider.value));
      maxSlider.addEventListener('input', () => updatePrices(minSlider.value, maxSlider.value));
    }

    // Price Preset Buttons
    document.querySelectorAll('[data-price-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const [min, max] = btn.getAttribute('data-price-preset').split('-').map(Number);
        AppState.listingFilters.minPrice = min;
        AppState.listingFilters.maxPrice = max;
        triggerDebouncedFilterUpdate();
      });
    });

    // Rating Filter Rows
    document.querySelectorAll('[data-rating-val]').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseFloat(row.getAttribute('data-rating-val'));
        AppState.listingFilters.minRating = AppState.listingFilters.minRating === val ? 0 : val;
        triggerDebouncedFilterUpdate();
      });
    });

    // Discount Buttons
    document.querySelectorAll('[data-discount-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseInt(btn.getAttribute('data-discount-val'), 10);
        AppState.listingFilters.discount = AppState.listingFilters.discount === val ? 0 : val;
        triggerDebouncedFilterUpdate();
      });
    });

    // Color Swatches
    document.querySelectorAll('[data-color-val]').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = swatch.getAttribute('data-color-val');
        let arr = AppState.listingFilters.colors || [];
        if (arr.includes(val)) arr = arr.filter(c => c !== val);
        else arr.push(val);
        AppState.listingFilters.colors = arr;
        triggerDebouncedFilterUpdate();
      });
    });

    // Size Pills
    document.querySelectorAll('[data-size-val]').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = pill.getAttribute('data-size-val');
        let arr = AppState.listingFilters.sizes || [];
        if (arr.includes(val)) arr = arr.filter(s => s !== val);
        else arr.push(val);
        AppState.listingFilters.sizes = arr;
        triggerDebouncedFilterUpdate();
      });
    });

    // Shipping Filters
    document.querySelectorAll('[data-shipping-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.getAttribute('data-shipping-val');
        let arr = AppState.listingFilters.shipping || [];
        if (arr.includes(val)) arr = arr.filter(s => s !== val);
        else arr.push(val);
        AppState.listingFilters.shipping = arr;
        triggerDebouncedFilterUpdate();
      });
    });

    // Special Filters
    document.querySelectorAll('[data-special-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.getAttribute('data-special-val');
        let arr = AppState.listingFilters.special || [];
        if (arr.includes(val)) arr = arr.filter(s => s !== val);
        else arr.push(val);
        AppState.listingFilters.special = arr;
        triggerDebouncedFilterUpdate();
      });
    });

    // Individual Chip Removal
    document.querySelectorAll('[data-remove-type]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-remove-type');
        const val = btn.getAttribute('data-remove-val');
        const f = AppState.listingFilters;

        if (type === 'search') {
          AppState.searchQuery = '';
          const sInput = document.getElementById('search-input');
          if (sInput) sInput.value = '';
        } else if (type === 'category') f.categories = f.categories.filter(c => c !== val);
        else if (type === 'brand') f.brands = f.brands.filter(b => b !== val);
        else if (type === 'price') { f.minPrice = 0; f.maxPrice = 100000; }
        else if (type === 'rating') f.minRating = 0;
        else if (type === 'discount') f.discount = 0;
        else if (type === 'availability') f.availability = f.availability.filter(a => a !== val);
        else if (type === 'color') f.colors = f.colors.filter(c => c !== val);
        else if (type === 'size') f.sizes = f.sizes.filter(s => s !== val);
        else if (type === 'shipping') f.shipping = f.shipping.filter(s => s !== val);
        else if (type === 'special') f.special = f.special.filter(s => s !== val);

        triggerDebouncedFilterUpdate();
      });
    });

    // Clear Filters (Preserves Active Search Query)
    const clearFiltersOnly = () => {
      AppState.listingFilters = {
        categories: [], brands: [], minPrice: 0, maxPrice: 100000, minRating: 0,
        discount: 0, availability: [], colors: [], sizes: [], shipping: [], special: []
      };
      triggerDebouncedFilterUpdate();
    };

    const clearAllWithSearch = () => {
      clearFiltersOnly();
      AppState.searchQuery = '';
      const globalSearch = document.getElementById('search-input');
      if (globalSearch) globalSearch.value = '';
    };

    const clearBtn = document.getElementById('clear-all-filters-btn');
    const emptyClearBtn = document.getElementById('empty-clear-filters-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearFiltersOnly);
    if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearFiltersOnly);

    const emptyContinueBtn = document.getElementById('empty-continue-btn');
    if (emptyContinueBtn) emptyContinueBtn.addEventListener('click', clearAllWithSearch);

    // Mobile Drawer Controls
    const openMobileBtn = document.getElementById('open-mobile-filter-btn');
    const closeMobileBtn = document.getElementById('close-mobile-filter-btn');
    const mobileBackdrop = document.getElementById('mobile-filter-backdrop');
    const mobileSheet = document.getElementById('mobile-filter-sheet');
    const mobileClearBtn = document.getElementById('mobile-clear-btn');
    const mobileApplyBtn = document.getElementById('mobile-apply-btn');

    if (openMobileBtn && mobileSheet && mobileBackdrop) {
      const toggleMobileDrawer = (show) => {
        if (show) {
          mobileBackdrop.classList.add('active');
          mobileSheet.classList.add('active');
        } else {
          mobileBackdrop.classList.remove('active');
          mobileSheet.classList.remove('active');
        }
      };

      openMobileBtn.addEventListener('click', () => toggleMobileDrawer(true));
      if (closeMobileBtn) closeMobileBtn.addEventListener('click', () => toggleMobileDrawer(false));
      if (mobileBackdrop) mobileBackdrop.addEventListener('click', () => toggleMobileDrawer(false));
      if (mobileClearBtn) mobileClearBtn.addEventListener('click', () => { clearAll(); toggleMobileDrawer(false); });
      if (mobileApplyBtn) mobileApplyBtn.addEventListener('click', () => toggleMobileDrawer(false));
    }

    // Pagination Click Listeners
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.currentPage = parseInt(btn.getAttribute('data-page'), 10);
        renderProductListingView();
      });
    });

    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => { AppState.currentPage--; renderProductListingView(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { AppState.currentPage++; renderProductListingView(); });

    // Quick View Listeners
    document.querySelectorAll('[data-quick-view-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btn.getAttribute('data-quick-view-id');
        openQuickViewModal(pid);
      });
    });
  }

  function openQuickViewModal(productId) {
    const product = ApiService.getMockData('products').find(p => p.id == productId);
    if (!product) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-content-card">
        <button class="modal-close-btn" id="modal-close-x">✕</button>
        <div class="product-details-grid" style="margin-bottom: 0;">
          <div class="gallery-container">
            <div class="gallery-main-wrapper" style="height: 300px;">
              <img src="${product.img}" alt="${product.name}" class="gallery-main-img">
            </div>
          </div>
          <div>
            <span class="details-brand-tag">${product.brand} • ${product.cat}</span>
            <h2 class="details-title" style="font-size: 1.6rem;">${product.name}</h2>
            <div class="details-rating-row">
              <span class="rating-stars">★★★★★</span>
              <span>${product.rating} (${product.reviewCount} reviews)</span>
            </div>
            <div class="details-price-row">
              <span class="details-price-current">${product.price}</span>
              <span class="details-price-original">${product.originalPrice}</span>
              <span class="details-discount-pill">${product.badge}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.6;">${product.shortDesc}</p>
            <div class="purchase-actions-row">
              <button class="btn-primary-action" id="modal-add-to-cart">Add to Cart</button>
              <button class="btn-secondary-action" id="modal-full-details" data-nav-target="product/${product.id}">Full Details</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const closeX = modalOverlay.querySelector('#modal-close-x');
    closeX.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.remove(); });

    const fullDetailsBtn = modalOverlay.querySelector('#modal-full-details');
    if (fullDetailsBtn) {
      fullDetailsBtn.addEventListener('click', () => {
        modalOverlay.remove();
        renderProductDetailsView(product.id);
      });
    }

    const modalCartBtn = modalOverlay.querySelector('#modal-add-to-cart');
    if (modalCartBtn) {
      modalCartBtn.addEventListener('click', () => {
        AppState.cartCount++;
        const cartBadge = document.getElementById('cart-badge');
        if (cartBadge) cartBadge.textContent = AppState.cartCount;
        modalCartBtn.textContent = '✓ Added';
        setTimeout(() => modalOverlay.remove(), 800);
      });
    }
  }

  /* ==========================================================================
     MODULE 2 — Product Details Popup Modal Overlay & Controller
     ========================================================================== */
  function openProductDetailsModal(productId) {
    const allProducts = ApiService.getMockData('products');
    const product = allProducts.find(p => p.id == productId);

    if (!product) {
      renderProductNotFoundView(productId);
      return;
    }

    AppState.currentView = `product/${product.id}`;
    if (!AppState.selectedVariant) AppState.selectedVariant = { color: null, size: null };
    AppState.selectedVariant.color = product.variants?.colors?.[0] || null;
    AppState.selectedVariant.size = product.variants?.sizes?.[0] || null;
    AppState.lightboxImages = product.images || [product.img];

    // Remove any active product details modal
    document.querySelectorAll('.product-details-modal-overlay').forEach(m => m.remove());

    const modal = document.createElement('div');
    modal.className = 'product-details-modal-overlay';
    modal.innerHTML = `
      <div class="product-details-modal-card">
        <button class="modal-close-icon-btn" id="modal-close-x-btn" title="Close details">✕</button>

        <nav class="breadcrumb" aria-label="Breadcrumb" style="margin-bottom: 20px;">
          <span style="color: var(--text-muted);">Shop</span>
          <span class="breadcrumb-separator">/</span>
          <span style="color: var(--text-muted);">${product.cat}</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">${product.name}</span>
        </nav>

        <div class="product-details-grid">
          <!-- Left: Module 3 Interactive Gallery -->
          <div id="product-gallery-slot">
            ${renderGalleryHtml(product)}
          </div>

          <!-- Right: Product Information & Purchase Panel -->
          <div>
            <span class="details-brand-tag">${product.brand || 'Hype'} • ${product.cat || 'General'}</span>
            <h1 class="details-title">${product.name}</h1>

            <div class="details-rating-row">
              <span class="rating-stars">★★★★★</span>
              <span style="font-weight: 700; color: var(--text-primary);">${product.rating || 4.8}</span>
              <span style="color: var(--text-muted);">(${product.reviewCount || 150} reviews)</span>
              <span style="color: var(--border-color);">|</span>
              <span style="color: var(--color-success); font-weight: 700;">${product.inStock !== false ? `In Stock (${product.stockCount || 15} left)` : 'Out of Stock'}</span>
            </div>

            <div class="details-price-row">
              <span class="details-price-current">${product.price}</span>
              <span class="details-price-original">${product.originalPrice}</span>
              <span class="details-discount-pill">${product.badge}</span>
            </div>

            <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
              ${product.description || product.shortDesc || 'Discover exceptional style and performance crafted with premium materials for maximum durability and everyday comfort.'}
            </p>

            <!-- Color Swatches -->
            ${product.variants?.colors ? `
              <div class="variant-group">
                <span class="variant-label">Color: <strong id="selected-color-label">${AppState.selectedVariant.color}</strong></span>
                <div class="variant-options">
                  ${product.variants.colors.map(color => `
                    <button class="color-swatch ${color === AppState.selectedVariant.color ? 'active' : ''}" data-color="${color}" style="background-color: ${getColorHex(color)};" title="${color}"></button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Size Pills -->
            ${product.variants?.sizes ? `
              <div class="variant-group">
                <span class="variant-label">Option / Size: <strong id="selected-size-label">${AppState.selectedVariant.size}</strong></span>
                <div class="variant-options">
                  ${product.variants.sizes.map(size => `
                    <button class="size-pill ${size === AppState.selectedVariant.size ? 'active' : ''}" data-size="${size}">${size}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Quantity & Actions -->
            <div class="purchase-actions-row">
              <div class="quantity-control">
                <button class="qty-btn" id="qty-minus-btn">-</button>
                <input type="text" id="qty-input" class="qty-input" value="1" readonly>
                <button class="qty-btn" id="qty-plus-btn">+</button>
              </div>

              <button class="btn-primary-action" id="details-add-to-cart-btn" style="padding: 14px 28px; font-size: 0.95rem;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>Add to Cart</span>
              </button>

              <button class="btn-buy-now" id="details-buy-now-btn">Buy Now</button>
            </div>

            <!-- Trust Badges -->
            <div class="trust-cards-grid">
              <div class="trust-item">
                <svg class="trust-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>${product.deliveryBadge || 'Express Shipping in 2 Days'}</span>
              </div>
              <div class="trust-item">
                <svg class="trust-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>${product.warranty || '1 Year Official Warranty'}</span>
              </div>
              <div class="trust-item">
                <svg class="trust-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                <span>${product.returnPolicy || '30 Days Money Back Guarantee'}</span>
              </div>
              <div class="trust-item">
                <svg class="trust-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span>SKU: ${product.sku || 'SKU-HYP-' + product.id}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Specifications & Reviews Tabs inside Modal -->
        <div class="details-tabs-container" style="margin-top: 36px;">
          <div class="tabs-nav">
            <button class="tab-btn active" data-tab="specs">Specifications</button>
            <button class="tab-btn" data-tab="seller">Seller & Warranty</button>
            <button class="tab-btn" data-tab="reviews">Customer Reviews (${product.reviewCount})</button>
          </div>
          <div id="tab-content-pane">
            ${renderTabContent('specs', product)}
          </div>
        </div>

        <!-- Related Products Carousel inside Modal -->
        <div class="related-section">
          ${renderRelatedProductsHtml(product)}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = 'auto';
    };

    const closeBtn = modal.querySelector('#modal-close-x-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    bindDetailsEvents(product);
    bindGalleryEvents(product);
    bindCarouselEvents();
  }

  function renderProductDetailsView(productId) {
    openProductDetailsModal(productId);
  }

  function getColorHex(colorName) {
    const map = {
      'Black': '#111111', 'Carbon Black': '#1a1a1a', 'Stealth Black': '#151515', 'Triple Black': '#000000', 'Obsidian Black': '#1e1e1e', 'Midnight Black': '#121212',
      'Silver': '#c0c0c0', 'Vintage White': '#f5f5f0', 'White': '#ffffff', 'Cream': '#fffdd0',
      'Midnight Blue': '#191970', 'Bold Blue': '#00008b', 'Navy Blue': '#000080',
      'Army Green': '#4b5320', 'Neon Red': '#ff073a', 'Tan Brown': '#d2b48c', 'Mahogany': '#c04000',
      'Heather Grey': '#808080', 'Beige Camel': '#c19a6b', 'Soft Rose': '#ffb6c1'
    };
    return map[colorName] || '#666666';
  }

  function renderTabContent(tabName, product) {
    if (tabName === 'specs') {
      return `
        <table class="app-table" style="width: 100%;">
          <tbody>
            ${Object.entries(product.specs || {}).map(([k, v]) => `
              <tr>
                <td style="width: 30%; font-weight: 700; color: var(--text-primary);">${k}</td>
                <td style="color: var(--text-secondary);">${v}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (tabName === 'seller') {
      return `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <p><strong>Seller Information:</strong> ${product.sellerInfo}</p>
          <p><strong>Warranty Policy:</strong> ${product.warranty}</p>
          <p><strong>Return Guarantee:</strong> ${product.returnPolicy}</p>
        </div>
      `;
    } else {
      return `
        <div class="notifications-list">
          ${ApiService.getMockData('reviews').map(r => `
            <div class="notification-card">
              <div>
                <h4 style="margin-bottom: 4px; font-weight: 700;">${r.user} <span style="color: #ffc107;">★ ${r.rating}</span></h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${r.comment}</p>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${r.date}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  function bindDetailsEvents(product) {
    // Quantity logic
    const qtyInput = document.getElementById('qty-input');
    const minusBtn = document.getElementById('qty-minus-btn');
    const plusBtn = document.getElementById('qty-plus-btn');

    if (minusBtn && plusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10);
        if (val > 1) qtyInput.value = val - 1;
      });
      plusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10);
        if (val < product.stockCount) qtyInput.value = val + 1;
      });
    }

    // Variant selection
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const color = swatch.getAttribute('data-color');
        AppState.selectedVariant.color = color;
        const colorLabel = document.getElementById('selected-color-label');
        if (colorLabel) colorLabel.textContent = color;
      });
    });

    document.querySelectorAll('.size-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.size-pill').forEach(s => s.classList.remove('active'));
        pill.classList.add('active');
        const size = pill.getAttribute('data-size');
        AppState.selectedVariant.size = size;
        const sizeLabel = document.getElementById('selected-size-label');
        if (sizeLabel) sizeLabel.textContent = size;
      });
    });

    // Add to Cart
    const addCartBtn = document.getElementById('details-add-to-cart-btn');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        const qty = parseInt(document.getElementById('qty-input')?.value || '1', 10);
        AppState.cartCount += qty;
        const cartBadge = document.getElementById('cart-badge');
        if (cartBadge) cartBadge.textContent = AppState.cartCount;

        addCartBtn.innerHTML = `<span>Added ${qty} to Cart</span>`;
        setTimeout(() => {
          addCartBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>Add to Cart</span>
          `;
        }, 1500);
      });
    }

    // Buy Now
    const buyNowBtn = document.getElementById('details-buy-now-btn');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => {
        AppState.cartCount++;
        renderView('cart');
      });
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        const pane = document.getElementById('tab-content-pane');
        if (pane) pane.innerHTML = renderTabContent(tab, product);
      });
    });
  }

  /* ==========================================================================
     MODULE 3 — Interactive Image Gallery Controller (Zoom & Lightbox)
     ========================================================================== */
  function renderGalleryHtml(product) {
    const images = (product.images && product.images.length > 0) ? product.images : [product.img];
    const mainImg = images[0];

    return `
      <div class="gallery-container">
        <div class="gallery-main-wrapper" id="gallery-main-container">
          <img src="${mainImg}" alt="${product.name}" class="gallery-main-img" id="gallery-main-image">
          <div class="gallery-zoom-lens" id="gallery-zoom-lens" style="background-image: url('${mainImg}');"></div>
        </div>

        ${images.length > 1 ? `
          <div class="gallery-thumbnails-strip">
            ${images.map((img, idx) => `
              <div class="gallery-thumb-item ${idx === 0 ? 'active' : ''}" data-thumb-idx="${idx}" data-img-url="${img}">
                <img src="${img}" alt="Thumbnail ${idx + 1}" class="gallery-thumb-img">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function bindGalleryEvents(product) {
    const container = document.getElementById('gallery-main-container');
    const mainImg = document.getElementById('gallery-main-image');
    const zoomLens = document.getElementById('gallery-zoom-lens');
    const thumbs = document.querySelectorAll('.gallery-thumb-item');

    if (container && zoomLens && mainImg) {
      // Hover Magnifier Zoom Effect
      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        zoomLens.style.backgroundPosition = `${x}% ${y}%`;
        zoomLens.style.backgroundSize = '220%';
      });

      // Click to launch Lightbox
      container.addEventListener('click', () => {
        const activeThumb = document.querySelector('.gallery-thumb-item.active');
        const idx = activeThumb ? parseInt(activeThumb.getAttribute('data-thumb-idx'), 10) : 0;
        openLightboxModal(product.images || [product.img], idx);
      });
    }

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const url = thumb.getAttribute('data-img-url');
        if (mainImg) mainImg.src = url;
        if (zoomLens) zoomLens.style.backgroundImage = `url('${url}')`;
      });
    });
  }

  function openLightboxModal(images, startIndex = 0) {
    AppState.lightboxIndex = startIndex;
    AppState.lightboxImages = images;

    const modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.innerHTML = `
      <button class="modal-close-btn" id="lightbox-close" style="top: 24px; right: 24px; z-index: 10001;">✕</button>
      <button class="lightbox-nav-btn prev" id="lightbox-prev">‹</button>
      <img src="${images[startIndex]}" class="lightbox-img" id="lightbox-current-img" alt="Enlarged view">
      <button class="lightbox-nav-btn next" id="lightbox-next">›</button>
    `;

    document.body.appendChild(modal);

    const updateLightbox = () => {
      const imgEl = document.getElementById('lightbox-current-img');
      if (imgEl) imgEl.src = AppState.lightboxImages[AppState.lightboxIndex];
    };

    const prevBtn = modal.querySelector('#lightbox-prev');
    const nextBtn = modal.querySelector('#lightbox-next');
    const closeBtn = modal.querySelector('#lightbox-close');

    prevBtn.addEventListener('click', () => {
      AppState.lightboxIndex = (AppState.lightboxIndex - 1 + AppState.lightboxImages.length) % AppState.lightboxImages.length;
      updateLightbox();
    });

    nextBtn.addEventListener('click', () => {
      AppState.lightboxIndex = (AppState.lightboxIndex + 1) % AppState.lightboxImages.length;
      updateLightbox();
    });

    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const keyHandler = (e) => {
      if (!document.body.contains(modal)) {
        document.removeEventListener('keydown', keyHandler);
        return;
      }
      if (e.key === 'Escape') modal.remove();
      else if (e.key === 'ArrowLeft') prevBtn.click();
      else if (e.key === 'ArrowRight') nextBtn.click();
    };
    document.addEventListener('keydown', keyHandler);
  }

  /* ==========================================================================
     MODULE 4 — Related Products Carousel Controller
     ========================================================================== */
  function renderRelatedProductsHtml(currentProduct) {
    const allProducts = ApiService.getMockData('products');
    const related = allProducts.filter(p => p.id !== currentProduct.id && (p.cat === currentProduct.cat || p.brand === currentProduct.brand));

    if (related.length === 0) {
      return EmptyStates.get('related');
    }

    return `
      <div class="view-section-header">
        <div>
          <h3 class="view-title" style="font-size: 1.4rem;">Related Products You Might Like</h3>
          <p class="view-subtitle">Recommended based on ${currentProduct.cat}</p>
        </div>
      </div>

      <div class="carousel-container-wrapper">
        <button class="carousel-arrow prev" id="carousel-prev-btn">‹</button>
        <div class="related-carousel-track" id="related-carousel-track">
          ${related.map(p => `
            <div class="product-card" data-product-id="${p.id}">
              <div class="product-card-top">
                <span class="discount-badge">${p.badge}</span>
                <button class="wishlist-btn" aria-label="Add to wishlist">
                  <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <div class="product-img-wrapper">
                  <img src="${p.img}" alt="${p.name}" class="product-img">
                </div>
              </div>
              <div class="product-card-bottom">
                <div class="product-details">
                  <span class="product-cat">${p.brand}</span>
                  <h3 class="product-name">${p.name}</h3>
                  <div class="product-price-row">
                    <span class="price-current">${p.price}</span>
                    <span class="price-original">${p.originalPrice}</span>
                  </div>
                </div>
                <button class="add-to-cart-btn" title="Add to Cart">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="carousel-arrow next" id="carousel-next-btn">›</button>
      </div>
    `;
  }

  function bindCarouselEvents() {
    const track = document.getElementById('related-carousel-track');
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');

    if (track && prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -280, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: 280, behavior: 'smooth' });
      });
    }
  }

  /* ==========================================================================
     Global Navigation Action Events Binder
     ========================================================================== */
  function bindGlobalNavigationEvents() {
    // Intercept data-nav-target buttons
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = btn.getAttribute('data-nav-target');
        const navItem = document.querySelector(`.nav-item[data-nav="${target}"]`);
        if (navItem) {
          navItem.click();
        } else {
          renderView(target);
        }
      });
    });

    // Intercept Category Cards
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const catTitle = card.querySelector('.category-title')?.textContent?.trim();
        if (catTitle) {
          renderView('category/' + catTitle);
        } else {
          renderView('categories');
        }
      });
    });

    // Intercept View All Products & Hero CTA links
    document.querySelectorAll('.view-all-link, .hero-cta-btn').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        renderView('shop');
      });
    });
  }

  /* ==========================================================================
     Custom 404 Page (Part 1)
     ========================================================================== */
  function render404View(attemptedRoute = '') {
    if (!viewContainer) return;

    viewContainer.innerHTML = `
      <div class="error-404-card" role="region" aria-label="Page Not Found">
        <span class="error-404-badge">404 Error</span>
        <div class="error-404-number">404</div>
        <h2 style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Oops! Page Not Found</h2>
        <p style="font-size: 1rem; color: var(--text-secondary); max-width: 480px; line-height: 1.6; margin-bottom: 20px;">
          The page or link <strong style="color: var(--color-accent);">${attemptedRoute ? '/' + attemptedRoute : ''}</strong> you followed may be broken, or the page may have been moved or removed.
        </p>

        <!-- Inline Product Search Bar on 404 Page -->
        <div class="error-404-search-box">
          <input type="text" id="error-404-search-input" placeholder="Search for products, brands and more..." aria-label="Search on 404 page">
          <button class="error-404-search-btn" id="error-404-search-submit" title="Search">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>

        <div class="empty-state-actions" style="margin-top: 10px;">
          <button class="btn-primary-action" data-nav-target="home">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Go to Home</span>
          </button>
          <button class="btn-secondary-action" data-nav-target="shop">Continue Shopping</button>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('error-404-search-input');
    const searchSubmit = document.getElementById('error-404-search-submit');
    if (searchInput && searchSubmit) {
      const handle404Search = () => {
        const query = searchInput.value.trim();
        if (query) {
          const globalSearch = document.getElementById('search-input');
          if (globalSearch) globalSearch.value = query;
          AppState.searchQuery = query.toLowerCase();
          renderView('shop');
        }
      };
      searchSubmit.addEventListener('click', handle404Search);
      searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handle404Search(); });
    }

    bindGlobalNavigationEvents();
  }

  /* ==========================================================================
     Product Not Found View (Part 2)
     ========================================================================== */
  function renderProductNotFoundView(productId) {
    if (!viewContainer) return;

    viewContainer.innerHTML = `
      <div class="not-found-card" role="region" aria-label="Product Not Found">
        <div class="empty-state-illustration" style="background: rgba(231, 29, 54, 0.1);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="10" y1="11" x2="14" y2="15"/><line x1="14" y1="11" x2="10" y2="15"/></svg>
        </div>
        <h2 class="empty-state-title">Product Unavailable or Removed</h2>
        <p class="empty-state-desc">The item you requested (ID: #${productId || 'N/A'}) is no longer available or was removed from our active inventory.</p>
        <div class="empty-state-actions">
          <button class="btn-primary-action" data-nav-target="shop">
            <span>Browse Products</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>
    `;

    bindGlobalNavigationEvents();
  }

  /* ==========================================================================
     Category Not Found View (Part 3)
     ========================================================================== */
  function renderCategoryNotFoundView(categorySlug) {
    if (!viewContainer) return;

    viewContainer.innerHTML = `
      <div class="not-found-card" role="region" aria-label="Category Not Found">
        <div class="empty-state-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
        </div>
        <h2 class="empty-state-title">Category Not Found</h2>
        <p class="empty-state-desc">The department or category key <strong style="color: var(--color-accent);">'${categorySlug || 'unknown'}'</strong> could not be located in our department index.</p>
        <div class="empty-state-actions">
          <button class="btn-primary-action" data-nav-target="categories">
            <span>Browse Categories</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>
    `;

    bindGlobalNavigationEvents();
  }

  /* ==========================================================================
     Universal Error State Component Generator
     ========================================================================== */
  const ErrorState = {
    render(errorMessage) {
      return `
        <div class="error-state-card" role="alert" aria-live="assertive">
          <div class="error-state-badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 class="error-state-title">Connection Error</h3>
          <p class="error-state-desc">${errorMessage || 'Something went wrong while fetching data. Please check your internet connection and try again.'}</p>
          <div class="error-state-actions">
            <button id="error-retry-btn" class="btn-retry-action">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>Retry Request</span>
            </button>
            <button class="btn-secondary-action" data-nav-target="home">Go Home</button>
          </div>
        </div>
      `;
    }
  };

  /* ==========================================================================
     View Renderer Router & Unknown Route Catch-All
     ========================================================================== */
  const viewContainer = document.getElementById('view-container');
  const defaultHomeHtml = viewContainer ? viewContainer.innerHTML : '';

  // Registry of valid system view routes
  const VALID_ROUTES = ['home', 'shop', 'categories', 'wishlist', 'orders', 'profile', 'cart', 'checkout', 'search', 'product-not-found', 'category-not-found', '404'];

  function renderView(viewName, overrideState) {
    AppState.currentView = viewName;
    const targetState = overrideState || AppState.simulatedState;

    if (viewName === 'cart') {
      renderCartView();
      return;
    }

    // Routing Integration for Product Details (`product/1`) & Category filter (`category/men`)
    if (viewName.startsWith('product/')) {
      const pid = viewName.split('/')[1];
      renderProductDetailsView(pid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (viewName.startsWith('category/')) {
      const slug = viewName.split('/')[1];
      renderProductListingView(slug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (viewName === 'search') {
      if (AppState.searchQuery) {
        renderSearchResultsView(AppState.searchQuery);
      } else {
        renderProductListingView();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (viewName === 'shop') {
      renderProductListingView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Routing Integration: Unknown routes trigger Custom 404 Page automatically
    if (!VALID_ROUTES.includes(viewName)) {
      render404View(viewName);
      return;
    }

    if (viewName === '404') {
      render404View();
      return;
    } else if (viewName === 'product-not-found') {
      renderProductNotFoundView(overrideState?.id || '404');
      return;
    } else if (viewName === 'category-not-found') {
      renderCategoryNotFoundView(overrideState?.slug || 'unknown');
      return;
    }

    renderSkeletonView(viewName);

    ApiService.fetchViewData(viewName, targetState)
      .then(response => {
        if (response.state === 'loading') {
          renderSkeletonView(viewName);
        } else if (response.state === 'empty') {
          renderEmptyView(viewName);
        } else {
          renderSuccessView(viewName, response.data);
        }
      })
      .catch(error => {
        renderErrorView(error.message);
      });
  }

  function renderSkeletonView(viewName) {
    if (!viewContainer) return;
    switch (viewName) {
      case 'home':
        viewContainer.innerHTML = Skeletons.home();
        break;
      case 'shop':
      case 'wishlist':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div>
              <h2 class="view-title">${viewName.toUpperCase()}</h2>
              <p class="view-subtitle">Fetching items...</p>
            </div>
          </div>
          ${Skeletons.productGrid(8)}
        `;
        break;
      case 'search':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div>
              <h2 class="view-title">Search Results</h2>
              <p class="view-subtitle">Searching catalog for "${AppState.searchQuery || ''}"...</p>
            </div>
          </div>
          ${Skeletons.productGrid(8)}
        `;
        break;
      case 'categories':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div><h2 class="view-title">All Categories</h2></div>
          </div>
          ${Skeletons.categories(6)}
        `;
        break;
      case 'orders':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div><h2 class="view-title">Your Orders</h2></div>
          </div>
          ${Skeletons.table(6, 5)}
        `;
        break;
      case 'dashboard':
      case 'analytics':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div><h2 class="view-title">Dashboard Overview</h2></div>
          </div>
          ${Skeletons.dashboard()}
        `;
        break;
      case 'notifications':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div><h2 class="view-title">Notifications</h2></div>
          </div>
          ${Skeletons.notifications()}
        `;
        break;
      case 'profile':
        viewContainer.innerHTML = Skeletons.profile();
        break;
      default:
        viewContainer.innerHTML = Skeletons.home();
    }
  }

  function renderEmptyView() {
    if (!viewContainer) return;
    viewContainer.innerHTML = '';
  }

  function renderErrorView(errorMessage) {
    if (!viewContainer) return;
    viewContainer.innerHTML = ErrorState.render(errorMessage);

    const retryBtn = document.getElementById('error-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        retryBtn.classList.add('spinning');
        AppState.simulatedState = 'normal';
        updateStateToolbarButtons('normal');
        setTimeout(() => {
          renderView(AppState.currentView, 'normal');
        }, 400);
      });
    }
    bindGlobalNavigationEvents();
  }

  function renderSuccessView(viewName, data) {
    if (!viewContainer) return;

    if (viewName === 'home') {
      viewContainer.innerHTML = defaultHomeHtml;
      bindProductCardListeners();
      bindGlobalNavigationEvents();
      return;
    }

    let contentHtml = '';

    if (viewName === 'shop' || viewName === 'search') {
      renderProductListingView();
      return;
    } else if (viewName === 'wishlist') {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">Saved Wishlist</h2>
            <p class="view-subtitle">Showing ${data.length} premium items</p>
          </div>
        </div>
        <div class="products-grid">
          ${data.map(p => `
            <div class="product-card" data-product-id="${p.id}">
              <div class="product-card-top">
                <span class="discount-badge">${p.badge}</span>
                <button class="wishlist-btn active" aria-label="Add to wishlist">
                  <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <div class="product-img-wrapper">
                  <img src="${p.img}" alt="${p.name}" class="product-img">
                </div>
              </div>
              <div class="product-card-bottom">
                <div class="product-details">
                  <span class="product-cat">${p.cat}</span>
                  <h3 class="product-name">${p.name}</h3>
                  <div class="product-price-row">
                    <span class="price-current">${p.price}</span>
                    <span class="price-original">${p.originalPrice}</span>
                  </div>
                </div>
                <button class="add-to-cart-btn" title="Add to Cart">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (viewName === 'categories') {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">Product Categories</h2>
            <p class="view-subtitle">Explore by department</p>
          </div>
        </div>
        <div class="category-grid">
          ${data.map(c => `
            <a href="#" class="category-card" style="--card-bg: ${c.bg};">
              <div class="category-info">
                <span class="category-title">${c.name}</span>
                <span class="category-subtitle">${c.subtitle}</span>
              </div>
              <img src="${c.img}" alt="${c.name}" class="category-img">
            </a>
          `).join('')}
        </div>
      `;
    } else if (viewName === 'orders') {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">My Orders</h2>
            <p class="view-subtitle">Track recent purchases</p>
          </div>
        </div>
        <div class="data-table-card">
          <table class="app-table">
            <thead>
              <tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${data.map(o => `
                <tr>
                  <td><strong>${o.id}</strong></td>
                  <td>${o.date}</td>
                  <td>${o.items} items</td>
                  <td>${o.total}</td>
                  <td><span class="status-pill ${o.statusClass}">${o.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (viewName === 'notifications') {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">Notifications</h2>
            <p class="view-subtitle">Recent alerts and updates</p>
          </div>
        </div>
        <div class="notifications-list">
          ${data.map(n => `
            <div class="notification-card ${n.unread ? 'unread' : ''}">
              <div class="notification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div style="flex-grow: 1;">
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${n.title}</h4>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 6px;">${n.desc}</p>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${n.time}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (viewName === 'dashboard' || viewName === 'analytics') {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">Store Dashboard & Analytics</h2>
            <p class="view-subtitle">Live store metric overview</p>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div class="data-table-card" style="display: flex; justify-content: space-between; align-items: center;">
              <div><span style="font-size: 0.85rem; color: var(--text-secondary);">Total Revenue</span><h3 style="font-size: 1.5rem; font-weight: 800;">₹4,28,900</h3></div>
              <span class="status-pill success">+18.4%</span>
            </div>
            <div class="data-table-card" style="display: flex; justify-content: space-between; align-items: center;">
              <div><span style="font-size: 0.85rem; color: var(--text-secondary);">Total Orders</span><h3 style="font-size: 1.5rem; font-weight: 800;">1,420</h3></div>
              <span class="status-pill success">+12.1%</span>
            </div>
            <div class="data-table-card" style="display: flex; justify-content: space-between; align-items: center;">
              <div><span style="font-size: 0.85rem; color: var(--text-secondary);">Conversion Rate</span><h3 style="font-size: 1.5rem; font-weight: 800;">3.85%</h3></div>
              <span class="status-pill pending">+0.4%</span>
            </div>
          </div>
        </div>
      `;
    } else if (viewName === 'profile') {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">User Profile</h2>
            <p class="view-subtitle">Manage personal information & preferences</p>
          </div>
        </div>
        <div style="background: var(--bg-card); padding: 30px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="assets/images/cat_men.png" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 700;">Alex Hype</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">alex.hype@example.com</p>
              <span class="status-pill success" style="margin-top: 6px;">PRO VIP Member</span>
            </div>
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">${viewName.toUpperCase()}</h2>
            <p class="view-subtitle">Section content loaded successfully</p>
          </div>
        </div>
        <div class="data-table-card"><p>Welcome to ${viewName} section.</p></div>
      `;
    }

    viewContainer.innerHTML = contentHtml;
    bindProductCardListeners();
    bindGlobalNavigationEvents();
  }

  function updateStateToolbarButtons(activeState) {
    // No-op helper preserved for internal retry handler calls
  }

  /* ==========================================================================
     Theme Toggle (Light/Dark Mode)
     ========================================================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
  } else if (systemPrefersDark) {
    htmlElement.setAttribute('data-theme', 'dark');
  } else {
    htmlElement.setAttribute('data-theme', 'light');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      AppState.theme = newTheme;

      themeToggleBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        themeToggleBtn.style.transform = 'none';
      }, 300);
    });
  }

  /* ==========================================================================
     Location Selector Dropdown
     ========================================================================== */
  const locationSelector = document.getElementById('location-select');
  if (locationSelector) {
    const locationBtn = locationSelector.querySelector('.location-value-btn');
    const locationDropdown = document.getElementById('location-dropdown');
    const currentLocationLabel = document.getElementById('current-location');
    const dropdownItems = locationDropdown.querySelectorAll('li');

    locationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = locationBtn.getAttribute('aria-expanded') === 'true';
      locationBtn.setAttribute('aria-expanded', !isExpanded);
      locationDropdown.classList.toggle('show');
    });

    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedValue = item.getAttribute('data-value');
        currentLocationLabel.textContent = selectedValue;
        dropdownItems.forEach(li => li.setAttribute('aria-selected', 'false'));
        item.setAttribute('aria-selected', 'true');
        locationBtn.setAttribute('aria-expanded', 'false');
        locationDropdown.classList.remove('show');
      });
    });

    document.addEventListener('click', (e) => {
      if (!locationSelector.contains(e.target)) {
        locationBtn.setAttribute('aria-expanded', 'false');
        locationDropdown.classList.remove('show');
      }
    });
  }

  /* ==========================================================================
     Header Shortcuts (Cart & Profile)
     ========================================================================== */
  const headerCartBtn = document.getElementById('header-cart-btn');
  const headerProfileBtn = document.getElementById('header-profile-btn');

  if (headerCartBtn) {
    headerCartBtn.addEventListener('click', () => {
      renderView('cart');
    });
  }

  if (headerProfileBtn) {
    headerProfileBtn.addEventListener('click', () => {
      const profileNav = document.querySelector('.nav-item[data-nav="profile"]');
      if (profileNav) profileNav.click();
      else renderView('profile');
    });
  }

  /* ==========================================================================
     Global Delegated Event Listeners (Guarantees Clicks Everywhere)
     ========================================================================== */
  document.addEventListener('click', (e) => {
    // Product Card Clicks
    const productCard = e.target.closest('.product-card');
    if (productCard) {
      if (e.target.closest('.wishlist-btn') || e.target.closest('.add-to-cart-btn') || e.target.closest('.quick-view-btn')) {
        return;
      }
      const pid = productCard.getAttribute('data-product-id');
      if (pid) {
        e.preventDefault();
        renderProductDetailsView(pid);
        return;
      }
    }

    // Category Card Clicks
    const categoryCard = e.target.closest('.category-card');
    if (categoryCard) {
      e.preventDefault();
      const catTitle = categoryCard.querySelector('.category-title')?.textContent?.trim();
      if (catTitle) {
        renderView('category/' + catTitle);
      } else {
        renderView('categories');
      }
      return;
    }

    // View All Products Links & Hero CTA
    const viewAllLink = e.target.closest('.view-all-link, .hero-cta-btn');
    if (viewAllLink) {
      e.preventDefault();
      renderView('shop');
      return;
    }
  });

  function bindProductCardListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
      card.style.cursor = 'pointer';
      const pid = card.getAttribute('data-product-id');
      const addBtn = card.querySelector('.add-to-cart-btn');

      if (addBtn && !addBtn.dataset.cartBound) {
        addBtn.dataset.cartBound = 'true';
        addBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (pid) {
            addToCart(pid, 1);
          }
          addBtn.classList.add('added');
          setTimeout(() => addBtn.classList.remove('added'), 1500);
        });
      }
    });

    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(button => {
      if (button.dataset.wishBound) return;
      button.dataset.wishBound = 'true';

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = button.classList.toggle('active');
        button.style.transform = 'scale(0.8)';
        setTimeout(() => {
          button.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
        }, 100);
        setTimeout(() => {
          button.style.transform = 'none';
        }, 250);
      });
    });
  }

  /* ==========================================================================
     Mobile Layout Drawer Toggles
     ========================================================================== */
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebar-close');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (menuToggle && sidebar && sidebarClose && sidebarOverlay) {
    const openMenu = () => {
      sidebar.classList.add('active');
      sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    };

    menuToggle.addEventListener('click', openMenu);
    sidebarClose.addEventListener('click', closeMenu);
    sidebarOverlay.addEventListener('click', closeMenu);
  }

  /* ==========================================================================
     Search Bar Matching & Filter Engine
     ========================================================================== */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let searchDebounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      const query = e.target.value.trim();
      AppState.searchQuery = query;

      searchDebounceTimer = setTimeout(() => {
        if (AppState.currentView === 'shop' || query.length > 0) {
          AppState.currentPage = 1;
          renderProductListingView();
        } else {
          renderView('home');
        }
      }, 300);
    });
  }

  /* ==========================================================================
     Sidebar Navigation Router Handler
     ========================================================================== */
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetNav = item.getAttribute('data-nav');

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      if (sidebar && sidebar.classList.contains('active') && sidebarClose) {
        sidebarClose.click();
      }

      renderView(targetNav);
    });
  });

  // Initial bindings for static elements on initial DOM load
  loadFiltersFromURL();
  bindProductCardListeners();
  bindGlobalNavigationEvents();

});


