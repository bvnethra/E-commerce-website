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
    searchQuery: ''
  };

  // Simulated Async API Service with Network Latency
  const ApiService = {
    fetchViewData(viewName, overrideState) {
      const stateToUse = overrideState || AppState.simulatedState;

      return new Promise((resolve, reject) => {
        // Simulating API Network Delay (800ms)
        setTimeout(() => {
          if (stateToUse === 'error') {
            reject(new Error('Unable to connect to Hype API servers. Please check your network connection and try again.'));
          } else if (stateToUse === 'loading') {
            resolve({ state: 'loading' });
          } else if (stateToUse === 'empty') {
            resolve({ state: 'empty', data: [] });
          } else {
            resolve({ state: 'success', data: ApiService.getMockData(viewName) });
          }
        }, 800);
      });
    },

    getMockData(viewName) {
      const mockDb = {
        products: [
          { id: 1, name: 'Noise Ultra 2 Max', cat: 'Smart Watch', price: '₹4,999', originalPrice: '₹6,999', badge: '-20%', img: 'assets/images/prod_watch.png' },
          { id: 2, name: 'Boat Airdopes 181', cat: 'Earbuds', price: '₹1,299', originalPrice: '₹1,999', badge: 'HOT', img: 'assets/images/prod_earbuds.png' },
          { id: 3, name: 'Canon EOS M50 Mark II', cat: 'Camera', price: '₹54,990', originalPrice: '₹59,999', badge: '-8%', img: 'assets/images/prod_camera.png' },
          { id: 4, name: 'Urban Explorer Pro', cat: 'Backpack', price: '₹2,999', originalPrice: '₹3,999', badge: '-25%', img: 'assets/images/prod_backpack.png' }
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
      const presets = {
        // Home Module
        'home-products': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
          title: 'No Featured Products Available',
          desc: 'Featured items are currently being updated. Check back soon for fresh arrivals and recommendations.',
          primaryAction: 'Explore Full Catalog',
          primaryNav: 'shop'
        },
        'home-categories': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
          title: 'No Categories Available',
          desc: 'Categories are being reorganized. Browse all products directly in our main catalog.',
          primaryAction: 'Browse Products',
          primaryNav: 'shop'
        },
        'home-offers': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
          title: 'No Offers Active Right Now',
          desc: 'There are no seasonal promo campaigns running at this moment. Stay tuned for upcoming flash sales!',
          primaryAction: 'Shop Standard Catalog',
          primaryNav: 'shop'
        },

        // Product Listing / Shop
        'products': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
          title: 'No Products Found',
          desc: 'We couldn\'t find any products matching your selection. Try clearing search keywords or filter options.',
          primaryAction: 'Explore All Products',
          primaryNav: 'shop',
          secondaryAction: 'Clear Filters'
        },
        'category-products': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
          title: 'No Products in Category',
          desc: 'This department currently has no listed products. Explore another department or browse the entire catalog.',
          primaryAction: 'Browse Categories',
          primaryNav: 'categories',
          secondaryAction: 'All Products',
          secondaryNav: 'shop'
        },
        'filter': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
          title: 'Filter Returned No Results',
          desc: 'No products matched your exact filter parameters. Try widening price range or category filters.',
          primaryAction: 'Clear Filters',
          primaryNav: 'shop'
        },

        // Search
        'search': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
          title: 'No Search Results',
          desc: 'We couldn\'t find any matches for your query. Try checking for typos or searching for keywords like "Watch", "Earbuds", or "Camera".',
          primaryAction: 'Try Another Keyword',
          primaryNav: 'shop',
          secondaryAction: 'Browse Categories',
          secondaryNav: 'categories'
        },

        // Shopping Cart
        'cart': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
          title: 'Your Cart is Empty',
          desc: 'Looks like you haven\'t added any items to your shopping cart yet. Discover trending style & electronics in our catalog.',
          primaryAction: 'Continue Shopping',
          primaryNav: 'shop',
          secondaryAction: 'Browse Products',
          secondaryNav: 'shop'
        },

        // Wishlist
        'wishlist': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
          title: 'Your Wishlist is Empty',
          desc: 'Save your favorite items here to track price drops and order whenever you\'re ready.',
          primaryAction: 'Browse Products',
          primaryNav: 'shop'
        },

        // Orders
        'orders': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
          title: 'No Orders Yet',
          desc: 'You haven\'t placed any orders with Hype. yet. When you place orders, track shipments and invoice history here.',
          primaryAction: 'Start Shopping',
          primaryNav: 'shop'
        },

        // Reviews
        'reviews': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
          title: 'No Reviews Yet',
          desc: 'Be the first customer to share feedback and review products in this section.',
          primaryAction: 'Browse Catalog',
          primaryNav: 'shop'
        },

        // Notifications
        'notifications': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
          title: 'No Notifications',
          desc: 'You\'re all caught up! We will notify you here when order status, price drops, or promos arrive.',
          primaryAction: 'Back to Home',
          primaryNav: 'home'
        },

        // Addresses
        'addresses': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
          title: 'No Saved Addresses',
          desc: 'Save your delivery addresses for faster checkout during future purchases.',
          primaryAction: 'Add Shipping Address',
          primaryNav: 'profile'
        },

        // Coupons
        'coupons': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><line x1="16" y1="21" x2="16" y2="7"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>`,
          title: 'No Coupons Available',
          desc: 'There are currently no active discount coupons applied to your account.',
          primaryAction: 'Continue Shopping',
          primaryNav: 'shop'
        },

        // Related Products & Recently Viewed
        'related': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
          title: 'No Related Products',
          desc: 'No complementary products were found for this item.',
          primaryAction: 'View All Products',
          primaryNav: 'shop'
        },
        'recent': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
          title: 'No Recently Viewed Products',
          desc: 'Products you view while browsing will appear here for easy quick access.',
          primaryAction: 'Start Browsing',
          primaryNav: 'shop'
        },

        // Dashboard & Reports
        'dashboard': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
          title: 'No Analytics Data',
          desc: 'Analytics data is being calculated for the current period.',
          primaryAction: 'Return Home',
          primaryNav: 'home'
        },
        'reports': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
          title: 'No Report Data',
          desc: 'There are no exportable reports generated for this timeframe.',
          primaryAction: 'Return Home',
          primaryNav: 'home'
        },

        // Admin Management
        'admin-products': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
          title: 'No Products in Inventory',
          desc: 'The product catalog database is currently empty. Add products via admin panel.',
          primaryAction: 'Add Product'
        },
        'admin-categories': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
          title: 'No Categories in Inventory',
          desc: 'No product departments or categories have been created.',
          primaryAction: 'Add Category'
        },

        'default': {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`,
          title: 'No Content Available',
          desc: 'There are currently no items or records to display in this view.',
          primaryAction: 'Return to Homepage',
          primaryNav: 'home'
        }
      };

      const base = presets[type] || presets.default;
      const config = { ...base, ...customProps };

      return `
        <div class="empty-state-card" role="region" aria-label="${config.title}">
          <div class="empty-state-illustration">
            ${config.icon}
          </div>
          <h3 class="empty-state-title">${config.title}</h3>
          <p class="empty-state-desc">${config.desc}</p>
          <div class="empty-state-actions">
            ${config.primaryAction ? `
              <button class="btn-primary-action" data-nav-target="${config.primaryNav || 'home'}">
                <span>${config.primaryAction}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            ` : ''}
            ${config.secondaryAction ? `
              <button class="btn-secondary-action" data-nav-target="${config.secondaryNav || 'shop'}">${config.secondaryAction}</button>
            ` : ''}
          </div>
        </div>
      `;
    }
  };

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
          <button class="btn-secondary-action" id="404-go-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; margin-right: 4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Go Back
          </button>
        </div>
      </div>
    `;

    // Bind 404 page search bar submit
    const searchInput = document.getElementById('error-404-search-input');
    const searchSubmit = document.getElementById('error-404-search-submit');
    if (searchInput && searchSubmit) {
      const handle404Search = () => {
        const query = searchInput.value.trim();
        if (query) {
          const globalSearch = document.getElementById('search-input');
          if (globalSearch) globalSearch.value = query;
          renderView('shop');
        }
      };
      searchSubmit.addEventListener('click', handle404Search);
      searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handle404Search(); });
    }

    // Bind 404 Go Back button
    const goBackBtn = document.getElementById('404-go-back-btn');
    if (goBackBtn) {
      goBackBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          renderView('home');
        }
      });
    }

    bindActionEvents();
  }

  /* ==========================================================================
     Product Not Found View (Part 2)
     ========================================================================== */
  function renderProductNotFoundView(productId) {
    if (!viewContainer) return;

    const mockSuggested = ApiService.getMockData('products');

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
          <button class="btn-secondary-action" id="prod-not-found-back">Go Back</button>
        </div>
      </div>

      <!-- Suggested Products Section -->
      <div class="suggested-products-section">
        <div class="view-section-header">
          <h3 class="view-title" style="font-size: 1.4rem;">Suggested Products for You</h3>
        </div>
        <div class="products-grid">
          ${mockSuggested.map(p => `
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
      </div>
    `;

    const backBtn = document.getElementById('prod-not-found-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (window.history.length > 1) window.history.back();
        else renderView('shop');
      });
    }

    bindProductCardListeners();
    bindActionEvents();
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
          <button class="btn-secondary-action" data-nav-target="shop">Continue Shopping</button>
        </div>
      </div>
    `;

    bindActionEvents();
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
      case 'search':
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
      case 'categories':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div><h2 class="view-title">All Categories</h2></div>
          </div>
          ${Skeletons.categories(6)}
        `;
        break;
      case 'orders':
      case 'management':
        viewContainer.innerHTML = `
          <div class="view-section-header">
            <div><h2 class="view-title">${viewName === 'orders' ? 'Your Orders' : 'Store Management'}</h2></div>
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

  function renderEmptyView(viewName) {
    if (!viewContainer) return;
    let emptyType = 'default';
    if (viewName === 'shop' || viewName === 'search') emptyType = 'products';
    else if (viewName === 'cart') emptyType = 'cart';
    else if (viewName === 'wishlist') emptyType = 'wishlist';
    else if (viewName === 'orders') emptyType = 'orders';
    else if (viewName === 'notifications') emptyType = 'notifications';
    else if (viewName === 'reviews') emptyType = 'reviews';

    viewContainer.innerHTML = EmptyStates.get(emptyType);
    bindActionEvents();
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
    bindActionEvents();
  }

  function renderSuccessView(viewName, data) {
    if (!viewContainer) return;
    
    if (viewName === 'home') {
      viewContainer.innerHTML = defaultHomeHtml;
      bindProductCardListeners();
      return;
    }

    let contentHtml = '';

    if (viewName === 'shop' || viewName === 'wishlist') {
      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">${viewName === 'shop' ? 'Shop Catalog' : 'Saved Wishlist'}</h2>
            <p class="view-subtitle">Showing ${data.length} premium items</p>
          </div>
        </div>
        <div class="products-grid">
          ${data.map(p => `
            <div class="product-card" data-product-id="${p.id}">
              <div class="product-card-top">
                <span class="discount-badge">${p.badge}</span>
                <button class="wishlist-btn ${viewName === 'wishlist' ? 'active' : ''}" aria-label="Add to wishlist">
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
    bindActionEvents();
  }

  function bindActionEvents() {
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-nav-target');
        const navItem = document.querySelector(`.nav-item[data-nav="${target}"]`);
        if (navItem) navItem.click();
        else renderView(target);
      });
    });
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
     Add to Cart & Wishlist Button Listeners
     ========================================================================== */
  function bindProductCardListeners() {
    const cartBadge = document.getElementById('cart-badge');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (button.classList.contains('added')) return;
        
        AppState.cartCount++;
        if (cartBadge) {
          cartBadge.textContent = AppState.cartCount;
          cartBadge.style.animation = 'none';
          void cartBadge.offsetWidth;
          cartBadge.style.animation = 'popBadge 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards';
        }

        button.classList.add('added');
        const originalIcon = button.innerHTML;
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;

        setTimeout(() => {
          button.classList.remove('added');
          button.innerHTML = originalIcon;
        }, 1500);
      });
    });

    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(button => {
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
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      AppState.searchQuery = query;

      if (query !== '') {
        const productCards = document.querySelectorAll('.products-grid .product-card');
        if (productCards.length > 0) {
          let matchCount = 0;
          productCards.forEach(card => {
            const nameEl = card.querySelector('.product-name');
            const catEl = card.querySelector('.product-cat');
            if (nameEl && catEl) {
              const name = nameEl.textContent.toLowerCase();
              const cat = catEl.textContent.toLowerCase();
              if (name.includes(query) || cat.includes(query)) {
                card.style.display = 'flex';
                matchCount++;
              } else {
                card.style.display = 'none';
              }
            }
          });

          if (matchCount === 0) {
            renderEmptyView('search');
          }
        } else {
          renderView('search');
        }
      } else {
        if (AppState.currentView === 'home') {
          renderView('home');
        }
      }
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

  // Initialize view router with default home view
  bindProductCardListeners();

});

