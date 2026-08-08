document.addEventListener('DOMContentLoaded', () => {

  // Force purge legacy cached products in localStorage to guarantee 100% synchronized images
  if (localStorage.getItem('shopsphere_db_version') !== 'v30') {
    localStorage.removeItem('shopsphere_products');
    localStorage.removeItem('shopsphere_categories');
    localStorage.setItem('shopsphere_db_version', 'v30');
  }

  /* ==========================================================================
     Helper Star Rating Persistence Functions
     ========================================================================== */
  window.getSavedProductRating = function (userId, productId) {
    try {
      const ratings = JSON.parse(localStorage.getItem('shopsphere_product_ratings') || '{}');
      return ratings[`${userId}_${productId}`] || 0;
    } catch (e) {
      return 0;
    }
  };

  window.saveProductRating = function (userId, productId, rating) {
    try {
      const ratings = JSON.parse(localStorage.getItem('shopsphere_product_ratings') || '{}');
      ratings[`${userId}_${productId}`] = rating;
      localStorage.setItem('shopsphere_product_ratings', JSON.stringify(ratings));
      updateCatalogProductAverageRating(productId);
    } catch (e) { }
  };

  function updateCatalogProductAverageRating(productId) {
    try {
      const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
      const ratings = JSON.parse(localStorage.getItem('shopsphere_product_ratings') || '{}');

      const productRatings = [];
      for (const key in ratings) {
        if (key.endsWith(`_${productId}`)) {
          productRatings.push(ratings[key]);
        }
      }

      if (productRatings.length > 0) {
        const sum = productRatings.reduce((a, b) => a + b, 0);
        const avg = parseFloat((sum / productRatings.length).toFixed(1));

        const index = products.findIndex(p => String(p.id) === String(productId));
        if (index !== -1) {
          products[index].rating = avg;
          products[index].reviewCount = (products[index].reviewCount || 0) + 1;
          localStorage.setItem('shopsphere_products', JSON.stringify(products));
        }
      }
    } catch (e) { }
  }

  /* ==========================================================================
     Application Global State & API Service
     ========================================================================== */
  /* ==========================================================================
     Application Global State & API Service
     ========================================================================== */
  const AppState = {
    currentView: 'home',
    simulatedState: 'normal', // 'normal', 'loading', 'empty', 'error'
    cartCount: 0,
    wishlistCount: 0,
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
    notifications: [],
    unreadNotificationCount: 0,
    notificationFilter: 'all',
    notificationSearchQuery: '',
    selectedNotificationIds: new Set(),
    user: null,
    pendingAction: null,
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

  /* ==========================================================================
     Flipkart-Inspired Authentication & Route/Action Protection Engine
     ========================================================================== */
  const AuthService = {
    getUser() {
      try {
        const u = localStorage.getItem('aura_user');
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },

    getToken() {
      return localStorage.getItem('aura_jwt_token') || null;
    },

    isAuthenticated() {
      return !!(this.getToken() && this.getUser());
    },

    generateMockJwt(user) {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        sub: user.id || "usr_1001",
        name: user.name,
        email: user.email,
        phone: user.phone || "9876543210",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 3600)
      }));
      const signature = btoa("aura_jwt_secret_" + Math.random().toString(36).substring(2, 9));
      return `${header}.${payload}.${signature}`;
    },

    login(identifier, passwordOrOtp, isOtp = false) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (isOtp && passwordOrOtp !== '1234') {
            return reject(new Error('Invalid OTP code. Please enter 1234 for demo.'));
          }

          let nameStr = identifier.includes('@') ? identifier.split('@')[0] : 'User';
          nameStr = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);

          const user = {
            id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
            name: nameStr,
            email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
            phone: !identifier.includes('@') ? identifier : '9876543210',
            role: (identifier.toLowerCase() === 'admin_ss' || identifier.toLowerCase() === 'admin_ss@shopsphere.com') ? 'ADMIN' : 'CUSTOMER'
          };

          // Save to user registry
          try {
            const registeredUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
            const exists = registeredUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase());
            if (!exists) {
              registeredUsers.push(user);
              localStorage.setItem('aura_registered_users', JSON.stringify(registeredUsers));
            }
          } catch (e) { }

          const token = this.generateMockJwt(user);
          localStorage.setItem('aura_jwt_token', token);
          localStorage.setItem('aura_user', JSON.stringify(user));
          AppState.user = user;

          updateHeaderAuthState();
          resolve(user);
        }, 600);
      });
    },

    signup(name, email, mobile, password) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!name || !email || !mobile || !password) {
            return reject(new Error('All fields are required.'));
          }
          if (password.length < 6) {
            return reject(new Error('Password must be at least 6 characters.'));
          }

          const user = {
            id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
            name: name.trim(),
            email: email.trim(),
            phone: mobile.trim(),
            role: (email.toLowerCase() === 'admin_ss@shopsphere.com' || name.toLowerCase() === 'admin_ss') ? 'ADMIN' : 'CUSTOMER'
          };

          // Save to user registry
          try {
            const registeredUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
            const exists = registeredUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase());
            if (!exists) {
              registeredUsers.push(user);
              localStorage.setItem('aura_registered_users', JSON.stringify(registeredUsers));
            }
          } catch (e) { }

          const token = this.generateMockJwt(user);
          localStorage.setItem('aura_jwt_token', token);
          localStorage.setItem('aura_user', JSON.stringify(user));
          AppState.user = user;

          updateHeaderAuthState();
          resolve(user);
        }, 600);
      });
    },

    googleLogin() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const user = {
            id: 'usr_goog_' + Math.floor(1000 + Math.random() * 9000),
            name: 'Alex Hype',
            email: 'alex.hype@gmail.com',
            phone: '+91 98765 43210'
          };

          const token = this.generateMockJwt(user);
          localStorage.setItem('aura_jwt_token', token);
          localStorage.setItem('aura_user', JSON.stringify(user));
          AppState.user = user;

          updateHeaderAuthState();
          resolve(user);
        }, 600);
      });
    },

    updateProfile(data) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const current = this.getUser() || {};
          const updated = { ...current, ...data };
          localStorage.setItem('aura_user', JSON.stringify(updated));
          AppState.user = updated;

          try {
            const registeredUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
            const idx = registeredUsers.findIndex(u => (u.id && u.id === current.id) || (u.email && u.email.toLowerCase() === current.email?.toLowerCase()));
            if (idx !== -1) {
              registeredUsers[idx] = { ...registeredUsers[idx], ...updated };
            } else {
              registeredUsers.push(updated);
            }
            localStorage.setItem('aura_registered_users', JSON.stringify(registeredUsers));
          } catch (e) { }

          updateHeaderAuthState();
          resolve(updated);
        }, 400);
      });
    },

    updatePassword(currentPassword, newPassword) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!newPassword || newPassword.length < 6) {
            return reject(new Error('New password must be at least 6 characters.'));
          }
          const current = this.getUser() || {};
          current.passwordLastChanged = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          localStorage.setItem('aura_user', JSON.stringify(current));
          AppState.user = current;
          resolve(true);
        }, 400);
      });
    },

    deleteAccount(confirmPhrase) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if ((confirmPhrase || '').trim().toUpperCase() !== 'DELETE') {
            return reject(new Error('Please type DELETE to confirm account deletion.'));
          }
          const current = this.getUser();
          if (current) {
            try {
              let registeredUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
              registeredUsers = registeredUsers.filter(u => u.email.toLowerCase() !== current.email.toLowerCase());
              localStorage.setItem('aura_registered_users', JSON.stringify(registeredUsers));
            } catch (e) { }
          }
          this.logout();
          resolve(true);
        }, 500);
      });
    },

    logout() {
      localStorage.removeItem('aura_jwt_token');
      localStorage.removeItem('aura_user');
      AppState.user = null;
      updateHeaderAuthState();
      showToast('Logged out successfully', 'info');
      if (['profile', 'orders', 'checkout'].includes(AppState.currentView)) {
        renderView('home');
      }
    }
  };

  // Initialize Auth User
  AppState.user = AuthService.getUser();

  // Sync the active user to registered users database on load
  try {
    const active = AppState.user;
    if (active) {
      const registeredUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
      const exists = registeredUsers.some(u => u.email.toLowerCase() === active.email.toLowerCase());
      if (!exists) {
        registeredUsers.push(active);
        localStorage.setItem('aura_registered_users', JSON.stringify(registeredUsers));
      }
    }
  } catch (e) { }

  /* ==========================================================================
     Saved Order Management Service
     ========================================================================== */
  /* ==========================================================================
     Saved Wishlist Management Service
     ========================================================================== */
  const WishlistService = {
    getWishlistKey() {
      const u = AuthService.getUser();
      return u ? `shopsphere_wishlist_${u.id}` : 'shopsphere_wishlist_guest';
    },
    getAll() {
      try {
        const stored = localStorage.getItem(this.getWishlistKey());
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    },
    toggle(productId) {
      const items = this.getAll();
      const index = items.indexOf(productId);
      let active = false;
      if (index !== -1) {
        items.splice(index, 1);
      } else {
        items.push(productId);
        active = true;
      }
      localStorage.setItem(this.getWishlistKey(), JSON.stringify(items));
      return active;
    },
    has(productId) {
      return this.getAll().includes(productId);
    }
  };

  /* ==========================================================================
     Saved Order Management Service
     ========================================================================== */
  const OrderService = {
    getAll() {
      try {
        const stored = localStorage.getItem('shopsphere_orders');
        const allOrders = stored ? JSON.parse(stored) : [];
        const currentUser = AuthService.getUser();
        if (currentUser) {
          // Storefront shows only the logged-in customer's orders
          return allOrders.filter(o => o.userId === currentUser.id || o.userEmail === currentUser.email);
        }
        return [];
      } catch (e) {
        return [];
      }
    },
    add(order) {
      try {
        const stored = localStorage.getItem('shopsphere_orders');
        const orders = stored ? JSON.parse(stored) : [];
        orders.unshift(order);
        localStorage.setItem('shopsphere_orders', JSON.stringify(orders));
        return order;
      } catch (e) {
        return order;
      }
    }
  };

  /* ==========================================================================
     Saved Address Management Service
     ========================================================================== */
  const AddressService = {
    init() {
      if (!localStorage.getItem('aura_addresses')) {
        const defaultAddr = [
          {
            id: 'addr_1',
            name: AppState.user?.name || 'Vishal',
            phone: AppState.user?.phone || '8120089832',
            pincode: '560001',
            addressLine: 'Flat 402, Skyline Residency, MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            type: 'Home',
            isDefault: true
          }
        ];
        localStorage.setItem('aura_addresses', JSON.stringify(defaultAddr));
      }
      this.updateHeaderLocation();
    },

    getAll() {
      try {
        return JSON.parse(localStorage.getItem('aura_addresses')) || [];
      } catch (e) {
        return [];
      }
    },

    getDefault() {
      const addrs = this.getAll();
      return addrs.find(a => a.isDefault) || addrs[0] || null;
    },

    save(addresses) {
      localStorage.setItem('aura_addresses', JSON.stringify(addresses));
      this.updateHeaderLocation();

      // Update UI if profile page is currently open
      const profileText = document.getElementById('profile-saved-address-text');
      if (profileText) {
        const def = this.getDefault();
        profileText.textContent = def
          ? `${def.addressLine}, ${def.city}, ${def.state} - ${def.pincode}`
          : 'No address saved yet.';
      }
    },

    add(addr) {
      const addrs = this.getAll();
      const newAddr = {
        id: 'addr_' + Date.now(),
        ...addr,
        isDefault: addr.isDefault || addrs.length === 0
      };

      if (newAddr.isDefault) {
        addrs.forEach(a => a.isDefault = false);
      }

      addrs.push(newAddr);
      this.save(addrs);
      return newAddr;
    },

    update(id, updatedFields) {
      const addrs = this.getAll();
      const idx = addrs.findIndex(a => a.id === id);
      if (idx !== -1) {
        if (updatedFields.isDefault) {
          addrs.forEach(a => a.isDefault = false);
        }
        addrs[idx] = { ...addrs[idx], ...updatedFields };
        this.save(addrs);
      }
    },

    delete(id) {
      let addrs = this.getAll();
      const toDelete = addrs.find(a => a.id === id);
      addrs = addrs.filter(a => a.id !== id);

      if (toDelete && toDelete.isDefault && addrs.length > 0) {
        addrs[0].isDefault = true;
      }

      this.save(addrs);
    },

    setDefault(id) {
      const addrs = this.getAll();
      addrs.forEach(a => {
        a.isDefault = (a.id === id);
      });
      this.save(addrs);
    },

    updateHeaderLocation() {
      const currentLocationLabel = document.getElementById('current-location');
      if (currentLocationLabel) {
        const def = this.getDefault();
        if (def) {
          currentLocationLabel.textContent = `${def.city} - ${def.pincode}`;
        } else {
          currentLocationLabel.textContent = 'India';
        }
      }
    }
  };

  // Initialize Address Service
  AddressService.init();

  function initAddressModal() {
    const overlay = document.getElementById('address-modal-overlay');
    const closeBtn = document.getElementById('address-modal-close');
    const addTrigger = document.getElementById('add-new-address-trigger');
    const form = document.getElementById('address-form');
    const formCancel = document.getElementById('address-form-cancel');
    const listContainer = document.getElementById('address-list-container');

    if (!overlay) return;

    // Open Modal function
    window.openAddressModal = function () {
      overlay.classList.remove('hidden');
      renderAddressList();
      form.reset();
      form.style.display = 'none';
      addTrigger.style.display = 'block';
      document.getElementById('address-edit-id').value = '';
      document.getElementById('address-form-title').textContent = 'Add New Address';
    };

    // Close Modal function
    window.closeAddressModal = function () {
      overlay.classList.add('hidden');
    };

    closeBtn.addEventListener('click', window.closeAddressModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) window.closeAddressModal();
    });

    addTrigger.addEventListener('click', () => {
      addTrigger.style.display = 'none';
      form.style.display = 'flex';
      form.reset();
      document.getElementById('address-edit-id').value = '';
      document.getElementById('address-form-title').textContent = 'Add New Address';
    });

    formCancel.addEventListener('click', () => {
      form.reset();
      form.style.display = 'none';
      addTrigger.style.display = 'block';
    });

    // Handle Form Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('address-edit-id').value;
      const name = document.getElementById('address-name').value.trim();
      const phone = document.getElementById('address-phone').value.trim();
      const pincode = document.getElementById('address-pincode').value.trim();
      const addressLine = document.getElementById('address-line').value.trim();
      const city = document.getElementById('address-city').value.trim();
      const state = document.getElementById('address-state').value.trim();
      const type = form.elements['address-type'].value;
      const isDefault = document.getElementById('address-default').checked;

      const addrData = { name, phone, pincode, addressLine, city, state, type, isDefault };

      if (id) {
        AddressService.update(id, addrData);
        showToast('Address updated successfully', 'success');
      } else {
        AddressService.add(addrData);
        showToast('Address added successfully', 'success');
      }

      form.reset();
      form.style.display = 'none';
      addTrigger.style.display = 'block';
      renderAddressList();
    });

    // Render list
    function renderAddressList() {
      const addrs = AddressService.getAll();
      listContainer.innerHTML = '';

      if (addrs.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.88rem; margin: 20px 0;" data-i18n="no_addresses_found">No saved addresses found. Add one above!</p>';
        return;
      }

      addrs.forEach(addr => {
        const card = document.createElement('div');
        card.className = `address-card ${addr.isDefault ? 'default-address' : ''}`;

        card.innerHTML = `
          <div class="address-card-header">
            <span class="address-badge ${addr.isDefault ? 'default' : ''}">
              <span data-i18n="address_type_${addr.type.toLowerCase()}">${addr.type}</span>${addr.isDefault ? ' <span data-i18n="default_label">(Default)</span>' : ''}
            </span>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-accent); cursor: pointer;" class="address-set-default-btn" data-id="${addr.id}">
              ${addr.isDefault ? '' : '<span data-i18n="set_as_default">Set as Default</span>'}
            </div>
          </div>
          <div style="margin-top: 4px;">
            <span class="address-card-name" style="font-weight: 700;">${addr.name}</span>
            <span class="address-card-phone" style="margin-left: 8px;">${addr.phone}</span>
          </div>
          <div class="address-card-details" style="margin-top: 4px;">
            ${addr.addressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}
          </div>
          <div class="address-card-actions">
            <button class="address-action-btn edit" data-id="${addr.id}" data-i18n="edit">Edit</button>
            <button class="address-action-btn delete" data-id="${addr.id}" data-i18n="delete" style="color: #ef4444;">Delete</button>
          </div>
        `;

        // Bind events
        card.querySelector('.edit').addEventListener('click', () => {
          document.getElementById('address-edit-id').value = addr.id;
          document.getElementById('address-name').value = addr.name;
          document.getElementById('address-phone').value = addr.phone;
          document.getElementById('address-pincode').value = addr.pincode;
          document.getElementById('address-line').value = addr.addressLine;
          document.getElementById('address-city').value = addr.city;
          document.getElementById('address-state').value = addr.state;
          form.elements['address-type'].value = addr.type;
          document.getElementById('address-default').checked = addr.isDefault;

          document.getElementById('address-form-title').textContent = 'Edit Address';
          addTrigger.style.display = 'none';
          form.style.display = 'flex';
          form.scrollIntoView({ behavior: 'smooth' });
        });

        card.querySelector('.delete').addEventListener('click', () => {
          const deleteOverlay = document.getElementById('addr-delete-modal-overlay');
          const cancelBtn = document.getElementById('addr-delete-cancel-btn');
          const confirmBtn = document.getElementById('addr-delete-confirm-btn');

          if (deleteOverlay && cancelBtn && confirmBtn) {
            deleteOverlay.classList.remove('hidden');

            const closeDeleteModal = () => {
              deleteOverlay.classList.add('hidden');
              // Clone nodes to purge all dynamic event listeners and prevent action stacking
              const newConfirm = confirmBtn.cloneNode(true);
              confirmBtn.replaceWith(newConfirm);
              const newCancel = cancelBtn.cloneNode(true);
              cancelBtn.replaceWith(newCancel);
            };

            cancelBtn.addEventListener('click', closeDeleteModal);
            confirmBtn.addEventListener('click', () => {
              AddressService.delete(addr.id);
              showToast('Address deleted successfully', 'info');
              closeDeleteModal();
              renderAddressList();
            });
          }
        });

        const setDefaultBtn = card.querySelector('.address-set-default-btn');
        if (setDefaultBtn && !addr.isDefault) {
          setDefaultBtn.addEventListener('click', () => {
            AddressService.setDefault(addr.id);
            showToast('Default address changed', 'success');
            renderAddressList();
          });
        }

        if (AppState.currentView === 'checkout') {
          card.style.cursor = 'pointer';
          card.addEventListener('click', (e) => {
            if (e.target.closest('.address-action-btn') || e.target.closest('.address-set-default-btn')) {
              return;
            }
            AddressService.setDefault(addr.id);
            const overlay = document.getElementById('address-modal-overlay');
            if (overlay) overlay.classList.add('hidden');
            renderCheckoutView();
          });
        }

        listContainer.appendChild(card);
      });
      applyTranslations();
    }
  }

  // Initialize Address Modal triggers
  initAddressModal();

  /* ==========================================================================
     Translation & Localization Engine (i18n)
     ========================================================================== */
  const TRANSLATIONS = {
    en: {
      // Sidebar & Navigation
      home: "Home",
      shop: "Shop",
      categories: "Categories",
      wishlist: "Wishlist",
      orders: "Orders",
      profile: "Profile",
      // Header
      search_placeholder: "Search for products, brands and more...",
      deliver_to: "Deliver to",
      login: "Login",
      logout: "Logout",
      my_profile: "My Profile",
      addresses: "Addresses",
      // Shop Page Filters
      filters: "Filters",
      brand: "Brand",
      category: "Category",
      price_range: "Price Range",
      customer_rating: "Customer Rating",
      reset_filters: "Reset Filters",
      sort_by: "Sort by",
      sort_relevance: "Relevance",
      sort_low_high: "Price: Low to High",
      sort_high_low: "Price: High to Low",
      sort_rating: "Rating",
      add_to_cart: "Add to Cart",
      added_to_cart: "Added to Cart",
      out_of_stock: "Out of Stock",
      ratings_count: "ratings",
      // Empty States
      cart_empty: "Your Cart is Empty",
      cart_empty_desc: "Add items to it now to shop.",
      wishlist_empty: "Your Wishlist is Empty",
      wishlist_empty_desc: "Explore products and add your favorites.",
      orders_empty: "No Orders Yet",
      orders_empty_desc: "You have not placed any orders yet.",
      shop_now: "Shop Now",
      explore_products: "Explore Products",
      // Cart View
      shopping_cart: "Shopping Cart",
      order_summary: "Order Summary",
      price_items: "Price",
      delivery_charges: "Delivery Charges",
      free: "Free",
      total_amount: "Total Amount",
      place_order: "Place Order",
      // Wishlist View
      my_wishlist: "My Wishlist",
      remove: "Remove",
      move_to_cart: "Move to Cart",
      // Orders View
      my_orders: "My Orders",
      order_id: "Order ID",
      order_date: "Date",
      order_status: "Status",
      order_total_paid: "Total Paid",
      track_order: "Track Order",
      // Profile View
      user_profile: "User Profile",
      profile_sub: "Manage personal information & delivery addresses",
      verified_account: "Verified Account",
      jwt_auth: "JWT Authenticated",
      saved_address: "Saved Address",
      manage_addresses: "Manage Addresses",
      log_out: "Log Out",
      // Address Modal
      manage_delivery_addresses: "Manage Delivery Addresses",
      add_new_address: "Add New Address",
      edit_address: "Edit Address",
      placeholder_fullname: "Full Name",
      placeholder_mobile: "Mobile Number (10 digits)",
      placeholder_pincode: "Pincode",
      placeholder_address: "Flat, House no., Building, MG Road",
      placeholder_city: "Town/City",
      placeholder_state: "State",
      address_type_home: "Home",
      address_type_work: "Work",
      set_default_address: "Set as Default Address",
      cancel: "Cancel",
      save_address: "Save Address",
      set_as_default: "Set as Default",
      delete: "Delete",
      // Confirm Delete Modal
      delete_address_title: "Delete Address?",
      delete_address_desc: "Are you sure you want to delete this address? This action cannot be undone.",
      // Settings Drawer
      display_language: "Display & Language",
      theme_mode: "Theme Mode",
      light_mode: "Light Mode",
      dark_mode: "Dark Mode",
      color_palette: "Color Palette",
      language_select: "Language / மொழி / भाषा",
      // Auth Modal
      style_moves_you: "Style That Moves You",
      welcome_perk: "WELCOME PERK",
      get_10_off: "GET 10% OFF",
      login_or_signup: "Login or Signup",
      enter_mobile_email: "Enter Mobile Number or Email",
      continue_btn: "Continue",
      verify_otp: "Verify Security OTP",
      enter_code: "Enter Code",
      verify_proceed: "Verify & Proceed",
      create_password: "Create Password",
      continue_signup: "Continue Signup",
      new_to_shopsphere: "New to ShopSphere?",
      create_account: "Create an account",
      agree_terms: "By continuing, you agree to ShopSphere's",
      terms_of_use: "Terms of Use",
      privacy_policy: "Privacy Policy",
      placeholder_email: "Email Address",
      enter_password: "Enter Password",
      existing_user: "Existing User?",
      and: "and",

      // Additional Homepage & Profile localization keys
      new_collection: "NEW COLLECTION",
      style_moves_you_html: "STYLE THAT<br>MOVES <span class=\"highlight-text\">YOU</span>",
      hero_description: "Discover everything you need to elevate your everyday.",
      shop_now_upper: "SHOP NOW",
      happy_customers: "Happy Customers",
      summer_sale: "Summer Sale",
      up_to: "UP TO",
      off: "OFF",
      all_categories: "All Categories",
      product_catalog: "Product Catalog",
      shop_products: "Shop Products",
      brands: "Brands",
      colors: "Colors",
      sizes: "Sizes",
      in_stock: "In Stock",
      availability: "Availability",
      sort_popularity: "Sort by: Popularity",
      sort_newest: "Sort by: Newest",
      sort_bestselling: "Best Selling",
      sort_discount: "Discount %",
      on_first_order: "on your first order",
      signup_btn: "SIGN UP",
      exclusive: "Exclusive",
      deals_only_for_you_html: "Deals Only<br><span class=\"deals-highlight\">For You</span>",
      grab_best_offers: "Grab the best offers before they're gone!",
      account_security: "Account Security",
      jwt_security_desc: "Session is protected with 256-bit encryption JWT tokens.",
      logout_session: "Logout Session",
      no_address_saved: "No address saved yet.",
      no_addresses_found: "No saved addresses found. Add one above!",
      default_label: "(Default)",
      edit: "Edit",

      // Service Footer items
      free_shipping: "Free Shipping",
      free_shipping_desc: "On orders above ₹999",
      easy_returns: "Easy Returns",
      easy_returns_desc: "30 days return policy",
      secure_payment: "Secure Payment",
      secure_payment_desc: "100% secure payment",
      support_247: "24/7 Support",
      support_247_desc: "Dedicated support",

      // Toasts & Alerts
      lang_updated: "Language updated",

      // Category titles
      category_men: "Men",
      category_women: "Women",
      category_electronics: "Electronics",
      category_shoes: "Shoes",
      category_accessories: "Accessories",
      category_kids_and_baby: "Kids & Baby",
      category_activewear: "Activewear",
      category_bags_and_luggage: "Bags & Luggage",
      category_jewelry: "Jewelry",
      category_sleepwear: "Sleepwear",
      category_home_decor: "Home Decor",
      category_kitchen_and_dining: "Kitchen & Dining",
      category_furniture: "Furniture",
      category_bedding_and_bath: "Bedding & Bath",
      category_lighting: "Lighting",
      category_beauty_and_skincare: "Beauty & Skincare",
      category_fragrances: "Fragrances",
      category_grooming: "Grooming",
      category_health_and_wellness: "Health & Wellness",
      category_gaming: "Gaming",
      category_audio: "Audio",
      category_smart_home: "Smart Home",
      category_office_and_stationery: "Office & Stationery",
      category_sports_and_fitness: "Sports & Fitness",
      category_outdoor_and_camping: "Outdoor & Camping",
      category_toys_and_games: "Toys & Games",
      category_pet_supplies: "Pet Supplies",

      // Subtitles
      subtitle_collection: "Collection",
      subtitle_gadgets: "Gadgets",
      subtitle_apparel_and_essentials: "Apparel & Essentials",
      subtitle_sportswear_and_gym: "Sportswear & Gym",
      subtitle_travel_and_daily: "Travel & Daily",
      subtitle_fine_and_fashion: "Fine & Fashion",
      subtitle_lounge_and_comfort: "Lounge & Comfort",
      subtitle_living_and_style: "Living & Style",
      subtitle_cookware_and_dining: "Cookware & Dining",
      subtitle_indoor_and_outdoor: "Indoor & Outdoor",
      subtitle_comfort_essentials: "Comfort Essentials",
      subtitle_lamps_and_ambiance: "Lamps & Ambiance",
      subtitle_self_care_and_glow: "Self-Care & Glow",
      subtitle_perfumes_and_scents: "Perfumes & Scents",
      subtitle_personal_care: "Personal Care",
      subtitle_vitamins_and_care: "Vitamins & Care",
      subtitle_consoles_and_gear: "Consoles & Gear",
      subtitle_speakers_and_sound: "Speakers & Sound",
      subtitle_automation_and_security: "Automation & Security",
      subtitle_desks_and_supplies: "Desks & Supplies",
      subtitle_training_equipment: "Training Equipment",
      subtitle_adventure_gear: "Adventure Gear",
      subtitle_play_and_collectibles: "Play & Collectibles",
      subtitle_food_and_accessories: "Food & Accessories"
    },
    ta: {
      // Sidebar & Navigation
      home: "முகப்பு",
      shop: "கடை",
      categories: "பிரிவுகள்",
      wishlist: "விருப்பப் பட்டியல்",
      orders: "ஆர்டர்கள்",
      profile: "சுயவிவரம்",
      // Header
      search_placeholder: "தயாரிப்புகள், பிராண்டுகள் மற்றும் பலவற்றைத் தேடுங்கள்...",
      deliver_to: "விநியோகிக்கவும்",
      login: "உள்நுழைக",
      logout: "வெளியேறு",
      my_profile: "எனது சுயவிவரம்",
      addresses: "முகவரிகள்",
      // Shop Page Filters
      filters: "வடிகட்டிகள்",
      brand: "பிராண்ட்",
      category: "பிரிவு",
      price_range: "விலை வரம்பு",
      customer_rating: "வாடிக்கையாளர் மதிப்பீடு",
      reset_filters: "வடிகட்டிகளை மீட்டமை",
      sort_by: "வரிசைப்படுத்து",
      sort_relevance: "பொருத்தம்",
      sort_low_high: "விலை: குறைந்ததிலிருந்து அதிகத்திற்கு",
      sort_high_low: "விலை: அதிகத்திலிருந்து குறைந்தத்திற்கு",
      sort_rating: "மதிப்பீடு",
      add_to_cart: "வண்டியில் சேர்",
      added_to_cart: "வண்டியில் சேர்க்கப்பட்டது",
      out_of_stock: "இருப்பு இல்லை",
      ratings_count: "மதிப்பீடுகள்",
      // Empty States
      cart_empty: "உங்களது கார்ட் காலியாக உள்ளது",
      cart_empty_desc: "ஷாப்பிங் செய்ய இப்போது பொருட்களைச் சேர்க்கவும்.",
      wishlist_empty: "உங்கள் விருப்பப் பட்டியல் காலியாக உள்ளது",
      wishlist_empty_desc: "தயாரிப்புகளை ஆராய்ந்து உங்களுக்கு பிடித்தவற்றை சேர்க்கவும்.",
      orders_empty: "இன்னும் ஆர்டர்கள் இல்லை",
      orders_empty_desc: "நீங்கள் இன்னும் எந்த ஆர்டரையும் செய்யவில்லை.",
      shop_now: "இப்போது வாங்குங்கள்",
      explore_products: "தயாரிப்புகளை ஆராயுங்கள்",
      // Cart View
      shopping_cart: "ஷாப்பிங் கார்ட்",
      order_summary: "ஆர்டர் சுருக்கம்",
      price_items: "விலை",
      delivery_charges: "டெலிவரி கட்டணம்",
      free: "இலவசம்",
      total_amount: "மொத்த தொகை",
      place_order: "ஆர்டர் செய்",
      // Wishlist View
      my_wishlist: "எனது விருப்பப் பட்டியல்",
      remove: "நீக்கு",
      move_to_cart: "கார்டிற்கு நகர்த்து",
      // Orders View
      my_orders: "எனது ஆர்டர்கள்",
      order_id: "ஆர்டர் ஐடி",
      order_date: "தேதி",
      order_status: "நிலை",
      order_total_paid: "செலுத்தப்பட்ட மொத்த தொகை",
      track_order: "ஆர்டரை டிராக் செய்",
      // Profile View
      user_profile: "சுயவிவரம்",
      profile_sub: "தனிப்பட்ட விவரங்கள் & முகவரிகளை நிர்வகிக்கவும்",
      verified_account: "சரிபார்க்கப்பட்ட கணக்கு",
      jwt_auth: "JWT அங்கீகரிக்கப்பட்டது",
      saved_address: "சேமிக்கப்பட்ட முகவரி",
      manage_addresses: "முகவரிகளை நிர்வகி",
      log_out: "வெளியேறு",
      // Address Modal
      manage_delivery_addresses: "டெலிவரி முகவரிகளை நிர்வகி",
      add_new_address: "புதிய முகவரியைச் சேர்",
      edit_address: "முகவரியைத் திருத்து",
      placeholder_fullname: "முழு பெயர்",
      placeholder_mobile: "அலைபேசி எண் (10 இலக்கங்கள்)",
      placeholder_pincode: "பின்கோடு",
      placeholder_address: "பிளாட், வீட்டு எண், கட்டிடம், எம்.ஜி சாலை",
      placeholder_city: "நகரம் / ஊர்",
      placeholder_state: "மாநிலம்",
      address_type_home: "வீடு",
      address_type_work: "அலுவலகம்",
      set_default_address: "இயல்புநிலை முகவரியாக அமை",
      cancel: "ரத்து செய்",
      save_address: "முகவரியைச் சேமி",
      set_as_default: "இயல்புநிலையாக அமை",
      delete: "நீக்கு",
      // Confirm Delete Modal
      delete_address_title: "முகவரியை நீக்கவா?",
      delete_address_desc: "நிச்சயமாக இந்த முகவரியை நீக்க வேண்டுமா? இந்த செயலை மாற்ற முடியாது.",
      // Settings Drawer
      display_language: "காட்சி மற்றும் மொழி",
      theme_mode: "தீம் முறை",
      light_mode: "ஒளி முறை",
      dark_mode: "இருண்ட முறை",
      color_palette: "வண்ண தட்டு",
      language_select: "Language / மொழி / भाषा",
      // Auth Modal
      style_moves_you: "உங்களை கவரும் ஸ்டைல்",
      welcome_perk: "வரவேற்பு சலுகை",
      get_10_off: "10% தள்ளுபடி பெறுங்கள்",
      login_or_signup: "உள்நுழைவு அல்லது பதிவு",
      enter_mobile_email: "அலைபேசி எண் அல்லது மின்னஞ்சலை உள்ளிடவும்",
      continue_btn: "தொடரவும்",
      verify_otp: "OTP சரிபார்ப்பு",
      enter_code: "குறியீட்டை உள்ளிடவும்",
      verify_proceed: "சரிபார்த்து தொடரவும்",
      create_password: "கடவுச்சொல்லை உருவாக்கவும்",
      continue_signup: "பதிவை தொடரவும்",
      new_to_shopsphere: "ShopSphere-க்கு புதியவரா?",
      create_account: "ஒரு கணக்கை உருவாக்குங்கள்",
      agree_terms: "தொடர்வதன் மூலம், நீங்கள் ஏற்றுக்கொள்கிறீர்கள்",
      terms_of_use: "பயன்பாட்டு விதிமுறைகள்",
      privacy_policy: "தனியுரிமைக் கொள்கை",
      placeholder_email: "மின்னஞ்சல் முகவரி",
      enter_password: "கடவுச்சொல்லை உள்ளிடவும்",
      existing_user: "ஏற்கனவே உள்ள பயனரா?",
      and: "மற்றும்",

      // Additional Homepage & Profile localization keys
      new_collection: "புதிய சேகரிப்பு",
      style_moves_you_html: "உங்களை<br>கவரும் <span class=\"highlight-text\">ஸ்டைல்</span>",
      hero_description: "உங்கள் அன்றாட வாழ்க்கையை மேம்படுத்த தேவையான அனைத்தையும் கண்டறியவும்.",
      shop_now_upper: "இப்போது வாங்குங்கள்",
      happy_customers: "மகிழ்ச்சியான வாடிக்கையாளர்கள்",
      summer_sale: "கோடைகால விற்பனை",
      up_to: "வரை",
      off: "தள்ளுபடி",
      all_categories: "அனைத்து பிரிவுகள்",
      product_catalog: "தயாரிப்பு பட்டியல்",
      shop_products: "தயாரிப்புகளை வாங்குங்கள்",
      brands: "பிராண்டுகள்",
      colors: "வண்ணங்கள்",
      sizes: "அளவுகள்",
      in_stock: "இருப்பில் உள்ளது",
      availability: "இருப்பு நிலை",
      sort_popularity: "வரிசைப்படுத்து: புகழ்",
      sort_newest: "வரிசைப்படுத்து: புதியது",
      sort_bestselling: "அதிக விற்பனையாகும்",
      sort_discount: "தள்ளுபடி %",
      on_first_order: "உங்களது முதல் ஆர்டரில்",
      signup_btn: "பதிவு செய்க",
      exclusive: "பிரத்தியேக",
      deals_only_for_you_html: "உங்களுக்கான<br><span class=\"deals-highlight\">பிரத்தியேக சலுகைகள்</span>",
      grab_best_offers: "சிறந்த சலுகைகள் முடிவதற்குள் அவற்றைப்பெறுங்கள்!",
      account_security: "கணக்கு பாதுகாப்பு",
      jwt_security_desc: "அமர்வு 256-பிட் குறியாக்க JWT டோக்கன்களுடன் பாதுகாக்கப்படுகிறது.",
      logout_session: "அமர்வை வெளியேறுக",
      no_address_saved: "இன்னும் முகவரி சேமிக்கப்படவில்லை.",
      no_addresses_found: "சேமிக்கப்பட்ட முகவரிகள் எதுவும் இல்லை. மேலே ஒன்றைச் சேர்க்கவும்!",
      default_label: "(இயல்புநிலை)",
      edit: "திருத்து",

      // Service Footer items
      free_shipping: "இலவச ஷிப்பிங்",
      free_shipping_desc: "₹999 க்கு மேல் ஆர்டர் செய்தால்",
      easy_returns: "எளிதான வருமானம்",
      easy_returns_desc: "30 நாட்கள் ரிட்டர்ன் பாலிசி",
      secure_payment: "பாதுகாப்பான கட்டணம்",
      secure_payment_desc: "100% பாதுகாப்பான பரிவர்த்தனை",
      support_247: "24/7 ஆதரவு",
      support_247_desc: "அர்ப்பணிக்கப்பட்ட ஆதரவு",

      // Toasts & Alerts
      lang_updated: "மொழி புதுப்பிக்கப்பட்டது",

      // Category titles
      category_men: "ஆண்கள்",
      category_women: "பெண்கள்",
      category_electronics: "மின்னணுவியல்",
      category_shoes: "காலணிகள்",
      category_accessories: "ஆபரணங்கள்",
      category_kids_and_baby: "குழந்தைகள் & பாப்பாக்கள்",
      category_activewear: "விளையாட்டு உடைகள்",
      category_bags_and_luggage: "பைகள் & லக்கேஜ்",
      category_jewelry: "நகைகள்",
      category_sleepwear: "இரவு உடைகள்",
      category_home_decor: "வீட்டு அலங்காரம்",
      category_kitchen_and_dining: "சமையலறை & உணவு",
      category_furniture: "தளபாடங்கள்",
      category_bedding_and_bath: "படுக்கை மற்றும் குளியல்",
      category_lighting: "விளக்குகள்",
      category_beauty_and_skincare: "அழகு & தோல் பராமரிப்பு",
      category_fragrances: "நறுமண திரவியங்கள்",
      category_grooming: "ஆட அலங்காரம்",
      category_health_and_wellness: "சுகாதாரம் & ஆரோக்கியம்",
      category_gaming: "கேமிங்",
      category_audio: "ஆடியோ",
      category_smart_home: "ஸ்மார்ட் ஹோம்",
      category_office_and_stationery: "அலுவலகம் & எழுதுபொருட்கள்",
      category_sports_and_fitness: "விளையாட்டு & உடற்பயிற்சி",
      category_outdoor_and_camping: "வெளிப்புறம் & முகாம்",
      category_toys_and_games: "பொம்மைகள் & விளையாட்டுகள்",
      category_pet_supplies: "செல்லப்பிராணி பொருட்கள்",

      // Subtitles
      subtitle_collection: "சேகரிப்பு",
      subtitle_gadgets: "சாதனங்கள்",
      subtitle_apparel_and_essentials: "உடைகள் & அத்தியாவசிய பொருட்கள்",
      subtitle_sportswear_and_gym: "விளையாட்டு உடைகள் & உடற்பயிற்சி கூடம்",
      subtitle_travel_and_daily: "பயணம் மற்றும் அன்றாட பயன்பாடு",
      subtitle_fine_and_fashion: "அழகிய மற்றும் பேஷன்",
      subtitle_lounge_and_comfort: "ஓய்வு & ஆறுதல்",
      subtitle_living_and_style: "வாழ்க்கை & ஸ்டைல்",
      subtitle_cookware_and_dining: "சமையல் பாத்திரங்கள் & உணவு",
      subtitle_indoor_and_outdoor: "உட்புறம் & வெளிப்புறம்",
      subtitle_comfort_essentials: "ஆறுதல் அத்தியாவசியங்கள்",
      subtitle_lamps_and_ambiance: "விளக்குகள் & சூழல்",
      subtitle_self_care_and_glow: "சுய பாதுகாப்பு & பொலிவு",
      subtitle_perfumes_and_scents: "வாசனை திரவியங்கள்",
      subtitle_personal_care: "தனிநபர் பராமரிப்பு",
      subtitle_vitamins_and_care: "வைட்டமின்கள் & பராமரிப்பு",
      subtitle_consoles_and_gear: "கன்சோல்கள் & கியர்",
      subtitle_speakers_and_sound: "ஸ்பீக்கர்கள் & ஒலி",
      subtitle_automation_and_security: "ஆட்டோமேஷன் & பாதுகாப்பு",
      subtitle_desks_and_supplies: "மேசைகள் & பொருட்கள்",
      subtitle_training_equipment: "பயிற்சி உபகரணங்கள்",
      subtitle_adventure_gear: "சாகச உபகரணங்கள்",
      subtitle_play_and_collectibles: "விளையாட்டு & சேகரிப்புகள்",
      subtitle_food_and_accessories: "உணவு & பாகங்கள்"
    },
    hi: {
      // Sidebar & Navigation
      home: "मुख्य पृष्ठ",
      shop: "दुकान",
      categories: "श्रेणियाँ",
      wishlist: "इच्छा सूची",
      orders: "ऑर्डर",
      profile: "प्रोफ़ाइल",
      // Header
      search_placeholder: "उत्पाद, ब्रांड और बहुत कुछ खोजें...",
      deliver_to: "यहाँ भेजें",
      login: "लॉगिन",
      logout: "लॉगआउट",
      my_profile: "मेरी प्रोफ़ाइल",
      addresses: "पते",
      // Shop Page Filters
      filters: "फ़िल्टर",
      brand: "ब्रांड",
      category: "श्रेणी",
      price_range: "मूल्य सीमा",
      customer_rating: "ग्राहक रेटिंग",
      reset_filters: "फ़िल्टर रीसेट करें",
      sort_by: "क्रमित करें",
      sort_relevance: "प्रासंगिकता",
      sort_low_high: "कीमत: कम से अधिक",
      sort_high_low: "कीमत: अधिक से कम",
      sort_rating: "रेटिंग",
      add_to_cart: "कार्ट में जोड़ें",
      added_to_cart: "कार्ट में जोड़ा गया",
      out_of_stock: "आउट ऑफ स्टॉक",
      ratings_count: "रेटिंग",
      // Empty States
      cart_empty: "आपकी कार्ट खाली है",
      cart_empty_desc: "खरीदारी करने के लिए अभी आइटम जोड़ें।",
      wishlist_empty: "आपकी इच्छा सूची खाली है",
      wishlist_empty_desc: "उत्पादों का अन्वेषण करें और अपने पसंदीदा जोड़ें।",
      orders_empty: "अभी तक कोई ऑर्डर नहीं",
      orders_empty_desc: "आपने अभी तक कोई ऑर्डर नहीं दिया है।",
      shop_now: "अभी खरीदें",
      explore_products: "उत्पादों का अन्वेषण करें",
      // Cart View
      shopping_cart: "शॉपिंग कार्ट",
      order_summary: "ऑर्डर सारांश",
      price_items: "कीमत",
      delivery_charges: "डिलिवरी शुल्क",
      free: "निःशुल्क",
      total_amount: "कुल राशि",
      place_order: "ऑर्डर दें",
      // Wishlist View
      my_wishlist: "मेरी इच्छा सूची",
      remove: "हटाएं",
      move_to_cart: "कार्ट में स्थानांतरित करें",
      // Orders View
      my_orders: "मेरे ऑर्डर",
      order_id: "ऑर्डर आईडी",
      order_date: "दिनांक",
      order_status: "स्थिति",
      order_total_paid: "कुल भुगतान किया गया",
      track_order: "ऑर्डर ट्रैक करें",
      // Profile View
      user_profile: "उपयोगकर्ता प्रोफ़ाइल",
      profile_sub: "व्यक्तिगत जानकारी और पते प्रबंधित करें",
      verified_account: "सत्यापित खाता",
      jwt_auth: "JWT प्रमाणित",
      saved_address: "सहेजा गया पता",
      manage_addresses: "पते प्रबंधित करें",
      log_out: "लॉगआउट",
      // Address Modal
      manage_delivery_addresses: "डिलिवरी पते प्रबंधित करें",
      add_new_address: "नया पता जोड़ें",
      edit_address: "पता संपादित करें",
      placeholder_fullname: "पूरा नाम",
      placeholder_mobile: "मोबाइल नंबर (10 अंक)",
      placeholder_pincode: "पिनकोड",
      placeholder_address: "फ्लैट, हाउस नंबर, बिल्डिंग, एमजी रोड",
      placeholder_city: "शहर",
      placeholder_state: "राज्य",
      address_type_home: "घर",
      address_type_work: "कार्यालय",
      set_default_address: "डिफ़ॉल्ट पते के रूप में सेट करें",
      cancel: "रद्द करें",
      save_address: "पता सहेजें",
      set_as_default: "डिफ़ॉल्ट सेट करें",
      delete: "हटाएं",
      // Confirm Delete Modal
      delete_address_title: "पता हटाएं?",
      delete_address_desc: "क्या आप वाकई इस पते को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
      // Settings Drawer
      display_language: "प्रदर्शन और भाषा",
      theme_mode: "थीम मोड",
      light_mode: "लाइट मोड",
      dark_mode: "डार्क मोड",
      color_palette: "रंग पैलेट",
      language_select: "Language / மொழி / भाषा",
      // Auth Modal
      style_moves_you: "शैली जो आपको प्रभावित करे",
      welcome_perk: "स्वागत लाभ",
      get_10_off: "10% छूट पाएं",
      login_or_signup: "लॉगिन या साइनअप",
      enter_mobile_email: "मोबाइल नंबर या ईमेल दर्ज करें",
      continue_btn: "जारी रखें",
      verify_otp: "OTP सत्यापित करें",
      enter_code: "कोड दर्ज करें",
      verify_proceed: "सत्यापित करें & आगे बढ़ें",
      create_password: "पासवर्ड बनाएं",
      continue_signup: "साइनअप जारी रखें",
      new_to_shopsphere: "ShopSphere में नए हैं?",
      create_account: "खाता बनाएं",
      agree_terms: "जारी रखकर, आप सहमत हैं",
      terms_of_use: "उपयोग की शर्तें",
      privacy_policy: "गोपनीयता नीति",
      placeholder_email: "ईमेल पता",
      enter_password: "पासवर्ड दर्ज करें",
      existing_user: "मौजूदा उपयोगकर्ता?",
      and: "और"
    }
  };

  AppState.language = localStorage.getItem('shopsphere_language') || 'en';

  let isTranslating = false;
  let viewObserver = null;

  function applyTranslations() {
    if (isTranslating) return;
    isTranslating = true;

    if (viewObserver) viewObserver.disconnect();

    const lang = AppState.language;
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        if (key.endsWith('_html')) {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });

    // Re-observe after mutations are done
    const viewContainer = document.getElementById('view-container');
    if (viewObserver && viewContainer) {
      viewObserver.observe(viewContainer, { childList: true, subtree: true });
    }

    isTranslating = false;
  }

  // Set up MutationObserver to automatically translate dynamic view injection
  function initTranslationObserver() {
    const viewContainer = document.getElementById('view-container');
    if (viewContainer) {
      viewObserver = new MutationObserver(() => {
        applyTranslations();
      });
      viewObserver.observe(viewContainer, { childList: true, subtree: true });
    }
  }

  // Initialize Observer
  initTranslationObserver();

  /* ==========================================================================
     Theme Color Palette Engine
     ========================================================================== */
  const COLOR_PALETTES = {
    lime: {
      accent: '#c2db3a',
      hover: '#b1c830',
      bg: 'rgba(194, 219, 58, 0.15)',
      heroCircleLight: '#e6edd9',
      heroCircleDark: '#2a2e23',
      promoBgLight: '#f1f3e7',
      promoBgDark: '#1e201b',
      glowLight: 'rgba(194, 219, 58, 0.04)',
      glowDark: 'rgba(194, 219, 58, 0.08)'
    },
    blue: {
      accent: '#2563eb',
      hover: '#1d4ed8',
      bg: 'rgba(37, 99, 235, 0.15)',
      heroCircleLight: '#dbeafe',
      heroCircleDark: '#1e293b',
      promoBgLight: '#eff6ff',
      promoBgDark: '#1e293b',
      glowLight: 'rgba(37, 99, 235, 0.04)',
      glowDark: 'rgba(37, 99, 235, 0.08)'
    },
    green: {
      accent: '#10b981',
      hover: '#059669',
      bg: 'rgba(16, 185, 129, 0.15)',
      heroCircleLight: '#d1fae5',
      heroCircleDark: '#064e3b',
      promoBgLight: '#ecfdf5',
      promoBgDark: '#064e3b',
      glowLight: 'rgba(16, 185, 129, 0.04)',
      glowDark: 'rgba(16, 185, 129, 0.08)'
    },
    orange: {
      accent: '#ff5a36',
      hover: '#e04322',
      bg: 'rgba(255, 90, 54, 0.15)',
      heroCircleLight: '#ffedd5',
      heroCircleDark: '#431407',
      promoBgLight: '#fff7ed',
      promoBgDark: '#431407',
      glowLight: 'rgba(255, 90, 54, 0.04)',
      glowDark: 'rgba(255, 90, 54, 0.08)'
    },
    purple: {
      accent: '#8b5cf6',
      hover: '#7c3aed',
      bg: 'rgba(139, 92, 246, 0.15)',
      heroCircleLight: '#f3e8ff',
      heroCircleDark: '#2e1065',
      promoBgLight: '#faf5ff',
      promoBgDark: '#2e1065',
      glowLight: 'rgba(139, 92, 246, 0.04)',
      glowDark: 'rgba(139, 92, 246, 0.08)'
    },
    pink: {
      accent: '#ec4899',
      hover: '#db2777',
      bg: 'rgba(236, 72, 153, 0.15)',
      heroCircleLight: '#fce7f3',
      heroCircleDark: '#500724',
      promoBgLight: '#fdf2f8',
      promoBgDark: '#500724',
      glowLight: 'rgba(236, 72, 153, 0.04)',
      glowDark: 'rgba(236, 72, 153, 0.08)'
    }
  };

  AppState.colorTheme = localStorage.getItem('shopsphere_color_theme') || 'lime';

  function applyColorTheme(themeName) {
    const theme = COLOR_PALETTES[themeName] || COLOR_PALETTES['lime'];
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    document.documentElement.style.setProperty('--color-accent', theme.accent);
    document.documentElement.style.setProperty('--color-accent-hover', theme.hover);
    document.documentElement.style.setProperty('--color-accent-bg', theme.bg);

    if (isDark) {
      document.documentElement.style.setProperty('--hero-bg-circle', theme.heroCircleDark);
      document.documentElement.style.setProperty('--sidebar-promo-bg', theme.promoBgDark);
      document.documentElement.style.setProperty('--body-glow', theme.glowDark);
    } else {
      document.documentElement.style.setProperty('--hero-bg-circle', theme.heroCircleLight);
      document.documentElement.style.setProperty('--sidebar-promo-bg', theme.promoBgLight);
      document.documentElement.style.setProperty('--body-glow', theme.glowLight);
    }

    localStorage.setItem('shopsphere_color_theme', themeName);
    AppState.colorTheme = themeName;

    // Highlight selected color palette button
    document.querySelectorAll('.color-palette-btn').forEach(btn => {
      if (btn.getAttribute('data-theme-name') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     Settings & Language Drawer Bindings
     ========================================================================== */
  function initSettingsDrawer() {
    const settingsBtn = document.getElementById('settings-btn');
    const overlay = document.getElementById('settings-drawer-overlay');
    const closeBtn = document.getElementById('settings-drawer-close');

    if (!overlay) return;

    // Toggle drawer
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        overlay.classList.remove('hidden');
        updateSettingsDrawerUI();
      });
    }

    closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });

    // Theme mode switch buttons inside drawer
    const modeLight = document.getElementById('settings-mode-light');
    const modeDark = document.getElementById('settings-mode-dark');

    if (modeLight && modeDark) {
      modeLight.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        AppState.theme = 'light';
        applyColorTheme(AppState.colorTheme);
        updateSettingsDrawerUI();
      });
      modeDark.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        AppState.theme = 'dark';
        applyColorTheme(AppState.colorTheme);
        updateSettingsDrawerUI();
      });
    }

    // Color palette click buttons
    document.querySelectorAll('.color-palette-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeName = btn.getAttribute('data-theme-name');
        applyColorTheme(themeName);
      });
    });

    // Language selection buttons
    document.querySelectorAll('.lang-selector-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        AppState.language = lang;
        localStorage.setItem('shopsphere_language', lang);
        applyTranslations();
        updateSettingsDrawerUI();
        showToast('lang_updated', 'success');
      });
    });

    function updateSettingsDrawerUI() {
      // Theme Mode Highlight
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (modeLight && modeDark) {
        if (isDark) {
          modeLight.classList.remove('active');
          modeDark.classList.add('active');
        } else {
          modeLight.classList.add('active');
          modeDark.classList.remove('active');
        }
      }

      // Color Palette highlight
      document.querySelectorAll('.color-palette-btn').forEach(btn => {
        if (btn.getAttribute('data-theme-name') === AppState.colorTheme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Language highlight
      document.querySelectorAll('.lang-selector-btn').forEach(btn => {
        const check = btn.querySelector('.active-check');
        if (btn.getAttribute('data-lang') === AppState.language) {
          btn.classList.add('active');
          if (check) check.style.display = 'block';
        } else {
          btn.classList.remove('active');
          if (check) check.style.display = 'none';
        }
      });
    }
  }

  // Load Theme and Translations
  applyColorTheme(AppState.colorTheme);
  applyTranslations();
  initSettingsDrawer();

  function requireAuth(actionType, payload, callback) {
    if (AuthService.isAuthenticated()) {
      callback();
    } else {
      AppState.pendingAction = { actionType, payload, callback };
      openAuthModal(actionType);
      showToast('Authentication required. Please log in.', 'error');
    }
  }

  function resumePendingAction() {
    if (AppState.pendingAction && typeof AppState.pendingAction.callback === 'function') {
      const pending = AppState.pendingAction;
      AppState.pendingAction = null;
      setTimeout(() => {
        pending.callback();
        showToast(`Action completed: ${getActionLabel(pending.actionType)}`, 'success');
      }, 300);
    }
  }

  function getActionLabel(actionType) {
    switch (actionType) {
      case 'ADD_TO_CART': return 'Item added to your cart';
      case 'BUY_NOW': return 'Proceeding to checkout';
      case 'WISHLIST': return 'Wishlist updated';
      case 'CHECKOUT': return 'Proceeding to checkout';
      case 'ORDERS': return 'Opening Order History';
      case 'PROFILE': return 'Opening User Profile';
      case 'ADDRESSES': return 'Opening Addresses';
      case 'SUBMIT_REVIEW': return 'Review submitted';
      default: return 'Operation successful';
    }
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');

    const lang = AppState.language;
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    const translatedMessage = dict[message] || message;

    toast.innerHTML = `<span style="font-size: 1.1rem; color: ${type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#3b82f6')}">${icon}</span> <span>${translatedMessage}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* Header Profile & Auth UI state sync */
  function updateHeaderAuthState() {
    const loginTrigger = document.getElementById('header-login-trigger');
    const userTrigger = document.getElementById('header-user-trigger');
    const userInitials = document.getElementById('header-user-initials');
    const userName = document.getElementById('header-user-name');
    const dropdownAvatarInitials = document.getElementById('dropdown-avatar-initials');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');

    const user = AuthService.getUser();
    if (user && AuthService.isAuthenticated()) {
      if (loginTrigger) loginTrigger.style.display = 'none';
      if (userTrigger) userTrigger.style.display = 'flex';

      const initials = (user.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      if (userInitials) userInitials.textContent = initials;
      if (userName) userName.textContent = user.name || 'User';

      if (dropdownAvatarInitials) dropdownAvatarInitials.textContent = initials;
      if (dropdownUserName) dropdownUserName.textContent = user.name || 'User';
      if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || 'user@example.com';
    } else {
      if (loginTrigger) loginTrigger.style.display = 'flex';
      if (userTrigger) userTrigger.style.display = 'none';
    }
    if (typeof AddressService !== 'undefined') {
      AddressService.updateHeaderLocation();
    }
  }

  /* Flipkart Auth Modal UI Controls */
  let otpTimerInterval = null;

  function openAuthModal(actionType = 'LOGIN') {
    const overlay = document.getElementById('auth-modal-overlay');
    if (!overlay) return;

    resetAuthForms();
    if (actionType === 'SIGNUP') {
      showAuthView('signup');
    } else {
      showAuthView('login');
    }

    const bannerHeading = document.getElementById('fk-banner-title');
    const bannerSubtext = document.getElementById('fk-banner-subtext');

    if (bannerHeading && bannerSubtext) {
      if (actionType === 'ADD_TO_CART') {
        bannerHeading.textContent = 'Unlock Your Cart';
        bannerSubtext.textContent = 'Sign in to add items to your cart & access instant checkout.';
      } else if (actionType === 'WISHLIST') {
        bannerHeading.textContent = 'Save to Wishlist';
        bannerSubtext.textContent = 'Keep track of your favorite styles across all devices.';
      } else if (actionType === 'CHECKOUT') {
        bannerHeading.textContent = 'Secure Checkout';
        bannerSubtext.textContent = 'Sign in to access saved addresses and 1-click payment options.';
      } else if (actionType === 'SIGNUP') {
        bannerHeading.textContent = 'Join ShopSphere';
        bannerSubtext.textContent = 'Create an account to get 10% off your first order and access member-only deals.';
      } else {
        bannerHeading.textContent = 'Welcome Back';
        bannerSubtext.textContent = 'Log in to manage orders, saved wishlist items, and personal recommendations.';
      }
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    stopOtpTimer();
  }

  function showAuthView(viewName) {
    const loginForm = document.getElementById('fk-login-form');
    const otpForm = document.getElementById('fk-otp-form');
    const signupForm = document.getElementById('fk-signup-form');
    const bannerTitle = document.getElementById('fk-banner-title');
    const bannerSubtext = document.getElementById('fk-banner-subtext');
    hideAuthError();

    if (loginForm) loginForm.style.display = viewName === 'login' ? 'flex' : 'none';
    if (otpForm) otpForm.style.display = viewName === 'otp' ? 'flex' : 'none';
    if (signupForm) signupForm.style.display = viewName === 'signup' ? 'flex' : 'none';

    if (viewName === 'signup' && bannerTitle && bannerSubtext) {
      bannerTitle.textContent = "Join ShopSphere Today";
      bannerSubtext.textContent = "Create an account to receive 10% OFF your first purchase & member perks.";
    } else if (viewName === 'otp' && bannerTitle && bannerSubtext) {
      bannerTitle.textContent = "Verify Security OTP";
      bannerSubtext.textContent = "Enter the 4-digit code sent to your mobile or email address.";
    }
  }

  function showAuthError(msg) {
    const errAlert = document.getElementById('fk-auth-error');
    const errText = document.getElementById('fk-error-text');
    if (errAlert && errText) {
      errText.textContent = msg;
      errAlert.style.display = 'flex';
    }
  }

  function hideAuthError() {
    const errAlert = document.getElementById('fk-auth-error');
    if (errAlert) errAlert.style.display = 'none';
  }

  function resetAuthForms() {
    hideAuthError();
    document.querySelectorAll('.fk-auth-form').forEach(f => f.reset());
    document.querySelectorAll('.fk-field-error').forEach(e => e.textContent = '');
  }

  function setBtnLoading(btnElement, loading) {
    if (!btnElement) return;
    const textSpan = btnElement.querySelector('.btn-text');
    const spinnerSpan = btnElement.querySelector('.btn-spinner');
    btnElement.disabled = loading;
    if (textSpan) textSpan.style.display = loading ? 'none' : 'inline';
    if (spinnerSpan) spinnerSpan.style.display = loading ? 'inline-block' : 'none';
  }

  function startOtpTimer() {
    stopOtpTimer();
    let secondsLeft = 30;
    const countdownEl = document.getElementById('fk-otp-countdown');
    const timerTextEl = document.getElementById('fk-otp-timer-text');
    const resendBtn = document.getElementById('fk-otp-resend-btn');

    if (timerTextEl) timerTextEl.style.display = 'inline';
    if (resendBtn) resendBtn.style.display = 'none';

    otpTimerInterval = setInterval(() => {
      secondsLeft--;
      if (countdownEl) countdownEl.textContent = secondsLeft;
      if (secondsLeft <= 0) {
        stopOtpTimer();
        if (timerTextEl) timerTextEl.style.display = 'none';
        if (resendBtn) resendBtn.style.display = 'inline';
      }
    }, 1000);
  }

  function stopOtpTimer() {
    if (otpTimerInterval) {
      clearInterval(otpTimerInterval);
      otpTimerInterval = null;
    }
  }

  /* Bind Modal & Header Authentication Event Listeners */
  function bindAuthEventListeners() {
    updateHeaderAuthState();

    const closeBtn = document.getElementById('fk-auth-close');
    const overlay = document.getElementById('auth-modal-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
    if (overlay) overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });

    const headerLoginBtn = document.getElementById('header-login-trigger');
    if (headerLoginBtn) {
      headerLoginBtn.addEventListener('click', () => openAuthModal('LOGIN'));
    }

    document.querySelectorAll('.promo-signup-btn').forEach(btn => {
      btn.addEventListener('click', () => openAuthModal('LOGIN'));
    });

    const userTrigger = document.getElementById('header-user-trigger');
    const userMenu = document.getElementById('user-dropdown-menu');

    if (userTrigger && userMenu) {
      userTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!userTrigger.contains(e.target)) {
          userMenu.classList.remove('show');
        }
      });
    }

    // Dropdown Items
    const menuProfile = document.getElementById('menu-item-profile');
    const menuOrders = document.getElementById('menu-item-orders');
    const menuWishlist = document.getElementById('menu-item-wishlist');
    const menuAddresses = document.getElementById('menu-item-addresses');
    const menuLogout = document.getElementById('menu-item-logout');

    if (menuProfile) menuProfile.addEventListener('click', () => { userMenu.classList.remove('show'); renderView('profile'); });
    if (menuOrders) menuOrders.addEventListener('click', () => { userMenu.classList.remove('show'); renderView('orders'); });
    if (menuWishlist) menuWishlist.addEventListener('click', () => { userMenu.classList.remove('show'); renderView('wishlist'); });
    if (menuAddresses) menuAddresses.addEventListener('click', () => { userMenu.classList.remove('show'); requireAuth('ADDRESSES', {}, () => { if (window.openAddressModal) window.openAddressModal(); }); });
    if (menuLogout) menuLogout.addEventListener('click', () => { userMenu.classList.remove('show'); AuthService.logout(); });

    // Mode View Switchers & Social Login
    const toSignup = document.getElementById('fk-link-to-signup');
    const toLogin = document.getElementById('fk-link-to-login');
    const googleBtn = document.getElementById('google-signin-btn');

    if (toSignup) toSignup.addEventListener('click', () => showAuthView('signup'));
    if (toLogin) toLogin.addEventListener('click', () => showAuthView('login'));

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        hideAuthError();
        googleBtn.style.opacity = '0.7';
        googleBtn.style.pointerEvents = 'none';

        AuthService.googleLogin()
          .then(() => {
            googleBtn.style.opacity = '1';
            googleBtn.style.pointerEvents = 'auto';
            closeAuthModal();
            showToast(`Signed in with Google! Welcome, ${AppState.user.name}!`, 'success');
            resumePendingAction();
          })
          .catch((err) => {
            googleBtn.style.opacity = '1';
            googleBtn.style.pointerEvents = 'auto';
            showAuthError(err.message);
          });
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById('fk-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('fk-login-identifier').value.trim();
        const password = document.getElementById('fk-login-password').value;

        if (!identifier || !password) {
          showAuthError('Please enter both identifier and password.');
          return;
        }

        const submitBtn = document.getElementById('fk-login-submit');
        setBtnLoading(submitBtn, true);
        hideAuthError();

        AuthService.login(identifier, password, false)
          .then(() => {
            setBtnLoading(submitBtn, false);
            closeAuthModal();
            showToast(`Welcome back, ${AppState.user.name}!`, 'success');
            resumePendingAction();
          })
          .catch((err) => {
            setBtnLoading(submitBtn, false);
            showAuthError(err.message);
          });
      });
    }


    // Signup Form Submit
    const signupForm = document.getElementById('fk-signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('fk-signup-name').value;
        const email = document.getElementById('fk-signup-email').value;
        const mobile = document.getElementById('fk-signup-mobile').value;
        const password = document.getElementById('fk-signup-password').value;

        const submitBtn = document.getElementById('fk-signup-submit');
        setBtnLoading(submitBtn, true);
        hideAuthError();

        AuthService.signup(name, email, mobile, password)
          .then(() => {
            setBtnLoading(submitBtn, false);
            closeAuthModal();
            showToast(`Account created! Welcome to ShopSphere, ${AppState.user.name}!`, 'success');
            resumePendingAction();
          })
          .catch((err) => {
            setBtnLoading(submitBtn, false);
            showAuthError(err.message);
          });
      });
    }
  }

  function normalizeBackendProduct(p) {
    const numericPrice = p.price || 1999;
    const originalPrice = Math.round(numericPrice * 1.5);
    const discount = 33;
    return {
      id: p.id,
      name: p.name,
      cat: p.category ? p.category.name : 'Accessories',
      brand: p.brand ? p.brand.name : 'HypeBrand',
      price: `₹${numericPrice.toLocaleString('en-IN')}`,
      originalPrice: `₹${originalPrice.toLocaleString('en-IN')}`,
      numericPrice: numericPrice,
      discount: discount,
      badge: `-${discount}%`,
      rating: p.rating || 4.2,
      reviewCount: p.reviewCount || 15,
      inStock: true,
      stockCount: 15,
      sku: `SKU-${p.id * 123}`,
      deliveryBadge: 'Express Shipping in 2 Days',
      warranty: '1 Year Brand Warranty',
      returnPolicy: '30 Days Money Back Guarantee',
      sellerInfo: 'Hype Direct Official Store',
      shortDesc: p.description || 'Premium design and high-quality build.',
      description: p.description || 'Experience the premium build quality and high performance style.',
      img: p.imageUrl || 'assets/images/cat_accessories.png',
      images: [p.imageUrl || 'assets/images/cat_accessories.png'],
      variants: {
        colors: ['Black', 'Default'],
        sizes: ['Standard']
      },
      specs: {
        'Category': p.category ? p.category.name : 'Accessories',
        'Brand': p.brand ? p.brand.name : 'HypeBrand'
      }
    };
  }

  function normalizeBackendCategory(c) {
    const bgMap = {
      'Men': '#e0f2fe',
      'Women': '#fce7f3',
      'Activewear': '#ccfbf1',
      'Sleepwear': '#fae8ff',
      'Shoes': '#fef9c3',
      'Accessories': '#fef9c3',
      'Electronics': '#dcfce7',
      'Lighting': '#fef9c3',
      'Decor': '#f7fee7',
      'Lifestyle': '#ecfccb',
      'Smart Watch': '#fae8ff'
    };
    const imgMap = {
      'Men': 'assets/images/cat_men.png',
      'Women': 'assets/images/cat_women.png',
      'Activewear': 'assets/images/cat_activewear.png',
      'Sleepwear': 'assets/images/cat_sleepwear.svg',
      'Shoes': 'assets/images/cat_shoes.png',
      'Accessories': 'assets/images/cat_accessories.png',
      'Electronics': 'assets/images/cat_electronics.png',
      'Lighting': 'assets/images/cat_lighting.svg',
      'Decor': 'assets/images/cat_homedecor.svg',
      'Lifestyle': 'assets/images/cat_furniture.png',
      'Smart Watch': 'assets/images/prod_watch.png'
    };
    return {
      name: c.name,
      subtitle: c.description || 'Collection',
      bg: bgMap[c.name] || '#f1f5f9',
      img: imgMap[c.name] || 'assets/images/cat_accessories.png'
    };
  }

  // Simulated Async API Service with Live Backend Switch
  const ApiService = {
    isLive: false,
    baseUrl: 'http://localhost:8080',

    async init() {
      try {
        const res = await fetch(`${this.baseUrl}/health`);
        if (res.ok) {
          const health = await res.json();
          if (health.status === 'UP') {
            this.isLive = true;
            console.log('Connected to AURA live backend API.');
          }
        }
      } catch (err) {
        console.warn('Backend API offline. Running in Local Storage Mock mode.');
      }
    },

    async fetchViewData(viewName) {
      if (!this.isLive) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ state: 'success', data: ApiService.getMockData(viewName) });
          }, 100);
        });
      }

      try {
        if (viewName === 'home') {
          const catRes = await fetch(`${this.baseUrl}/api/categories`);
          const prodRes = await fetch(`${this.baseUrl}/api/products?limit=100`);
          if (catRes.ok && prodRes.ok) {
            const backendCats = await catRes.json();
            const backendProds = await prodRes.json();
            const normalizedProds = backendProds.map(normalizeBackendProduct);
            const normalizedCats = backendCats.map(normalizeBackendCategory);

            mockDb.products = normalizedProds;
            mockDb.categories = normalizedCats;
            localStorage.setItem('shopsphere_products', JSON.stringify(normalizedProds));
            localStorage.setItem('shopsphere_categories', JSON.stringify(normalizedCats));

            return { state: 'success', data: normalizedProds };
          }
        } else if (viewName === 'categories') {
          const catRes = await fetch(`${this.baseUrl}/api/categories`);
          if (catRes.ok) {
            const backendCats = await catRes.json();
            const normalizedCats = backendCats.map(normalizeBackendCategory);
            mockDb.categories = normalizedCats;
            localStorage.setItem('shopsphere_categories', JSON.stringify(normalizedCats));
            return { state: 'success', data: normalizedCats };
          }
        } else if (viewName === 'shop' || viewName === 'products') {
          const prodRes = await fetch(`${this.baseUrl}/api/products?limit=100`);
          if (prodRes.ok) {
            const backendProds = await prodRes.json();
            const normalizedProds = backendProds.map(normalizeBackendProduct);
            mockDb.products = normalizedProds;
            localStorage.setItem('shopsphere_products', JSON.stringify(normalizedProds));
            return { state: 'success', data: normalizedProds };
          }
        }
      } catch (err) {
        console.error('API call failed, falling back to local data', err);
      }

      return { state: 'success', data: ApiService.getMockData(viewName) };
    },

    async submitSupportTicket(ticketData) {
      if (this.isLive) {
        try {
          const res = await fetch(`${this.baseUrl}/api/v1/admin/support/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
          });
          if (res.ok) {
            const data = await res.json();
            return data;
          }
        } catch (err) {
          console.warn('Backend ticket submission failed, generating fallback response:', err);
        }
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          const refId = `#SUP-${randomNum}`;

          const existingTickets = JSON.parse(localStorage.getItem('shopsphere_support_tickets') || '[]');
          existingTickets.unshift({
            refId,
            ...ticketData,
            createdAt: new Date().toISOString(),
            status: 'OPEN'
          });
          localStorage.setItem('shopsphere_support_tickets', JSON.stringify(existingTickets));

          resolve({
            status: 'success',
            message: 'Support ticket submitted successfully',
            data: { ticketId: refId }
          });
        }, 800);
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
            img: 'assets/images/prod_wallet.png',
            images: ['assets/images/prod_wallet.png'],
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
          { name: 'Men', subtitle: 'T-Shirts, Jeans & Jackets', bg: '#e0f2fe', img: 'assets/images/cat_men.png' },
          { name: 'Women', subtitle: 'Dresses, Tops & Jeans', bg: '#fce7f3', img: 'assets/images/cat_women.png' },
          { name: 'Activewear', subtitle: 'Gym Shorts & Leggings', bg: '#ccfbf1', img: 'assets/images/cat_activewear.png' },
          { name: 'Sleepwear', subtitle: 'Pajama Sets & Loungewear', bg: '#fae8ff', img: 'assets/images/cat_sleepwear.svg' },
          { name: 'Shoes', subtitle: 'Sneakers, Boots & Sandals', bg: '#fef9c3', img: 'assets/images/cat_shoes.png' },
          { name: 'Bags & Luggage', subtitle: 'Backpacks & Suitcases', bg: '#e2e8f0', img: 'assets/images/prod_backpack.png' },
          { name: 'Jewelry', subtitle: 'Necklaces, Rings & Earrings', bg: '#ffe4e6', img: 'assets/images/cat_jewelry.svg' },
          { name: 'Accessories', subtitle: 'Smartwatches, Sunglasses & Wallets', bg: '#fef9c3', img: 'assets/images/prod_wallet.png' },
          { name: 'Kids & Baby', subtitle: 'Baby Onesies & Kids Apparel', bg: '#fae8ff', img: 'assets/images/cat_kids.png' },
          { name: 'Electronics', subtitle: 'Smartphones, Laptops & Accessories', bg: '#dcfce7', img: 'assets/images/cat_electronics.png' },
          { name: 'Audio', subtitle: 'Earbuds, Headphones & Speakers', bg: '#dbeafe', img: 'assets/images/prod_earbuds.png' },
          { name: 'Gaming', subtitle: 'Consoles, Controllers & Gear', bg: '#e2e8f0', img: 'assets/images/cat_gaming.svg' },
          { name: 'Smart Home', subtitle: 'Smart Bulbs, Cameras & Hubs', bg: '#f1f5f9', img: 'assets/images/cat_smarthome.svg' },
          { name: 'Furniture', subtitle: 'Sofas, Beds & Office Desks', bg: '#ecfccb', img: 'assets/images/cat_furniture.png' },
          { name: 'Home Decor', subtitle: 'Wall Art, Cushions & Rugs', bg: '#f7fee7', img: 'assets/images/cat_homedecor.svg' },
          { name: 'Bedding & Bath', subtitle: 'Sheets, Towels & Mats', bg: '#e0f2fe', img: 'assets/images/cat_bedding.svg' },
          { name: 'Kitchen & Dining', subtitle: 'Cookware, Blenders & Cutlery', bg: '#ffedd5', img: 'assets/images/cat_kitchen.png' },
          { name: 'Lighting', subtitle: 'Ceiling, Table & Desk Lamps', bg: '#fef9c3', img: 'assets/images/cat_lighting.svg' },
          { name: 'Beauty & Skincare', subtitle: 'Cleansers, Serums & Makeup', bg: '#ffe4e6', img: 'assets/images/cat_beauty.png' },
          { name: 'Fragrances', subtitle: 'Perfumes, Colognes & Mists', bg: '#fae8ff', img: 'assets/images/cat_fragrances.svg' },
          { name: 'Grooming', subtitle: 'Trimmers, Dryers & Razors', bg: '#fed7aa', img: 'assets/images/cat_grooming.png' },
          { name: 'Health & Wellness', subtitle: 'Vitamins & Protein Powders', bg: '#d1fae5', img: 'assets/images/cat_health.png' },
          { name: 'Sports & Fitness', subtitle: 'Dumbbells & Yoga Mats', bg: '#ffe4e6', img: 'assets/images/cat_sports.png' },
          { name: 'Outdoor & Camping', subtitle: 'Tents, Sleeping Bags & Gear', bg: '#ffedd5', img: 'assets/images/cat_outdoor.png' },
          { name: 'Office & Stationery', subtitle: 'Notebooks, Pens & Organizers', bg: '#ffedd5', img: 'assets/images/cat_office.svg' },
          { name: 'Toys & Games', subtitle: 'Action Figures & Board Games', bg: '#fef9c3', img: 'assets/images/cat_toys.png' },
          { name: 'Pet Supplies', subtitle: 'Food, Beds & Toys', bg: '#f5ebe0', img: 'assets/images/cat_pets.png' }
        ],
        orders: OrderService.getAll(),
        wishlist: [],
        notifications: [],
        reviews: [
          { user: 'Alex Rivera', rating: 5, comment: 'Outstanding quality and fast delivery! Super impressed with Hype.', date: 'Aug 2, 2026' },
          { user: 'Sarah Jenkins', rating: 4, comment: 'Great products, high durability. Highly recommended for daily use.', date: 'Jul 29, 2026' }
        ]
      };
      // Initialize/sync products database in localStorage if not set or outdated
      const CURRENT_DB_VERSION = 'v25';
      let storedProducts = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
      const currentDbVersion = localStorage.getItem('shopsphere_db_version');
      if (storedProducts.length < 108 || currentDbVersion !== CURRENT_DB_VERSION || !storedProducts[0]?.name.includes('Shirt')) {
        const generatedProducts = [];
        const categories = mockDb.categories;

        const categoryProductNames = {
          'Men': ['Shirt', 'T-Shirt', 'Pants', 'Jacket'],
          'Women': ['Dress', 'Top', 'Skirt', 'Jeans'],
          'Activewear': ['Gym Shorts', 'Sports Bra', 'Leggings', 'Tracksuit'],
          'Sleepwear': ['Pajama Set', 'Nightgown', 'Robe', 'Sweatpants'],
          'Shoes': ['Sneakers', 'Boots', 'Sandals', 'Formal Shoes'],
          'Bags & Luggage': ['Backpack', 'Suitcase', 'Handbag', 'Laptop Bag'],
          'Jewelry': ['Necklace', 'Ring', 'Earrings', 'Bracelet'],
          'Accessories': ['Sunglasses', 'Wallet', 'Belt', 'Smartwatch'],
          'Kids & Baby': ['Onesie', 'Kids T-Shirt', 'Kids Shorts', 'Baby Blanket'],
          'Electronics': ['Smartphone', 'Laptop', 'Power Bank', 'Tablet'],
          'Audio': ['Headphones', 'Earbuds', 'Bluetooth Speaker', 'Soundbar'],
          'Gaming': ['Gaming Console', 'Game Controller', 'Gaming Headset', 'Video Game'],
          'Smart Home': ['Smart Bulb', 'Security Camera', 'Smart Plug', 'Smart Lock'],
          'Furniture': ['Sofa', 'Bed', 'Office Chair', 'Dining Table'],
          'Home Decor': ['Wall Art', 'Vase', 'Scented Candle', 'Curtain'],
          'Bedding & Bath': ['Bed Sheet', 'Comforter', 'Bath Towel', 'Pillow'],
          'Kitchen & Dining': ['Frying Pan', 'Air Fryer', 'Water Bottle', 'Dinnerware Set'],
          'Lighting': ['Desk Lamp', 'Ceiling Light', 'Floor Lamp', 'Solar Light'],
          'Beauty & Skincare': ['Face Wash', 'Moisturizer', 'Sunscreen', 'Serum'],
          'Fragrances': ['Perfume', 'Cologne', 'Body Mist', 'Room Diffuser'],
          'Grooming': ['Beard Trimmer', 'Hair Dryer', 'Electric Razor', 'Electric Toothbrush'],
          'Health & Wellness': ['Multivitamins', 'Protein Powder', 'Massage Gun', 'First Aid Kit'],
          'Sports & Fitness': ['Dumbbell', 'Yoga Mat', 'Resistance Band', 'Basketball'],
          'Outdoor & Camping': ['Camping Tent', 'Sleeping Bag', 'Hiking Backpack', 'Headlamp'],
          'Office & Stationery': ['Notebook', 'Pen Set', 'Desk Organizer', 'Planner'],
          'Toys & Games': ['Action Figure', 'Board Game', 'Building Blocks', 'Puzzle'],
          'Pet Supplies': ['Dog Food', 'Pet Bed', 'Dog Leash', 'Pet Toy']
        };

        const categoryProductImages = {
          'Men Shirt': 'assets/images/prod_shirt.png',
          'Men T-Shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
          'Men Pants': 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80',
          'Men Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=300&q=80',
          'Women Dress': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
          'Women Top': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80',
          'Women Skirt': 'assets/images/prod_skirt.png',
          'Women Jeans': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=300&q=80',
          'Activewear Gym Shorts': 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=300&q=80',
          'Activewear Sports Bra': 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=300&q=80',
          'Activewear Leggings': 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=300&q=80',
          'Activewear Tracksuit': 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=300&q=80',
          'Sleepwear Pajama Set': 'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&w=300&q=80',
          'Sleepwear Nightgown': 'https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?auto=format&fit=crop&w=300&q=80',
          'Sleepwear Robe': 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80',
          'Sleepwear Sweatpants': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=300&q=80',
          'Shoes Sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
          'Shoes Boots': 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=300&q=80',
          'Shoes Sandals': 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=300&q=80',
          'Shoes Formal Shoes': 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=300&q=80',
          'Bags & Luggage Backpack': 'assets/images/prod_backpack.png',
          'Bags & Luggage Suitcase': 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=300&q=80',
          'Bags & Luggage Handbag': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80',
          'Bags & Luggage Laptop Bag': 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=300&q=80',
          'Jewelry Necklace': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80',
          'Jewelry Ring': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=300&q=80',
          'Jewelry Earrings': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80',
          'Jewelry Bracelet': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=300&q=80',
          'Accessories Sunglasses': 'assets/images/prod_sunglasses.png',
          'Accessories Wallet': 'assets/images/prod_wallet.png',
          'Accessories Belt': 'assets/images/prod_belt.png',
          'Accessories Smartwatch': 'assets/images/prod_watch.png',
          'Kids & Baby Onesie': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80',
          'Kids & Baby Kids T-Shirt': 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=300&q=80',
          'Kids & Baby Kids Shorts': 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=300&q=80',
          'Kids & Baby Baby Blanket': 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
          'Electronics Smartphone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80',
          'Electronics Laptop': 'assets/images/prod_laptop.png',
          'Electronics Power Bank': 'https://images.unsplash.com/photo-1609592424109-dd2556b68b8e?auto=format&fit=crop&w=300&q=80',
          'Electronics Tablet': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=300&q=80',
          'Audio Headphones': 'assets/images/prod_headphones.png',
          'Audio Earbuds': 'assets/images/prod_earbuds.png',
          'Audio Bluetooth Speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=300&q=80',
          'Audio Soundbar': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=80',
          'Gaming Gaming Console': 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=300&q=80',
          'Gaming Game Controller': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80',
          'Gaming Gaming Headset': 'assets/images/prod_gaming_headset.png',
          'Gaming Video Game': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80',
          'Smart Home Smart Bulb': 'https://images.unsplash.com/photo-1550985543-f47f38aeee65?auto=format&fit=crop&w=300&q=80',
          'Smart Home Security Camera': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=300&q=80',
          'Smart Home Smart Plug': 'https://images.unsplash.com/photo-1558538337-aab544368de8?auto=format&fit=crop&w=300&q=80',
          'Smart Home Smart Lock': 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80',
          'Furniture Sofa': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
          'Furniture Bed': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
          'Furniture Office Chair': 'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&w=300&q=80',
          'Furniture Dining Table': 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=300&q=80',
          'Home Decor Wall Art': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80',
          'Home Decor Vase': 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=300&q=80',
          'Home Decor Scented Candle': 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=300&q=80',
          'Home Decor Curtain': 'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=300&q=80',
          'Bedding & Bath Bed Sheet': 'assets/images/prod_bedsheet.png',
          'Bedding & Bath Comforter': 'assets/images/prod_comforter.png',
          'Bedding & Bath Bath Towel': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=300&q=80',
          'Bedding & Bath Pillow': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=300&q=80',
          'Kitchen & Dining Frying Pan': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80',
          'Kitchen & Dining Air Fryer': 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=300&q=80',
          'Kitchen & Dining Water Bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=80',
          'Kitchen & Dining Dinnerware Set': 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=300&q=80',
          'Lighting Desk Lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80',
          'Lighting Ceiling Light': 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=300&q=80',
          'Lighting Floor Lamp': 'assets/images/prod_floorlamp.png',
          'Lighting Solar Light': 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=300&q=80',
          'Beauty & Skincare Face Wash': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80',
          'Beauty & Skincare Moisturizer': 'https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=300&q=80',
          'Beauty & Skincare Sunscreen': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80',
          'Beauty & Skincare Serum': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80',
          'Fragrances Perfume': 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80',
          'Fragrances Cologne': 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80',
          'Fragrances Body Mist': 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=300&q=80',
          'Fragrances Room Diffuser': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=300&q=80',
          'Grooming Beard Trimmer': 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=300&q=80',
          'Grooming Hair Dryer': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
          'Grooming Electric Razor': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
          'Grooming Electric Toothbrush': 'https://images.unsplash.com/photo-1473232117216-c950d48f7dbb?auto=format&fit=crop&w=300&q=80',
          'Health & Wellness Multivitamins': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=300&q=80',
          'Health & Wellness Protein Powder': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=300&q=80',
          'Health & Wellness Massage Gun': 'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&w=300&q=80',
          'Health & Wellness First Aid Kit': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=300&q=80',
          'Sports & Fitness Dumbbell': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80',
          'Sports & Fitness Yoga Mat': 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=300&q=80',
          'Sports & Fitness Resistance Band': 'assets/images/prod_resistanceband.png',
          'Sports & Fitness Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80',
          'Outdoor & Camping Camping Tent': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80',
          'Outdoor & Camping Sleeping Bag': 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=300&q=80',
          'Outdoor & Camping Hiking Backpack': 'assets/images/prod_backpack.png',
          'Outdoor & Camping Headlamp': 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=300&q=80',
          'Office & Stationery Notebook': 'https://images.unsplash.com/photo-1531346878377-a5c20888254f?auto=format&fit=crop&w=300&q=80',
          'Office & Stationery Pen Set': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
          'Office & Stationery Desk Organizer': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80',
          'Office & Stationery Planner': 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80',
          'Toys & Games Action Figure': 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?auto=format&fit=crop&w=300&q=80',
          'Toys & Games Board Game': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=300&q=80',
          'Toys & Games Building Blocks': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=300&q=80',
          'Toys & Games Puzzle': 'https://images.unsplash.com/photo-1585250000033-03333e577078?auto=format&fit=crop&w=300&q=80',
          'Pet Supplies Dog Food': 'assets/images/prod_dog_food.png',
          'Pet Supplies Pet Bed': 'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?auto=format&fit=crop&w=300&q=80',
          'Pet Supplies Dog Leash': 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=300&q=80',
          'Pet Supplies Pet Toy': 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=300&q=80'
        };

        let globalId = 1;
        categories.forEach(cat => {
          const names = categoryProductNames[cat.name] || ['Item A', 'Item B', 'Item C', 'Item D'];
          const baseDetails = [
            { price: 1999, originalPrice: 2999, badge: 'Best Seller' },
            { price: 3999, originalPrice: 5999, badge: 'Featured' },
            { price: 6999, originalPrice: 9999, badge: 'Hot' },
            { price: 999, originalPrice: 1499, badge: 'New' }
          ];

          names.forEach((prodName, index) => {
            const detail = baseDetails[index] || baseDetails[0];
            generatedProducts.push({
              id: globalId++,
              name: prodName,
              cat: cat.name,
              brand: 'HypeBrand',
              price: `₹${detail.price.toLocaleString('en-IN')}`,
              originalPrice: `₹${detail.originalPrice.toLocaleString('en-IN')}`,
              numericPrice: detail.price,
              discount: Math.round(((detail.originalPrice - detail.price) / detail.originalPrice) * 100),
              badge: detail.badge,
              rating: Number((4.0 + Math.random() * 1.0).toFixed(1)),
              reviewCount: Math.floor(10 + Math.random() * 200),
              inStock: true,
              stockCount: Math.floor(5 + Math.random() * 50),
              sku: `SKU-${cat.name.substring(0, 3).toUpperCase()}-${globalId * 111}`,
              deliveryBadge: 'Express Shipping in 2 Days',
              warranty: '1 Year Brand Warranty',
              returnPolicy: '30 Days Money Back Guarantee',
              sellerInfo: 'Hype Official Store • Verified Retailer',
              shortDesc: `Premium quality ${cat.name} ${prodName} designed for maximum satisfaction.`,
              description: `Experience the finest selection of our ${cat.name} range. Handcrafted with top-grade materials and engineered to modern specifications.`,
              img: categoryProductImages[`${cat.name} ${prodName}`] || cat.img || 'assets/images/cat_accessories.png',
              images: [categoryProductImages[`${cat.name} ${prodName}`] || cat.img || 'assets/images/cat_accessories.png'],
              variants: {
                colors: ['Default Black', 'Titanium Silver', 'Ocean Blue'],
                sizes: ['Standard Size']
              },
              specs: {
                'Origin': 'Made with Care',
                'Warranty': '1 Year Domestic Warranty',
                'Quality': 'Tested and Verified'
              }
            });
          });
        });
        localStorage.setItem('shopsphere_products', JSON.stringify(generatedProducts));
        localStorage.setItem('shopsphere_db_version', CURRENT_DB_VERSION);
        storedProducts = generatedProducts;
      }
      mockDb.products = storedProducts;

      // Initialize/sync categories database in localStorage if not set or outdated
      const storedCategories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
      const currentCatVersion = localStorage.getItem('shopsphere_db_version');
      if (storedCategories.length >= 27 && currentCatVersion === CURRENT_DB_VERSION && storedCategories[0]?.img === 'assets/images/cat_men.png') {
        mockDb.categories = storedCategories;
      } else {
        localStorage.setItem('shopsphere_categories', JSON.stringify(mockDb.categories));
        localStorage.setItem('shopsphere_db_version', CURRENT_DB_VERSION);
      }

      if (viewName === 'wishlist') {
        const savedIds = WishlistService.getAll();
        return mockDb.products.filter(p => savedIds.includes(p.id));
      }
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
    requireAuth('ADD_TO_CART', { productId, qty, color, size }, () => {
      const allProducts = ApiService.getMockData('products');
      const product = allProducts.find(p => p.id == productId);
      if (!product) return;

      if (product.inStock === false || (product.stockCount !== undefined && product.stockCount <= 0)) {
        showToast(`Sorry, "${product.name}" is currently out of stock.`, 'error');
        return;
      }

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
      showToast(`Added "${product.name}" to your Cart!`, 'success');
    });
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
            <h2 class="view-title" data-i18n="shopping_cart">Shopping Cart</h2>
            <p class="view-subtitle" data-i18n="cart_empty_desc">Your cart is currently empty</p>
          </div>
        </div>
        <div style="background: var(--bg-card); padding: 48px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--bg-body); display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="width: 32px; height: 32px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);" data-i18n="cart_empty">Your Cart is Empty</h3>
          <p style="color: var(--text-secondary); max-width: 400px; font-size: 0.95rem;" data-i18n="cart_empty_desc">You haven't added any products to your cart yet. Discover trending style & electronics in our catalog!</p>
          <button class="btn-primary-action" data-nav-target="shop" style="margin-top: 8px;">
            <span data-i18n="explore_products">Browse Products</span>
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
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 14px;" data-i18n="order_summary">Order Summary</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.95rem;">
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span><span data-i18n="price_items">Subtotal</span> (${AppState.cart.reduce((s, i) => s + i.qty, 0)} items)</span>
              <strong style="color: var(--text-primary);">₹${subtotal.toLocaleString('en-IN')}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span data-i18n="delivery_charges">Shipping Fee</span>
              <span style="color: var(--color-success); font-weight: 700;">${shipping === 0 ? `<span data-i18n="free">FREE</span>` : '₹99'}</span>
            </div>

            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Estimated Tax</span>
              <span style="color: var(--text-muted);">Included</span>
            </div>
          </div>

          <div style="border-top: 1px dashed var(--border-color); padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);" data-i18n="total_amount">Total Amount</span>
            <span style="font-size: 1.4rem; font-weight: 800; color: var(--color-accent);">₹${total.toLocaleString('en-IN')}</span>
          </div>

          <button class="btn-primary-action" id="checkout-btn" style="width: 100%; justify-content: center; padding: 14px; font-size: 1rem;">
            <span data-i18n="place_order">Proceed to Checkout</span>
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
        requireAuth('CHECKOUT', {}, () => {
          renderView('checkout');
        });
      });
    }

  }

  // Render Checkout View with Payment Options & Addresses selection
  function renderCheckoutView() {
    if (!viewContainer) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!AppState.cart || AppState.cart.length === 0) {
      renderView('cart');
      return;
    }

    const subtotal = AppState.cart.reduce((sum, item) => sum + (item.product.numericPrice * item.qty), 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    const addresses = AddressService.getAll();
    const selectedAddress = AddressService.getDefault() || addresses[0] || null;

    let addressSectionHtml = '';
    if (addresses.length === 0) {
      addressSectionHtml = `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px dashed #ef4444; padding: 16px; border-radius: var(--radius-md); text-align: center; color: #ef4444;">
          <p style="font-weight: bold; font-size: 0.95rem;" data-i18n="no_addresses_found">No delivery address found!</p>
          <button class="btn-primary-action" id="checkout-add-address-btn" style="margin-top: 10px; font-size: 0.85rem; padding: 8px 16px; background: #ef4444; border-color: #ef4444;" data-i18n="add_new_address">Add New Address</button>
        </div>
      `;
    } else {
      addressSectionHtml = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="background: var(--bg-body); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-lg); position: relative;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-accent); margin-bottom: 6px;">
              <span data-i18n="address_type_${selectedAddress.type.toLowerCase()}">${selectedAddress.type}</span> <span data-i18n="default_label">(Default)</span>
            </div>
            <div style="font-weight: 700; color: var(--text-primary);">${selectedAddress.name}</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">
              ${selectedAddress.addressLine}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}
            </div>
            <div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px;">Phone: ${selectedAddress.phone}</div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <select id="checkout-address-select" class="sort-select" style="font-size: 0.88rem; padding: 8px 12px; height: auto; flex-grow: 1;">
              ${addresses.map(a => `
                <option value="${a.id}" ${a.id === selectedAddress.id ? 'selected' : ''}>
                  ${a.name} (${a.type}) - ${a.addressLine.substring(0, 20)}...
                </option>
              `).join('')}
            </select>
            <button class="btn-secondary-action" id="checkout-manage-address-btn" style="padding: 8px 14px; font-size: 0.85rem;" data-i18n="manage_addresses">Manage</button>
          </div>
        </div>
      `;
    }

    const contentHtml = `
      <div class="view-section-header">
        <div>
          <h2 class="view-title">Secure Checkout</h2>
          <p class="view-subtitle">Select shipping address and payment method</p>
        </div>
      </div>

      <div class="checkout-layout-grid" style="display: grid; grid-template-columns: 1fr 380px; gap: 28px; align-items: start;">
        <!-- Left Panel: Delivery & Payment Details -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- 1. Delivery Address Block -->
          <div class="checkout-card" style="background: var(--bg-card); padding: 24px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
              <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-accent-bg); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">1</span>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Delivery Address</h3>
            </div>
            ${addressSectionHtml}
          </div>

          <!-- 2. Payment Options Block -->
          <div class="checkout-card" style="background: var(--bg-card); padding: 24px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
              <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-accent-bg); color: var(--color-accent); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">2</span>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">Payment Options</h3>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <!-- UPI Option -->
              <label class="payment-option-label" style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <input type="radio" name="payment-method" value="upi" checked style="accent-color: var(--color-accent);">
                  <div style="font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <span>UPI (Google Pay, PhonePe, Paytm)</span>
                  </div>
                </div>
                <div id="upi-details-section" style="margin-left: 28px; margin-top: 4px;">
                  <input type="text" id="upi-id-input" class="app-input" placeholder="Enter UPI ID (e.g., username@okaxis)" style="font-size: 0.88rem; padding: 10px; width: 100%; max-width: 320px;">
                </div>
              </label>

              <!-- Credit/Debit Card Option -->
              <label class="payment-option-label" style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <input type="radio" name="payment-method" value="card" style="accent-color: var(--color-accent);">
                  <div style="font-weight: 700; color: var(--text-primary);">Credit or Debit Card</div>
                </div>
                <div id="card-details-section" style="margin-left: 28px; margin-top: 4px; display: none; flex-direction: column; gap: 10px; width: 100%; max-width: 340px;">
                  <input type="text" id="card-number-input" class="app-input" placeholder="Card Number (16 digits)" maxlength="19" style="font-size: 0.88rem; padding: 10px;">
                  <div style="display: flex; gap: 10px;">
                    <input type="text" id="card-expiry-input" class="app-input" placeholder="MM/YY" maxlength="5" style="font-size: 0.88rem; padding: 10px; flex: 1;">
                    <input type="password" id="card-cvv-input" class="app-input" placeholder="CVV" maxlength="3" style="font-size: 0.88rem; padding: 10px; flex: 1;">
                  </div>
                  <input type="text" id="card-name-input" class="app-input" placeholder="Cardholder Name" style="font-size: 0.88rem; padding: 10px;">
                </div>
              </label>

              <!-- Net Banking Option -->
              <label class="payment-option-label" style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <input type="radio" name="payment-method" value="netbanking" style="accent-color: var(--color-accent);">
                  <div style="font-weight: 700; color: var(--text-primary);">Net Banking</div>
                </div>
                <div id="netbanking-details-section" style="margin-left: 28px; margin-top: 4px; display: none;">
                  <select id="netbanking-bank-select" class="sort-select" style="font-size: 0.88rem; padding: 10px; width: 100%; max-width: 320px;">
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                  </select>
                </div>
              </label>

              <!-- Cash on Delivery Option -->
              <label class="payment-option-label" style="display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <input type="radio" name="payment-method" value="cod" style="accent-color: var(--color-accent);">
                  <div style="font-weight: 700; color: var(--text-primary);">Cash on Delivery (COD)</div>
                </div>
                <div id="cod-details-section" style="margin-left: 28px; margin-top: 4px; display: none; font-size: 0.85rem; color: var(--text-secondary);">
                  Pay with cash or scan payment QR code upon delivery of your products.
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Right Panel: Summary & Order Button -->
        <div style="background: var(--bg-card); padding: 24px; border-radius: var(--radius-xl); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 20px; position: sticky; top: 90px;">
          <h3 style="font-size: 1.20rem; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 14px;">Order Details</h3>
          
          <!-- Small Items List -->
          <div style="max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom: 14px;">
            ${AppState.cart.map(item => `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem;">
                <span style="color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
                  ${item.product.name} <strong style="color: var(--text-primary);">x${item.qty}</strong>
                </span>
                <span style="font-weight: 700; color: var(--text-primary);">₹${(item.product.numericPrice * item.qty).toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Subtotal</span>
              <strong style="color: var(--text-primary);">₹${subtotal.toLocaleString('en-IN')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Shipping Fee</span>
              <span style="color: var(--color-success); font-weight: 700;">${shipping === 0 ? 'FREE' : '₹99'}</span>
            </div>
          </div>

          <div style="border-top: 1px dashed var(--border-color); padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">Grand Total</span>
            <span style="font-size: 1.35rem; font-weight: 800; color: var(--color-accent);">₹${total.toLocaleString('en-IN')}</span>
          </div>

          <button class="btn-primary-action" id="checkout-pay-btn" style="width: 100%; justify-content: center; padding: 14px; font-size: 1rem; margin-top: 10px;">
            <span id="checkout-pay-btn-text">Pay & Place Order</span>
          </button>
        </div>
      </div>
    `;

    viewContainer.innerHTML = contentHtml;

    // Address section actions
    const selectAddr = document.getElementById('checkout-address-select');
    const manageAddrBtn = document.getElementById('checkout-manage-address-btn');
    const addAddrBtn = document.getElementById('checkout-add-address-btn');

    if (selectAddr) {
      selectAddr.addEventListener('change', (e) => {
        AddressService.setDefault(e.target.value);
        renderCheckoutView();
      });
    }

    if (manageAddrBtn) {
      manageAddrBtn.addEventListener('click', () => {
        // Open the address management modal
        const addressModal = document.getElementById('address-modal-overlay');
        if (addressModal) addressModal.classList.remove('hidden');
      });
    }

    if (addAddrBtn) {
      addAddrBtn.addEventListener('click', () => {
        // Open the address modal
        const addressModal = document.getElementById('address-modal-overlay');
        if (addressModal) {
          addressModal.classList.remove('hidden');
          // Show form inside modal directly
          const form = document.getElementById('address-form');
          const addTrigger = document.getElementById('add-address-trigger');
          if (form && addTrigger) {
            form.reset();
            document.getElementById('address-edit-id').value = '';
            document.getElementById('address-form-title').textContent = 'Add New Address';
            addTrigger.style.display = 'none';
            form.style.display = 'flex';
          }
        }
      });
    }

    // Toggle Payment Method view forms
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
    const sections = {
      upi: document.getElementById('upi-details-section'),
      card: document.getElementById('card-details-section'),
      netbanking: document.getElementById('netbanking-details-section'),
      cod: document.getElementById('cod-details-section')
    };

    paymentRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const val = e.target.value;
        // Show/hide relative detail forms
        Object.keys(sections).forEach(k => {
          if (sections[k]) {
            sections[k].style.display = k === val ? (k === 'card' ? 'flex' : 'block') : 'none';
          }
        });
      });
    });

    // Formatting Inputs CVV, Expiry, Card Number
    const cardNum = document.getElementById('card-number-input');
    if (cardNum) {
      cardNum.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let matches = v.match(/\d{4,16}/g);
        let match = matches && matches[0] || '';
        let parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
          parts.push(match.substring(i, i + 4));
        }
        if (parts.length > 0) {
          e.target.value = parts.join(' ');
        } else {
          e.target.value = v;
        }
      });
    }

    const cardExpiry = document.getElementById('card-expiry-input');
    if (cardExpiry) {
      cardExpiry.addEventListener('input', (e) => {
        let v = e.target.value.replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
          e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
        } else {
          e.target.value = v;
        }
      });
    }

    // Place Order Pay click
    const payBtn = document.getElementById('checkout-pay-btn');
    const payBtnText = document.getElementById('checkout-pay-btn-text');

    if (payBtn) {
      payBtn.addEventListener('click', () => {
        if (addresses.length === 0) {
          showToast('Please add a delivery address first!', 'error');
          return;
        }

        const activePayment = document.querySelector('input[name="payment-method"]:checked').value;

        // Validations
        if (activePayment === 'upi') {
          const upiId = document.getElementById('upi-id-input').value.trim();
          if (!upiId || !upiId.includes('@')) {
            showToast('Please enter a valid UPI ID (e.g. username@okaxis)', 'error');
            return;
          }
        } else if (activePayment === 'card') {
          const num = document.getElementById('card-number-input').value.trim();
          const exp = document.getElementById('card-expiry-input').value.trim();
          const cvv = document.getElementById('card-cvv-input').value.trim();
          const name = document.getElementById('card-name-input').value.trim();

          if (num.replace(/\s/g, '').length < 16) {
            showToast('Please enter a valid 16-digit card number', 'error');
            return;
          }
          if (exp.length < 5 || !exp.includes('/')) {
            showToast('Please enter a valid card expiry (MM/YY)', 'error');
            return;
          }
          if (cvv.length < 3) {
            showToast('Please enter a valid 3-digit CVV number', 'error');
            return;
          }
          if (!name) {
            showToast('Please enter the cardholder name', 'error');
            return;
          }
        }

        // Processing order placement
        payBtn.disabled = true;
        payBtn.style.opacity = '0.7';
        payBtn.style.cursor = 'not-allowed';
        payBtnText.innerHTML = `<span class="loading-spinner-inline" style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-radius:50%; border-top-color:transparent; animation:spin 0.8s linear infinite; margin-right:8px;"></span> Processing Secure Payment...`;

        setTimeout(() => {
          // Address details string
          const targetAddrId = selectAddr ? selectAddr.value : (selectedAddress?.id || 'addr_1');
          const targetAddr = addresses.find(a => a.id == targetAddrId) || selectedAddress;
          const addressTextStr = `${targetAddr.name}, ${targetAddr.addressLine}, ${targetAddr.city}, ${targetAddr.state} - ${targetAddr.pincode}`;

          // Create new order object
          const newOrder = {
            id: 'HYP-' + Math.floor(100000 + Math.random() * 900000),
            userId: AppState.user?.id || 'guest',
            userEmail: AppState.user?.email || 'guest@example.com',
            customerName: AppState.user?.name || 'Guest User',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            items: AppState.cart.reduce((s, i) => s + i.qty, 0),
            itemsDetail: AppState.cart.map(item => ({
              id: item.product.id,
              name: item.product.name,
              img: item.product.img,
              price: item.product.price,
              quantity: item.qty
            })),
            total: `₹${total.toLocaleString('en-IN')}`,
            status: 'Processing',
            statusClass: 'pending',
            address: addressTextStr,
            paymentMethod: activePayment.toUpperCase()
          };

          // Save order
          OrderService.add(newOrder);

          // Trigger order placed notification
          if (typeof addNotification === 'function') {
            addNotification({
              id: 'notif_' + Date.now(),
              category: 'order',
              subType: 'Order Placed',
              title: 'Order Placed Successfully! 🛒',
              desc: `Your order #${newOrder.id} has been placed and is currently being processed.`,
              time: 'Just now',
              timestamp: Date.now(),
              unread: true,
              priority: 'high',
              actionUrl: 'orders',
              actionText: 'Track Order'
            });
          }

          // Clear cart
          AppState.cart = [];
          if (typeof updateCartBadge === 'function') updateCartBadge();

          showToast('Payment successful! Your order has been placed.', 'success');

          // Redirect to orders view
          renderView('orders');
        }, 1500);
      });
    }

    applyTranslations();
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

  // Render Product Listing View (Initial Frame Layout)
  function renderProductListingView(overrideCategory = null) {
    if (!viewContainer) return;

    const cat = overrideCategory || AppState.selectedCategory;
    if (cat) {
      AppState.listingFilters.categories = [cat];
      AppState.selectedCategory = null;
    }

    syncFiltersToURL();

    const allProducts = ApiService.getMockData('products');
    const brandCounts = getBrandProductCounts(allProducts);
    const availableBrands = ['Noise', 'boAt', 'Canon', 'Hype', 'Apple', 'Nike', 'Adidas', 'Sony', 'HypeMan', 'HypeWoman', 'HypeFit', 'HypeTech', 'HypeFoot', 'HypePack', 'HypeSound', 'HypeStore', 'HypeGlow'];
    const availableCategories = ApiService.getMockData('categories').map(c => c.name);
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

    const f = AppState.listingFilters;

    const contentHtml = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="#home" data-nav-target="home" data-i18n="home">Home</a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current" data-i18n="shop_products">Shop Products</span>
      </nav>

      <div class="listing-header-row">
        <div>
          <div class="shop-title-wrapper" style="display: flex; align-items: center; gap: 12px;">
            <h2 class="view-title" data-i18n="product_catalog">Product Catalog</h2>
            <span class="product-count-badge-pill" id="product-count-badge">0 Products</span>
          </div>
          <p class="view-subtitle" id="product-count-subtitle">Showing 0 matching products</p>
        </div>

        <div class="listing-controls-bar">
          <button class="mobile-filter-trigger-btn" id="open-mobile-filter-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span>Filters & Sort</span>
          </button>

          <div class="view-mode-toggle">
            <button class="view-mode-btn ${AppState.viewMode === 'grid' ? 'active' : ''}" id="view-mode-grid-btn" title="Grid View" aria-label="Grid View">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
            <button class="view-mode-btn ${AppState.viewMode === 'list' ? 'active' : ''}" id="view-mode-list-btn" title="List View" aria-label="List View">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>

          <div class="custom-sort-dropdown-wrap">
            <select id="sort-select" class="sort-select" aria-label="Sort products">
              <option value="popularity" ${AppState.sortOption === 'popularity' ? 'selected' : ''} data-i18n="sort_popularity">Sort by: Popularity</option>
              <option value="newest" ${AppState.sortOption === 'newest' ? 'selected' : ''} data-i18n="sort_newest">Sort by: Newest</option>
              <option value="price-asc" ${AppState.sortOption === 'price-asc' ? 'selected' : ''} data-i18n="sort_low_high">Price: Low → High</option>
              <option value="price-desc" ${AppState.sortOption === 'price-desc' ? 'selected' : ''} data-i18n="sort_high_low">Price: High → Low</option>
              <option value="rating" ${AppState.sortOption === 'rating' ? 'selected' : ''} data-i18n="sort_rating">Highest Rated</option>
              <option value="bestselling" ${AppState.sortOption === 'bestselling' ? 'selected' : ''} data-i18n="sort_bestselling">Best Selling</option>
              <option value="discount" ${AppState.sortOption === 'discount' ? 'selected' : ''} data-i18n="sort_discount">Discount %</option>
            </select>
          </div>
        </div>
      </div>

      <div id="active-filters-bar-slot"></div>

      <div class="listing-layout">
        <!-- Desktop Filter Sidebar -->
        <aside class="filter-sidebar" id="shop-filter-sidebar">
          
          <!-- Category Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="categories">Categories</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
              <div class="filter-options-list">
                ${availableCategories.map(c => {
      const checked = (f.categories || []).includes(c);
      return `
                    <div class="filter-checkbox-item" data-filter-type="category" data-filter-val="${c}">
                      <div class="filter-checkbox-left">
                        <div class="custom-checkbox ${checked ? 'checked' : ''}">
                          <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span data-i18n="category_${c.toLowerCase().replace(/ & /g, '_and_').replace(/ /g, '_')}">${c}</span>
                      </div>
                    </div>
                  `;
    }).join('')}
              </div>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Brand Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="brands">Brands</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
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
          </div>

          <div class="filter-divider"></div>

          <!-- Price Filter (Slider & Inputs & Presets) -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="price_range">Price Range</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
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
                <div class="price-slider-fill" style="left: ${(f.minPrice / 100000) * 100}%; right: ${100 - (f.maxPrice / 100000) * 100}%;"></div>
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
          </div>

          <div class="filter-divider"></div>

          <!-- Rating Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="customer_rating">Customer Rating</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
              <div class="rating-stars-list">
                ${[4, 3, 2, 1].map(r => `
                  <div class="rating-filter-row ${f.minRating === r ? 'selected' : ''}" data-rating-val="${r}">
                    <span class="gold-stars">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span>
                    <span>${r}★ & Above</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Discount Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="discount">Discount</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
              <div class="badge-chips-wrap">
                ${[10, 20, 30, 40, 50].map(d => `
                  <button class="badge-chip ${f.discount === d ? 'selected' : ''}" data-discount-val="${d}">
                    ${d}%+ Off
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Availability Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="availability">Availability</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
              <div class="filter-options-list">
                <div class="filter-checkbox-item" data-filter-type="availability" data-filter-val="in-stock">
                  <div class="filter-checkbox-left">
                    <div class="custom-checkbox ${(f.availability || []).includes('in-stock') ? 'checked' : ''}"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                    <span data-i18n="in_stock">In Stock</span>
                  </div>
                </div>
                <div class="filter-checkbox-item" data-filter-type="availability" data-filter-val="out-of-stock">
                  <div class="filter-checkbox-left">
                    <div class="custom-checkbox ${(f.availability || []).includes('out-of-stock') ? 'checked' : ''}"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>
                    <span data-i18n="out_of_stock">Out of Stock</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Color Swatches Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="colors">Colors</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
              <div class="color-swatches-grid">
                ${availableColors.map(color => {
      const selected = (f.colors || []).includes(color.name);
      return `
                    <button class="color-swatch-item ${selected ? 'selected' : ''}" data-color-val="${color.name}" style="background-color: ${color.hex};" title="${color.name}"></button>
                  `;
    }).join('')}
              </div>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Size Filter -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span data-i18n="sizes">Sizes</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
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
          </div>

          <div class="filter-divider"></div>

          <!-- Special & Shipping Filters -->
          <div class="filter-group">
            <div class="filter-group-header">
              <span>Special & Shipping</span>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="filter-options-container">
              <div class="badge-chips-wrap">
                <button class="badge-chip ${(f.shipping || []).includes('free') ? 'selected' : ''}" data-shipping-val="free">Free Shipping</button>
                <button class="badge-chip ${(f.shipping || []).includes('express') ? 'selected' : ''}" data-shipping-val="express">Express Delivery</button>
                <button class="badge-chip ${(f.special || []).includes('new-arrivals') ? 'selected' : ''}" data-special-val="new-arrivals">New Arrivals</button>
                <button class="badge-chip ${(f.special || []).includes('best-sellers') ? 'selected' : ''}" data-special-val="best-sellers">Best Sellers</button>
                <button class="badge-chip ${(f.special || []).includes('featured') ? 'selected' : ''}" data-special-val="featured">Featured</button>
              </div>
            </div>
          </div>

        </aside>

        <!-- Product Grid / List Section -->
        <div id="product-grid-container"></div>
      </div>

    `;

    viewContainer.innerHTML = contentHtml;
    bindListingEvents();
    updateShopProductResultsOnly(false);
  }

  // Update Only Shop Products Results Grid & Count Pill Dynamically (Without Page Reload)
  let filterDebounceTimer = null;
  function updateShopProductResultsOnly(showSkeleton = true) {
    const gridContainer = document.getElementById('product-grid-container');
    if (!gridContainer) {
      renderProductListingView();
      return;
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

    // 1. Update Title Badges & Count Subtitle
    const badgePill = document.getElementById('product-count-badge');
    const subtitle = document.getElementById('product-count-subtitle');
    if (badgePill) badgePill.textContent = `${totalCount} ${totalCount === 1 ? 'Product' : 'Products'}`;
    if (subtitle) subtitle.textContent = `Showing ${paginatedProducts.length} of ${totalCount} matching products`;

    // 2. Active Filter Chips Builder & Renderer
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

    const activeFiltersSlot = document.getElementById('active-filters-bar-slot');
    if (activeFiltersSlot) {
      activeFiltersSlot.innerHTML = activeFilterPills.length > 0 ? `
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
      bindActiveChipRemoveEvents();
    }

    // 3. Sync Existing Sidebar DOM Controls in Place
    syncSidebarFiltersState(f, brandCounts);

    // 4. Update Product Grid with Smooth Skeleton Loader
    if (showSkeleton) {
      gridContainer.innerHTML = Skeletons.productGrid(4);
    }

    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(() => {
      renderGridContent(gridContainer, paginatedProducts, totalPages);
      bindProductCardListeners();
      bindPaginationEvents();
      bindEmptyStateEvents();
    }, showSkeleton ? 180 : 0);
  }

  function renderGridContent(gridContainer, paginatedProducts, totalPages) {
    if (paginatedProducts.length === 0) {
      gridContainer.innerHTML = `
        <div class="filter-empty-state-card">
          <div class="empty-state-icon-circle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width: 42px; height: 42px; color: var(--color-accent);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </div>
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary);">No Matching Products Found</h3>
          <p style="color: var(--text-secondary); max-width: 460px; font-size: 0.95rem; line-height: 1.6;">
            ${AppState.searchQuery ? `We couldn't find any products matching "<strong>${AppState.searchQuery}</strong>".` : `No products match all selected filter criteria.`} Try clearing some filters or searching for another keyword.
          </p>
          <div class="empty-state-actions-row">
            <button class="btn-primary-action" id="empty-clear-filters-btn" style="padding: 10px 22px; font-weight: 700;">Clear All Filters</button>
            <button class="btn-secondary-action" id="empty-continue-btn" style="padding: 10px 22px; font-weight: 600;">Browse All Products</button>
          </div>
          <div class="suggested-categories-pills" style="margin-top: 18px;">
            <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 10px;">Popular Categories to Explore:</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
              ${['Electronics', 'Men', 'Women', 'Shoes', 'Accessories', 'Smart Watch'].map(c => `
                <button class="suggested-cat-chip" data-cat-name="${c}">${c}</button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      gridContainer.innerHTML = `
        <div class="products-grid ${AppState.viewMode === 'list' ? 'list-view' : ''}">
          ${paginatedProducts.map(p => {
        const isOutOfStock = p.inStock === false || (p.stockCount !== undefined && p.stockCount <= 0);
        const isWishlisted = WishlistService.has(p.id);
        return `
              <div class="product-card ${isOutOfStock ? 'out-of-stock-card' : ''}" data-product-id="${p.id}">
                <div class="product-card-top">
                  ${isOutOfStock ? `<span class="discount-badge out-of-stock-badge" style="background-color: #ef4444; color: white;">Out of Stock</span>` : `<span class="discount-badge">${p.badge}</span>`}
                  <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" aria-label="Add to wishlist" data-product-id="${p.id}">
                    <svg class="heart-icon" viewBox="0 0 24 24" fill="${isWishlisted ? 'var(--color-danger)' : 'none'}" stroke="${isWishlisted ? 'var(--color-danger)' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                  <div class="product-img-wrapper" style="${isOutOfStock ? 'opacity: 0.55;' : ''}">
                    <img src="${p.img}" alt="${p.name}" class="product-img" loading="lazy">
                    <button class="quickview-overlay-btn ripple-button" data-quick-view-id="${p.id}">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>
                <div class="product-card-bottom">
                  <div class="product-details">
                    <span class="product-cat">${p.brand} • ${p.cat}</span>
                    <h3 class="product-name" title="${p.name}">${p.name}</h3>
                    <div class="details-rating-row">
                      <span class="rating-stars">★★★★★</span>
                      <span class="rating-text">${p.rating} <span class="review-count">(${p.reviewCount})</span></span>
                    </div>
                    <div class="product-price-row">
                      <span class="price-current">${p.price}</span>
                      <span class="price-original">${p.originalPrice}</span>
                      ${p.discount ? `<span class="price-discount-tag">${p.discount}% OFF</span>` : ''}
                    </div>
                  </div>
                  <div class="card-action-btns" style="display: flex; gap: 8px; margin-top: 10px;">
                    <button class="btn-secondary-action quick-view-btn" data-quick-view-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem;">Quick View</button>
                    <button class="add-to-cart-btn ripple-button" data-product-id="${p.id}" title="${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}" ${isOutOfStock ? 'disabled style="opacity: 0.4; cursor: not-allowed; pointer-events: none;"' : ''}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
      }).join('')}
        </div>

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
      `;
    }
  }

  function syncSidebarFiltersState(f, brandCounts) {
    document.querySelectorAll('.filter-checkbox-item[data-filter-type]').forEach(item => {
      const type = item.getAttribute('data-filter-type');
      const val = item.getAttribute('data-filter-val');
      const key = type === 'category' ? 'categories' : (type === 'brand' ? 'brands' : 'availability');
      const isChecked = (f[key] || []).includes(val);
      const checkbox = item.querySelector('.custom-checkbox');
      if (checkbox) checkbox.classList.toggle('checked', isChecked);
      if (type === 'brand') {
        const badge = item.querySelector('.item-count-badge');
        if (badge) badge.textContent = brandCounts[val] || 0;
      }
    });

    const minInput = document.getElementById('min-price-input');
    const maxInput = document.getElementById('max-price-input');
    const minSlider = document.getElementById('min-price-slider');
    const maxSlider = document.getElementById('max-price-slider');
    const sliderFill = document.querySelector('.price-slider-fill');

    if (minInput && document.activeElement !== minInput) minInput.value = f.minPrice;
    if (maxInput && document.activeElement !== maxInput) maxInput.value = f.maxPrice;
    if (minSlider && document.activeElement !== minSlider) minSlider.value = f.minPrice;
    if (maxSlider && document.activeElement !== maxSlider) maxSlider.value = f.maxPrice;
    if (sliderFill) {
      sliderFill.style.left = `${(f.minPrice / 100000) * 100}%`;
      sliderFill.style.right = `${100 - (f.maxPrice / 100000) * 100}%`;
    }

    document.querySelectorAll('.rating-filter-row[data-rating-val]').forEach(row => {
      const val = parseFloat(row.getAttribute('data-rating-val'));
      row.classList.toggle('selected', f.minRating === val);
    });

    document.querySelectorAll('.badge-chip[data-discount-val]').forEach(btn => {
      const val = parseInt(btn.getAttribute('data-discount-val'), 10);
      btn.classList.toggle('selected', f.discount === val);
    });

    document.querySelectorAll('.color-swatch-item[data-color-val]').forEach(swatch => {
      const val = swatch.getAttribute('data-color-val');
      swatch.classList.toggle('selected', (f.colors || []).includes(val));
    });

    document.querySelectorAll('.size-pill-item[data-size-val]').forEach(pill => {
      const val = pill.getAttribute('data-size-val');
      pill.classList.toggle('selected', (f.sizes || []).includes(val));
    });

    document.querySelectorAll('.badge-chip[data-shipping-val]').forEach(btn => {
      const val = btn.getAttribute('data-shipping-val');
      btn.classList.toggle('selected', (f.shipping || []).includes(val));
    });

    document.querySelectorAll('.badge-chip[data-special-val]').forEach(btn => {
      const val = btn.getAttribute('data-special-val');
      btn.classList.toggle('selected', (f.special || []).includes(val));
    });
  }

  function bindActiveChipRemoveEvents() {
    document.querySelectorAll('#active-filters-bar-slot [data-remove-type]').forEach(btn => {
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

        updateShopProductResultsOnly();
      });
    });

    const clearBtn = document.getElementById('clear-all-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        AppState.listingFilters = {
          categories: [], brands: [], minPrice: 0, maxPrice: 100000, minRating: 0,
          discount: 0, availability: [], colors: [], sizes: [], shipping: [], special: []
        };
        updateShopProductResultsOnly();
      });
    }
  }

  function bindPaginationEvents() {
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.currentPage = parseInt(btn.getAttribute('data-page'), 10);
        updateShopProductResultsOnly(true);
      });
    });

    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => { AppState.currentPage--; updateShopProductResultsOnly(true); });
    if (nextBtn) nextBtn.addEventListener('click', () => { AppState.currentPage++; updateShopProductResultsOnly(true); });
  }

  function bindEmptyStateEvents() {
    const emptyClearBtn = document.getElementById('empty-clear-filters-btn');
    if (emptyClearBtn) {
      emptyClearBtn.addEventListener('click', () => {
        AppState.listingFilters = {
          categories: [], brands: [], minPrice: 0, maxPrice: 100000, minRating: 0,
          discount: 0, availability: [], colors: [], sizes: [], shipping: [], special: []
        };
        updateShopProductResultsOnly();
      });
    }

    const emptyContinueBtn = document.getElementById('empty-continue-btn');
    if (emptyContinueBtn) {
      emptyContinueBtn.addEventListener('click', () => {
        AppState.listingFilters = {
          categories: [], brands: [], minPrice: 0, maxPrice: 100000, minRating: 0,
          discount: 0, availability: [], colors: [], sizes: [], shipping: [], special: []
        };
        AppState.searchQuery = '';
        const globalSearch = document.getElementById('search-input');
        if (globalSearch) globalSearch.value = '';
        updateShopProductResultsOnly();
      });
    }

    document.querySelectorAll('.suggested-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const catName = chip.getAttribute('data-cat-name');
        if (catName) {
          AppState.listingFilters.categories = [catName];
          AppState.searchQuery = '';
          const sInput = document.getElementById('search-input');
          if (sInput) sInput.value = '';
          updateShopProductResultsOnly();
        }
      });
    });
  }

  function bindListingEvents() {
    // Accordion Toggle on Filter Group Headers
    document.querySelectorAll('.filter-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.filter-group');
        if (group) group.classList.toggle('collapsed');
      });
    });

    const gridBtn = document.getElementById('view-mode-grid-btn');
    const listBtn = document.getElementById('view-mode-list-btn');
    if (gridBtn && listBtn) {
      gridBtn.addEventListener('click', () => { AppState.viewMode = 'grid'; gridBtn.classList.add('active'); listBtn.classList.remove('active'); updateShopProductResultsOnly(false); });
      listBtn.addEventListener('click', () => { AppState.viewMode = 'list'; listBtn.classList.add('active'); gridBtn.classList.remove('active'); updateShopProductResultsOnly(false); });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        AppState.sortOption = e.target.value;
        updateShopProductResultsOnly();
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

        if (arr.includes(val)) arr = arr.filter(i => i !== val);
        else arr.push(val);
        AppState.listingFilters[key] = arr;
        updateShopProductResultsOnly();
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
        updateShopProductResultsOnly();
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
        updateShopProductResultsOnly();
      });
    });

    // Rating Filter Rows
    document.querySelectorAll('[data-rating-val]').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseFloat(row.getAttribute('data-rating-val'));
        AppState.listingFilters.minRating = AppState.listingFilters.minRating === val ? 0 : val;
        updateShopProductResultsOnly();
      });
    });

    // Discount Buttons
    document.querySelectorAll('[data-discount-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseInt(btn.getAttribute('data-discount-val'), 10);
        AppState.listingFilters.discount = AppState.listingFilters.discount === val ? 0 : val;
        updateShopProductResultsOnly();
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
        updateShopProductResultsOnly();
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
        updateShopProductResultsOnly();
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
        updateShopProductResultsOnly();
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
        updateShopProductResultsOnly();
      });
    });

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
      if (mobileClearBtn) mobileClearBtn.addEventListener('click', () => {
        AppState.listingFilters = {
          categories: [], brands: [], minPrice: 0, maxPrice: 100000, minRating: 0,
          discount: 0, availability: [], colors: [], sizes: [], shipping: [], special: []
        };
        updateShopProductResultsOnly();
        toggleMobileDrawer(false);
      });
      if (mobileApplyBtn) mobileApplyBtn.addEventListener('click', () => toggleMobileDrawer(false));
    }
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
              ${product.inStock !== false && (product.stockCount === undefined || product.stockCount > 0) ? `
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
              ` : `
                <button class="btn-primary-action" disabled style="opacity: 0.55; padding: 14px 28px; font-size: 0.95rem; cursor: not-allowed; background-color: var(--color-danger); border-color: var(--color-danger); color: white;">
                  <span>Currently Out of Stock</span>
                </button>
              `}
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
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Review Submission Form -->
          <form id="product-review-form" style="background: var(--bg-body); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0;">Write a Customer Review</h4>
            <div style="display: flex; gap: 12px; align-items: center;">
              <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Rating:</label>
              <select id="review-rating-select" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-weight: 700;">
                <option value="5">★★★★★ (5/5)</option>
                <option value="4">★★★★☆ (4/5)</option>
                <option value="3">★★★☆☆ (3/5)</option>
                <option value="2">★★☆☆☆ (2/5)</option>
                <option value="1">★☆☆☆☆ (1/5)</option>
              </select>
            </div>
            <textarea id="review-comment-input" rows="2" placeholder="Share details of your experience with this product..." style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 0.88rem; outline: none; resize: vertical;" required></textarea>
            <button type="submit" class="btn-primary-action" style="align-self: flex-start; padding: 8px 18px; font-size: 0.85rem;">Submit Review</button>
          </form>

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

    // Add to Cart in Product Details
    const addCartBtn = document.getElementById('details-add-to-cart-btn');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        const qty = parseInt(document.getElementById('qty-input')?.value || '1', 10);
        addToCart(product.id, qty);
      });
    }

    // Buy Now in Product Details
    const buyNowBtn = document.getElementById('details-buy-now-btn');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => {
        requireAuth('BUY_NOW', { pid: product.id }, () => {
          addToCart(product.id, 1);
          document.querySelectorAll('.product-details-modal-overlay').forEach(m => m.remove());
          document.body.style.overflow = 'auto';
          renderView('cart');
        });
      });
    }

    // Review Form submission binding
    const reviewForm = document.getElementById('product-review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = document.getElementById('review-rating-select')?.value || '5';
        const comment = document.getElementById('review-comment-input')?.value.trim();

        requireAuth('SUBMIT_REVIEW', { pid: product.id, rating, comment }, () => {
          showToast('Review submitted successfully! Thank you.', 'success');
          reviewForm.reset();
        });
      });
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        const pane = document.getElementById('tab-content-pane');
        if (pane) {
          pane.innerHTML = renderTabContent(tab, product);
          if (tab === 'reviews') {
            const rf = document.getElementById('product-review-form');
            if (rf) {
              rf.addEventListener('submit', (e) => {
                e.preventDefault();
                requireAuth('SUBMIT_REVIEW', { pid: product.id }, () => {
                  showToast('Review submitted successfully!', 'success');
                  rf.reset();
                });
              });
            }
          }
        }
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
        const catTarget = card.getAttribute('data-nav-target');
        if (catTarget) {
          renderView(catTarget);
          return;
        }
        const catTitle = card.getAttribute('data-category') || card.querySelector('.category-title')?.textContent?.trim();
        if (catTitle) {
          AppState.selectedCategory = catTitle;
          AppState.searchQuery = '';
          renderView('shop');
          showToast(`Filtered by ${catTitle}`, 'info');
        } else {
          renderView('categories');
        }
      });
    });

    // Intercept View All Products & Hero CTA links
    document.querySelectorAll('.view-all-link, .hero-cta-btn, .shop-now-btn').forEach(link => {
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
     Customer Support & Contact Us View
     ========================================================================== */
  function renderSupportView() {
    if (!viewContainer) return;

    const user = AuthService.getUser() || {};
    const defaultName = user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');
    const defaultEmail = user.email || '';
    const defaultPhone = user.phone || '';

    viewContainer.innerHTML = `
      <div class="support-container" role="region" aria-label="Customer Support and Contact Us">
        
        <!-- Hero Header -->
        <div class="support-hero">
          <div class="support-badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>24/7 Dedicated Support</span>
          </div>
          <h1>How Can We Help You?</h1>
          <p>Have a question about an order, delivery, payment, or website feature? Submit your query below or contact our support team directly.</p>
        </div>

        <!-- 2-Column Main Layout -->
        <div class="support-grid">
          
          <!-- Column 1: Query Form Card -->
          <div class="support-card" id="support-form-card">
            <h2 class="support-card-title">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--color-accent);"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Submit a Query</span>
            </h2>
            <p class="support-card-subtitle">Fill in the details below and our customer support team will investigate and respond within 24 hours.</p>

            <div id="support-form-alert" class="hidden" style="padding: 12px 16px; border-radius: var(--radius-md); background: rgba(231, 29, 54, 0.1); border: 1px solid var(--color-danger); color: var(--color-danger); margin-bottom: 20px; font-size: 0.88rem; font-weight: 500;"></div>

            <form id="support-query-form" novalidate aria-label="Customer support query form">
              
              <!-- Full Name & Email -->
              <div class="support-form-row">
                <div class="support-form-group">
                  <label for="support-name" class="support-label">
                    <span>Full Name <span class="required-star">*</span></span>
                  </label>
                  <input type="text" id="support-name" class="support-input" placeholder="e.g. Rahul Sharma" value="${defaultName}" required aria-required="true" aria-describedby="err-support-name">
                  <span class="support-field-error" id="err-support-name"></span>
                </div>

                <div class="support-form-group">
                  <label for="support-email" class="support-label">
                    <span>Email Address <span class="required-star">*</span></span>
                  </label>
                  <input type="email" id="support-email" class="support-input" placeholder="e.g. rahul@example.com" value="${defaultEmail}" required aria-required="true" aria-describedby="err-support-email">
                  <span class="support-field-error" id="err-support-email"></span>
                </div>
              </div>

              <!-- Phone Number & Order ID -->
              <div class="support-form-row">
                <div class="support-form-group">
                  <label for="support-phone" class="support-label">
                    <span>Phone Number <span class="required-star">*</span></span>
                  </label>
                  <input type="tel" id="support-phone" class="support-input" placeholder="e.g. 9876543210" value="${defaultPhone}" required aria-required="true" aria-describedby="err-support-phone">
                  <span class="support-field-error" id="err-support-phone"></span>
                </div>

                <div class="support-form-group">
                  <label for="support-order-id" class="support-label">
                    <span>Order ID <span class="optional-tag">(Optional)</span></span>
                  </label>
                  <input type="text" id="support-order-id" class="support-input" placeholder="e.g. ORD-98214" aria-describedby="err-support-order-id">
                  <span class="support-field-error" id="err-support-order-id"></span>
                </div>
              </div>

              <!-- Query Type Dropdown -->
              <div class="support-form-group">
                <label for="support-query-type" class="support-label">
                  <span>Query Type <span class="required-star">*</span></span>
                </label>
                <select id="support-query-type" class="support-select" required aria-required="true" aria-describedby="err-support-query-type">
                  <option value="" disabled selected>-- Select Issue / Category --</option>
                  <option value="Order Issue">Order Issue</option>
                  <option value="Product Issue">Product Issue</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Delivery / Shipping Issue">Delivery / Shipping Issue</option>
                  <option value="Return / Refund Issue">Return / Refund Issue</option>
                  <option value="Account Issue">Account Issue</option>
                  <option value="Website Technical Issue">Website Technical Issue</option>
                  <option value="Product Quality Issue">Product Quality Issue</option>
                  <option value="General Query">General Query</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
                <span class="support-field-error" id="err-support-query-type"></span>
              </div>

              <!-- Subject -->
              <div class="support-form-group">
                <label for="support-subject" class="support-label">
                  <span>Subject <span class="required-star">*</span></span>
                </label>
                <input type="text" id="support-subject" class="support-input" placeholder="Brief summary of your query or issue" required aria-required="true" aria-describedby="err-support-subject" maxlength="150">
                <span class="support-field-error" id="err-support-subject"></span>
              </div>

              <!-- Description / Message -->
              <div class="support-form-group">
                <label for="support-message" class="support-label">
                  <span>Message / Description <span class="required-star">*</span></span>
                </label>
                <textarea id="support-message" class="support-textarea" placeholder="Please provide complete details regarding your issue, question, or feedback..." required aria-required="true" aria-describedby="err-support-message" maxlength="2000"></textarea>
                <span class="support-field-error" id="err-support-message"></span>
              </div>

              <!-- Optional Attachment Upload -->
              <div class="support-form-group">
                <label class="support-label">
                  <span>Attachment <span class="optional-tag">(Optional - Images/PDF up to 5MB)</span></span>
                </label>
                <div class="support-file-zone" id="file-drop-zone">
                  <input type="file" id="support-attachment" accept="image/png, image/jpeg, image/webp, application/pdf" aria-label="Upload optional file attachment">
                  <div class="support-file-info">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--text-muted);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Click or drag & drop to attach a file</span>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">Supported: PNG, JPG, WEBP, PDF (Max 5MB)</span>
                  </div>
                  <div id="file-selected-name" class="support-file-name"></div>
                </div>
                <span class="support-field-error" id="err-support-attachment"></span>
              </div>

              <!-- Submit Button -->
              <div style="margin-top: 10px;">
                <button type="submit" id="support-submit-btn" class="btn-primary-action" style="width: 100%; justify-content: center; padding: 14px 28px; font-size: 1rem;">Submit Query</button>
              </div>
            </form>
          </div>

          <!-- Column 2: Support Contact Info & FAQs -->
          <div style="display: flex; flex-direction: column; gap: 28px;">
            
            <!-- Support Information Card -->
            <div class="support-card">
              <h3 class="support-card-title" style="font-size: 1.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px; color: var(--color-accent);"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>Customer Support Details</span>
              </h3>
              <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">Reach out directly to our support team during working hours.</p>

              <div class="support-contact-list">
                <div class="support-contact-item">
                  <div class="support-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div class="support-contact-details">
                    <h5>Email Support</h5>
                    <p><a href="mailto:support@shopsphere.com" style="color: inherit; text-decoration: none;">support@shopsphere.com</a></p>
                    <span>Average response time: 2 hours</span>
                  </div>
                </div>

                <div class="support-contact-item">
                  <div class="support-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div class="support-contact-details">
                    <h5>Phone Support</h5>
                    <p><a href="tel:+918045678900" style="color: inherit; text-decoration: none;">+91 80 4567 8900</a></p>
                    <span>Toll-free customer hotline</span>
                  </div>
                </div>

                <div class="support-contact-item">
                  <div class="support-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div class="support-contact-details">
                    <h5>Support Hours</h5>
                    <p>Monday – Saturday</p>
                    <span>9:00 AM – 6:00 PM IST</span>
                  </div>
                </div>
              </div>

              <!-- Quick Action Links -->
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 24px; margin-bottom: 12px;">Quick Support Links</h4>
              <div class="support-quick-nav">
                <button class="support-quick-card" data-nav-target="orders">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  <span>Track Orders</span>
                </button>
                <button class="support-quick-card" data-nav-target="orders">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  <span>Return & Refund</span>
                </button>
              </div>
            </div>

            <!-- Frequently Asked Questions Accordion -->
            <div class="support-card">
              <h3 class="support-card-title" style="font-size: 1.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px; color: var(--color-accent);"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Frequently Asked Questions</span>
              </h3>

              <div class="support-faq-accordion">
                <div class="support-faq-item">
                  <button class="support-faq-question">
                    <span>How do I track my order shipment?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div class="support-faq-answer">
                    You can track your order status in real time by navigating to your <strong>Orders</strong> page in your account dashboard. Detailed tracking numbers and delivery estimates are provided once dispatched.
                  </div>
                </div>

                <div class="support-faq-item">
                  <button class="support-faq-question">
                    <span>What is your 30-day return policy?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div class="support-faq-answer">
                    We offer a hassle-free 30-day return policy for unused items in original packaging. You can initiate a return directly from the item details under your Orders section.
                  </div>
                </div>

                <div class="support-faq-item">
                  <button class="support-faq-question">
                    <span>How quickly will my support query be answered?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div class="support-faq-answer">
                    Our customer support team processes queries within 2 to 24 hours during working hours (Monday to Saturday, 9 AM to 6 PM IST). Urgent order issues receive priority handling.
                  </div>
                </div>

                <div class="support-faq-item">
                  <button class="support-faq-question">
                    <span>What payment methods are supported?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div class="support-faq-answer">
                    We support UPI, Credit/Debit Cards, NetBanking, Razorpay, and Cash on Delivery (COD) for eligible pin codes.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // File Attachment display update
    const fileInput = document.getElementById('support-attachment');
    const fileNameDisplay = document.getElementById('file-selected-name');

    if (fileInput && fileNameDisplay) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          if (file.size > 5 * 1024 * 1024) {
            document.getElementById('err-support-attachment').textContent = 'File size exceeds 5MB limit.';
            fileInput.value = '';
            fileNameDisplay.textContent = '';
            return;
          }
          document.getElementById('err-support-attachment').textContent = '';
          fileNameDisplay.innerHTML = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        } else {
          fileNameDisplay.textContent = '';
        }
      });
    }

    // FAQ Accordion Interactivity
    document.querySelectorAll('.support-faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.support-faq-item');
        if (item) {
          item.classList.toggle('active');
        }
      });
    });

    // Real-time Field Error Clearing
    const fieldsToClear = ['support-name', 'support-email', 'support-phone', 'support-query-type', 'support-subject', 'support-message'];
    fieldsToClear.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          el.classList.remove('is-invalid');
          const errEl = document.getElementById(`err-${id}`);
          if (errEl) errEl.textContent = '';
        });
        el.addEventListener('change', () => {
          el.classList.remove('is-invalid');
          const errEl = document.getElementById(`err-${id}`);
          if (errEl) errEl.textContent = '';
        });
      }
    });

    // Form Submission Logic
    const form = document.getElementById('support-query-form');
    const submitBtn = document.getElementById('support-submit-btn');
    const formAlert = document.getElementById('support-form-alert');

    if (form && submitBtn) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (formAlert) {
          formAlert.classList.add('hidden');
          formAlert.textContent = '';
        }

        const nameVal = document.getElementById('support-name')?.value.trim() || '';
        const emailVal = document.getElementById('support-email')?.value.trim() || '';
        const phoneVal = document.getElementById('support-phone')?.value.trim() || '';
        const typeVal = document.getElementById('support-query-type')?.value || '';
        const subjectVal = document.getElementById('support-subject')?.value.trim() || '';
        const messageVal = document.getElementById('support-message')?.value.trim() || '';
        const orderIdVal = document.getElementById('support-order-id')?.value.trim() || '';

        let isValid = true;

        if (!nameVal) {
          showFieldError('support-name', 'Full name is required.');
          isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) {
          showFieldError('support-email', 'Email address is required.');
          isValid = false;
        } else if (!emailRegex.test(emailVal)) {
          showFieldError('support-email', 'Please enter a valid email address.');
          isValid = false;
        }

        const phoneDigits = phoneVal.replace(/\D/g, '');
        if (!phoneVal) {
          showFieldError('support-phone', 'Phone number is required.');
          isValid = false;
        } else if (phoneDigits.length < 10) {
          showFieldError('support-phone', 'Please enter a valid 10-digit phone number.');
          isValid = false;
        }

        if (!typeVal) {
          showFieldError('support-query-type', 'Please select a query type.');
          isValid = false;
        }

        if (!subjectVal) {
          showFieldError('support-subject', 'Subject is required.');
          isValid = false;
        } else if (subjectVal.length < 5) {
          showFieldError('support-subject', 'Subject must be at least 5 characters long.');
          isValid = false;
        }

        if (!messageVal) {
          showFieldError('support-message', 'Message description is required.');
          isValid = false;
        } else if (messageVal.length < 10) {
          showFieldError('support-message', 'Message must be at least 10 characters long.');
          isValid = false;
        }

        if (!isValid) return;

        submitBtn.disabled = true;

        try {
          const payload = {
            name: nameVal,
            email: emailVal,
            phone: phoneVal,
            queryType: typeVal,
            subject: subjectVal,
            description: messageVal,
            orderId: orderIdVal || null
          };

          const response = await ApiService.submitSupportTicket(payload);

          submitBtn.disabled = false;

          if (response && (response.status === 'success' || response.data)) {
            const ticketRef = response.data?.ticketId || '#SUP-' + Math.floor(10000 + Math.random() * 90000);

            showToast('Your query has been submitted successfully.', 'success');

            const formCard = document.getElementById('support-form-card');
            if (formCard) {
              formCard.innerHTML = `
                <div class="support-success-card">
                  <div class="support-success-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Query Submitted Successfully!</h2>
                  <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 480px; margin: 0 auto; line-height: 1.6;">
                    Thank you for reaching out to ShopSphere Customer Support. Our team has received your ticket and will respond to <strong>${emailVal}</strong> within 24 hours.
                  </p>

                  <div>
                    <span class="support-ref-badge">Reference ID: ${ticketRef}</span>
                  </div>

                  <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn-primary-action" id="submit-another-query-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span>Submit Another Query</span>
                    </button>
                    <button class="btn-secondary-action" data-nav-target="home" id="query-success-home-btn">Go to Home</button>
                  </div>
                </div>
              `;

              const resetBtn = document.getElementById('submit-another-query-btn');
              if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                  renderSupportView();
                });
              }

              const homeBtn = document.getElementById('query-success-home-btn');
              if (homeBtn) {
                homeBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  const homeNavItem = document.querySelector('.nav-item[data-nav="home"]');
                  if (homeNavItem) {
                    homeNavItem.click();
                  } else {
                    renderView('home');
                  }
                });
              }
            }
          } else {
            throw new Error(response?.message || 'Server response invalid');
          }

        } catch (error) {
          console.error('Support query submission error:', error);
          submitBtn.disabled = false;

          if (formAlert) {
            formAlert.textContent = 'Failed to submit support query. Please check your network connection and try again.';
            formAlert.classList.remove('hidden');
          }
          showToast('Failed to submit query. Please try again.', 'error');
        }
      });
    }
  }

  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(`err-${fieldId}`);
    if (field) field.classList.add('is-invalid');
    if (errEl) errEl.textContent = message;
  }

  /* ==========================================================================
     View Renderer Router & Unknown Route Catch-All
     ========================================================================== */
  const viewContainer = document.getElementById('view-container');
  const defaultHomeHtml = viewContainer ? viewContainer.innerHTML : '';

  // Registry of valid system view routes
  const VALID_ROUTES = ['home', 'shop', 'categories', 'wishlist', 'orders', 'profile', 'cart', 'checkout', 'search', 'support', 'contact', 'product-not-found', 'category-not-found', '404'];

  function renderView(viewName, overrideState) {
    if (['profile', 'orders', 'wishlist'].includes(viewName) && !AuthService.isAuthenticated()) {
      requireAuth(viewName.toUpperCase(), { viewName }, () => {
        renderView(viewName, overrideState);
      });
      return;
    }

    AppState.currentView = viewName;
    const targetState = overrideState || AppState.simulatedState;

    if (viewName === 'cart') {
      renderCartView();
      return;
    }

    if (viewName === 'checkout') {
      renderCheckoutView();
      return;
    }

    if (viewName === 'notifications') {
      renderNotificationsView(overrideState);
      return;
    }

    if (viewName === 'support' || viewName === 'contact') {
      renderSupportView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (!data || data.length === 0) {
        contentHtml = `
          <div class="view-section-header">
            <div>
              <h2 class="view-title" data-i18n="wishlist">Saved Wishlist</h2>
              <p class="view-subtitle" data-i18n="wishlist_empty_desc">Your wishlist is currently empty</p>
            </div>
          </div>
          <div class="empty-state-card">
            <div class="empty-state-illustration" style="background: rgba(236, 72, 153, 0.1); color: #ec4899;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="stroke: #ec4899;">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3 class="empty-state-title" data-i18n="wishlist_empty">Your Wishlist is Empty</h3>
            <p class="empty-state-desc" data-i18n="wishlist_empty_desc">
              Save your favorite items here to track their availability, price drops, and get notifications!
            </p>
            <div class="empty-state-actions">
              <button class="btn-primary-action" id="wishlist-empty-browse-btn" style="padding: 12px 30px; border-radius: 30px; background: var(--text-primary); color: var(--bg-body); font-weight: 700;">
                <span data-i18n="explore_products">Browse Products</span> &nbsp; ➜
              </button>
            </div>
          </div>
        `;
      } else {
        contentHtml = `
          <div class="view-section-header">
            <div>
              <h2 class="view-title" data-i18n="wishlist">Saved Wishlist</h2>
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
      }
    } else if (viewName === 'categories') {
      contentHtml = `
        <div class="view-section-header" style="margin-bottom: 24px;">
          <div>
            <h2 class="view-title" style="font-size: 1.8rem; font-weight: 800;">Product Categories</h2>
            <p class="view-subtitle" style="color: var(--text-secondary); margin-top: 4px; font-size: 0.95rem; font-weight: 500;">Explore all 27 departments</p>
          </div>
        </div>
        <div class="category-grid">
          ${data.map(c => `
            <a href="#" class="category-card" style="--card-bg: ${c.bg};" data-category="${c.name}">
              <div class="category-info">
                <span class="category-title" data-i18n="category_${c.name.toLowerCase().replace(/ & /g, '_and_').replace(/ /g, '_')}">${c.name}</span>
                <span class="category-subtitle" data-i18n="subtitle_${c.subtitle.toLowerCase().replace(/ & /g, '_and_').replace(/ /g, '_')}">${c.subtitle}</span>
              </div>
              ${c.img ? `<img src="${c.img}" alt="${c.name}" class="category-img">` : (c.svg || '')}
            </a>
          `).join('')}
        </div>
      `;
    } else if (viewName === 'orders') {
      if (!data || data.length === 0) {
        contentHtml = `
          <div class="view-section-header">
            <div>
              <h2 class="view-title" data-i18n="orders">Your Orders</h2>
              <p class="view-subtitle" data-i18n="orders_empty_desc">No orders found</p>
            </div>
          </div>
          <div class="empty-state-card">
            <div class="empty-state-illustration" style="background: rgba(37, 99, 235, 0.1); color: #2563eb;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="stroke: #2563eb;">
                <polyline points="21 8 21 21 3 21 3 8"/>
                <rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
            </div>
            <h3 class="empty-state-title" data-i18n="orders_empty">No Orders Yet</h3>
            <p class="empty-state-desc" data-i18n="orders_empty_desc">
              You have not placed any orders yet. Once you complete a purchase, your order history will appear here!
            </p>
            <div class="empty-state-actions">
              <button class="btn-primary-action" id="orders-empty-browse-btn" style="padding: 12px 30px; border-radius: 30px; background: var(--text-primary); color: var(--bg-body); font-weight: 700;">
                <span data-i18n="shop_now">Shop Now</span> &nbsp; ➜
              </button>
            </div>
          </div>
        `;
      } else {
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
      }
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
      const u = AuthService.getUser() || { id: 'usr_guest', name: 'User', email: 'user@example.com', phone: '+91 98765 43210' };
      const initials = (u.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const nameParts = (u.name || 'User').split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Fetch user's previous orders
      const ordersList = [];
      try {
        const stored = localStorage.getItem('shopsphere_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          ordersList.push(...parsed.filter(o => o.userId === u.id || o.userEmail === u.email || o.customerName === u.name));
        }
      } catch (err) { }

      let ordersHtml = '';
      if (ordersList.length === 0) {
        ordersHtml = `<p style="font-size: 0.9rem; color: var(--text-secondary);">No previous orders found. Place an order to see it here!</p>`;
      } else {
        ordersHtml = ordersList.map(o => {
          const details = o.itemsDetail || [
            { id: 1, name: 'Noise Ultra 2 Max', price: o.total, img: 'assets/images/prod_watch.png', quantity: o.items || 1 }
          ];

          const itemsListHtml = details.map(item => {
            const currentSavedRating = typeof getSavedProductRating === 'function' ? getSavedProductRating(u.id, item.id) : 0;
            return `
              <div class="product-purchase-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="${item.img}" style="width: 45px; height: 45px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-body);">
                  <div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${item.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${item.price} x ${item.quantity}</div>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Rate this product:</span>
                  <div class="profile-star-rating-widget" data-product-id="${item.id}" style="display: flex; gap: 4px; color: #a0a4b8; cursor: pointer;">
                    ${[1, 2, 3, 4, 5].map(star => `
                      <span class="profile-star-item" data-value="${star}" style="font-size: 1.25rem; transition: color 0.15s; color: ${currentSavedRating >= star ? '#ffb703' : 'inherit'};">★</span>
                    `).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('');

          return `
            <div style="background: var(--bg-body); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <div>
                  <span style="font-size: 0.82rem; font-weight: bold; font-family: monospace; color: var(--text-primary);">ORDER #${o.id}</span>
                  <span style="font-size: 0.78rem; color: var(--text-secondary); margin-left: 8px;">(${o.date})</span>
                </div>
                <span class="status-pill ${o.statusClass || 'success'}">${o.status}</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${itemsListHtml}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.9rem;">
                <span style="color: var(--text-secondary);">Payment Method: <strong>${o.paymentMethod || 'COD'}</strong></span>
                <span style="font-weight: 700; color: var(--text-primary);">Total Paid: ${o.total}</span>
              </div>
            </div>
          `;
        }).join('');
      }

      contentHtml = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title" data-i18n="my_profile">My Account Overview</h2>
            <p class="view-subtitle" data-i18n="profile_sub">Manage personal information, delivery addresses, security, and preferences</p>
          </div>
        </div>

        <div class="profile-layout-grid">
          <!-- LEFT COLUMN: Profile Navigation Sidebar & Summary Card -->
          <aside class="profile-sidebar">
            <div class="profile-user-summary-card">
              <div class="profile-avatar-wrapper">
                ${u.avatar ? `<img src="${u.avatar}" class="profile-avatar-img" alt="${u.name}">` : `<div class="profile-avatar-initials" id="profile-display-initials">${initials}</div>`}
                <label for="profile-avatar-input" class="profile-avatar-upload-badge" title="Change Profile Picture" aria-label="Upload profile image">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </label>
                <input type="file" id="profile-avatar-input" accept="image/*" style="display:none;">
              </div>
              <div class="profile-summary-details">
                <h3 class="profile-summary-name" id="profile-display-name-header">${u.name}</h3>
                <p class="profile-summary-email" id="profile-display-email-header">${u.email}</p>
                <div class="profile-badge-row">
                  <span class="status-pill success">Verified Customer</span>
                  <span class="status-pill success" style="background: rgba(40,116,240,0.15); color: #2874f0;">256-Bit JWT</span>
                </div>
              </div>
            </div>

            <!-- Account Navigation Menu -->
            <nav class="profile-nav-menu" role="tablist" aria-label="Account sections">
              <button class="profile-nav-btn active" data-tab="personal" role="tab" aria-selected="true" aria-controls="profile-tab-personal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Personal Information</span>
              </button>
              <button class="profile-nav-btn" data-tab="addresses" role="tab" aria-selected="false" aria-controls="profile-tab-addresses">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Manage Addresses</span>
              </button>
              <button class="profile-nav-btn" data-tab="security" role="tab" aria-selected="false" aria-controls="profile-tab-security">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Account Security</span>
              </button>
              <button class="profile-nav-btn" data-tab="payments" role="tab" aria-selected="false" aria-controls="profile-tab-payments">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <span>Payments & Saved Info</span>
              </button>
              <button class="profile-nav-btn" data-tab="activity" role="tab" aria-selected="false" aria-controls="profile-tab-activity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span>My Activity & Orders</span>
              </button>
              <button class="profile-nav-btn" data-tab="preferences" role="tab" aria-selected="false" aria-controls="profile-tab-preferences">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Account Preferences</span>
              </button>
              <button class="profile-nav-btn" data-tab="faq" role="tab" aria-selected="false" aria-controls="profile-tab-faq">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Help & FAQs</span>
              </button>
              <button class="profile-nav-btn danger-btn" data-tab="deletion" role="tab" aria-selected="false" aria-controls="profile-tab-deletion">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Delete Account</span>
              </button>
            </nav>
          </aside>

          <!-- RIGHT COLUMN: Dynamic Section Panels -->
          <main class="profile-content-panel">
            <!-- SECTION 1: Personal Information -->
            <div class="profile-tab-section active" id="profile-tab-personal" role="tabpanel">
              <div class="profile-section-card">
                <div class="profile-card-header">
                  <div>
                    <h3>Personal Information</h3>
                    <p>Manage your name, contact details, gender, and birthday</p>
                  </div>
                  <button id="profile-edit-info-toggle" class="btn-primary-action btn-sm" style="display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span id="edit-toggle-label">Edit Info</span>
                  </button>
                </div>

                <!-- View Mode Grid -->
                <div id="personal-info-view-mode" class="profile-info-grid">
                  <div class="info-cell">
                    <label>First Name</label>
                    <div id="view-first-name">${firstName}</div>
                  </div>
                  <div class="info-cell">
                    <label>Last Name</label>
                    <div id="view-last-name">${lastName || '-'}</div>
                  </div>
                  <div class="info-cell">
                    <label>Email Address</label>
                    <div id="view-email">${u.email}</div>
                  </div>
                  <div class="info-cell">
                    <label>Mobile Number</label>
                    <div id="view-phone">${u.phone}</div>
                  </div>
                  <div class="info-cell">
                    <label>Gender</label>
                    <div id="view-gender">${u.gender || 'Not Specified'}</div>
                  </div>
                  <div class="info-cell">
                    <label>Date of Birth</label>
                    <div id="view-dob">${u.dob || 'Not Provided'}</div>
                  </div>
                  <div class="info-cell">
                    <label>Account Status</label>
                    <div><span class="status-pill success">Active & Verified</span></div>
                  </div>
                  <div class="info-cell">
                    <label>Member Since</label>
                    <div>${u.memberSince || 'January 2026'}</div>
                  </div>
                </div>

                <!-- Edit Mode Form (Hidden by default) -->
                <form id="personal-info-edit-form" class="profile-edit-form" style="display: none;" novalidate>
                  <div class="form-grid-2">
                    <div class="form-group">
                      <label for="edit-first-name">First Name <span class="required" style="color:#ef4444;">*</span></label>
                      <input type="text" id="edit-first-name" class="form-input" value="${firstName}" required>
                      <span class="field-error" id="err-first-name" style="color:#ef4444; font-size:0.8rem; display:block; margin-top:4px;"></span>
                    </div>
                    <div class="form-group">
                      <label for="edit-last-name">Last Name <span class="required" style="color:#ef4444;">*</span></label>
                      <input type="text" id="edit-last-name" class="form-input" value="${lastName}" required>
                      <span class="field-error" id="err-last-name" style="color:#ef4444; font-size:0.8rem; display:block; margin-top:4px;"></span>
                    </div>
                  </div>
                  <div class="form-grid-2" style="margin-top: 14px;">
                    <div class="form-group">
                      <label for="edit-email">Email Address <span class="required" style="color:#ef4444;">*</span></label>
                      <input type="email" id="edit-email" class="form-input" value="${u.email}" required>
                      <span class="field-error" id="err-email" style="color:#ef4444; font-size:0.8rem; display:block; margin-top:4px;"></span>
                    </div>
                    <div class="form-group">
                      <label for="edit-phone">Mobile Number <span class="required" style="color:#ef4444;">*</span></label>
                      <input type="tel" id="edit-phone" class="form-input" value="${u.phone}" required>
                      <span class="field-error" id="err-phone" style="color:#ef4444; font-size:0.8rem; display:block; margin-top:4px;"></span>
                    </div>
                  </div>
                  <div class="form-grid-2" style="margin-top: 14px;">
                    <div class="form-group">
                      <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.88rem;">Gender</label>
                      <div class="gender-radio-group">
                        <label class="radio-label"><input type="radio" name="edit-gender" value="Male" ${u.gender === 'Male' ? 'checked' : ''}> Male</label>
                        <label class="radio-label"><input type="radio" name="edit-gender" value="Female" ${u.gender === 'Female' ? 'checked' : ''}> Female</label>
                        <label class="radio-label"><input type="radio" name="edit-gender" value="Other" ${u.gender === 'Other' ? 'checked' : ''}> Other</label>
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="edit-dob" style="display:block; margin-bottom:6px; font-weight:600; font-size:0.88rem;">Date of Birth</label>
                      <input type="date" id="edit-dob" class="form-input" value="${u.dob || ''}">
                    </div>
                  </div>

                  <div class="form-action-row" style="margin-top: 20px;">
                    <button type="submit" id="save-personal-info-btn" class="btn-primary-action" style="padding: 10px 24px; font-weight: 700;">
                      <span class="btn-text">Save Changes</span>
                    </button>
                    <button type="button" id="cancel-personal-info-btn" class="btn-secondary-action" style="padding: 10px 20px;">Cancel</button>
                  </div>
                </form>
              </div>
            </div>

            <!-- SECTION 2: Manage Addresses -->
            <div class="profile-tab-section" id="profile-tab-addresses" style="display:none;" role="tabpanel">
              <div class="profile-section-card">
                <div class="profile-card-header">
                  <div>
                    <h3>Manage Saved Addresses</h3>
                    <p>Add, edit, or set default delivery addresses for faster checkout</p>
                  </div>
                  <button id="profile-add-address-trigger" class="btn-primary-action btn-sm" style="display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Add New Address</span>
                  </button>
                </div>

                <div id="profile-address-cards-container" class="profile-address-grid">
                  <!-- Address cards dynamically rendered -->
                </div>
              </div>
            </div>

            <!-- SECTION 3: Account Security -->
            <div class="profile-tab-section" id="profile-tab-security" style="display:none;" role="tabpanel">
              <div class="profile-section-card">
                <div class="profile-card-header">
                  <div>
                    <h3>Account Security</h3>
                    <p>Update password and review active 256-bit SSL encrypted sessions</p>
                  </div>
                </div>

                <!-- Change Password Form -->
                <form id="change-password-form" class="profile-security-form" novalidate>
                  <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 14px;">Change Password</h4>
                  <div class="form-group" style="margin-bottom: 14px;">
                    <label for="pwd-current" style="display:block; margin-bottom:6px; font-weight:600; font-size:0.88rem;">Current Password</label>
                    <input type="password" id="pwd-current" class="form-input" placeholder="Enter current password" required>
                    <span class="field-error" id="err-pwd-current" style="color:#ef4444; font-size:0.8rem; display:block; margin-top:4px;"></span>
                  </div>
                  <div class="form-grid-2">
                    <div class="form-group">
                      <label for="pwd-new" style="display:block; margin-bottom:6px; font-weight:600; font-size:0.88rem;">New Password</label>
                      <input type="password" id="pwd-new" class="form-input" placeholder="Minimum 6 characters" required>
                      <span class="field-error" id="err-pwd-new" style="color:#ef4444; font-size:0.8rem; display:block; margin-top:4px;"></span>
                    </div>
                    <div class="form-group">
                      <label for="pwd-confirm" style="display:block; margin-bottom:6px; font-weight:600; font-size:0.88rem;">Confirm New Password</label>
                      <input type="password" id="pwd-confirm" class="form-input" placeholder="Re-enter new password" required>
                      <span class="field-error" id="err-pwd-confirm" style="color:#ef4444; font-size:0.8rem; display:block; margin-top:4px;"></span>
                    </div>
                  </div>
                  <button type="submit" id="update-password-btn" class="btn-primary-action" style="margin-top: 18px; padding: 10px 24px; font-weight: 700;">
                    <span class="btn-text">Update Password</span>
                  </button>
                </form>

                <!-- Session Information -->
                <div class="security-info-box" style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                  <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">Active Device Session</h4>
                  <div style="background: var(--bg-body); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                      <div style="font-weight: 700; color: var(--text-primary);">Current Browser Session</div>
                      <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">Encrypted with 256-Bit SSL JWT Tokens • Windows PC (Active)</div>
                    </div>
                    <span class="status-pill success">Active Now</span>
                  </div>
                  <div style="display: flex; gap: 12px;">
                    <button id="sec-logout-current-btn" class="btn-secondary-action" style="padding: 8px 16px; font-size: 0.85rem;">Logout Current Session</button>
                    <button id="sec-logout-all-btn" class="btn-secondary-action danger-border" style="padding: 8px 16px; font-size: 0.85rem; color: #ef4444;">Logout All Devices</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 4: Payments & Saved Info -->
            <div class="profile-tab-section" id="profile-tab-payments" style="display:none;" role="tabpanel">
              <div class="profile-section-card">
                <div class="profile-card-header">
                  <div>
                    <h3>Payments & Saved Information</h3>
                    <p>Saved payment options, UPI IDs, and gift card balances</p>
                  </div>
                </div>

                <div class="payments-overview-grid">
                  <div class="payment-card-item">
                    <div class="payment-card-icon">💳</div>
                    <div>
                      <div class="payment-card-title">Saved Credit / Debit Cards</div>
                      <div class="payment-card-desc">No cards stored. Payments are processed securely via Razorpay/Stripe gateways.</div>
                    </div>
                  </div>
                  <div class="payment-card-item">
                    <div class="payment-card-icon">⚡</div>
                    <div>
                      <div class="payment-card-title">Saved UPI Identifiers</div>
                      <div class="payment-card-desc">Instant UPI checkout enabled at payment page.</div>
                    </div>
                  </div>
                  <div class="payment-card-item">
                    <div class="payment-card-icon">🎁</div>
                    <div>
                      <div class="payment-card-title">ShopSphere Gift Cards & Wallet</div>
                      <div class="payment-card-desc">Available Balance: <strong>₹0.00</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 5: My Activity & Orders -->
            <div class="profile-tab-section" id="profile-tab-activity" style="display:none;" role="tabpanel">
              <div class="profile-section-card">
                <div class="profile-card-header">
                  <div>
                    <h3>My Activity & Quick Access</h3>
                    <p>Direct shortcuts to your orders, wishlist, and product ratings</p>
                  </div>
                </div>

                <div class="activity-shortcuts-grid">
                  <button class="activity-shortcut-btn" id="act-goto-orders">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <span>My Orders</span>
                  </button>
                  <button class="activity-shortcut-btn" id="act-goto-wishlist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span>Wishlist</span>
                  </button>
                  <button class="activity-shortcut-btn" id="act-goto-support">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>Support Queries</span>
                  </button>
                </div>

                <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                  <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 14px;">Purchase History & Ratings</h4>
                  ${ordersHtml}
                </div>
              </div>
            </div>

            <!-- SECTION 6: Account Preferences -->
            <div class="profile-tab-section" id="profile-tab-preferences" style="display:none;" role="tabpanel">
              <div class="profile-section-card">
                <div class="profile-card-header">
                  <div>
                    <h3>Account Preferences</h3>
                    <p>Customize notifications, appearance, and language settings</p>
                  </div>
                </div>

                <div class="preferences-list">
                  <div class="pref-row">
                    <div>
                      <div class="pref-title">Theme Mode</div>
                      <div class="pref-desc">Switch between Dark Mode and Light Mode appearance</div>
                    </div>
                    <button id="pref-theme-toggle-btn" class="btn-secondary-action">
                      <span>Toggle Theme</span>
                    </button>
                  </div>
                  <div class="pref-row">
                    <div>
                      <div class="pref-title">Language Selection</div>
                      <div class="pref-desc">Choose your preferred application language</div>
                    </div>
                    <select id="pref-lang-select" class="form-input" style="width: auto;">
                      <option value="en" ${AppState.currentLanguage === 'en' ? 'selected' : ''}>English</option>
                      <option value="ta" ${AppState.currentLanguage === 'ta' ? 'selected' : ''}>Tamil (தமிழ்)</option>
                      <option value="hi" ${AppState.currentLanguage === 'hi' ? 'selected' : ''}>Hindi (हिंदी)</option>
                    </select>
                  </div>
                  <div class="pref-row">
                    <div>
                      <div class="pref-title">Order Status SMS & Email Alerts</div>
                      <div class="pref-desc">Receive real-time delivery notifications</div>
                    </div>
                    <input type="checkbox" id="pref-sms-toggle" checked style="width: 20px; height: 20px; accent-color: var(--color-accent, #2874f0);">
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 7: Help & FAQs -->
            <div class="profile-tab-section" id="profile-tab-faq" style="display:none;" role="tabpanel">
              <div class="profile-section-card">
                <div class="profile-card-header">
                  <div>
                    <h3>Help & Frequently Asked Questions</h3>
                    <p>Find quick answers to common account and order questions</p>
                  </div>
                  <button id="faq-contact-support-btn" class="btn-primary-action btn-sm">Contact Support</button>
                </div>

                <div class="faq-accordion">
                  <details class="faq-item">
                    <summary class="faq-summary">How do I update my registered mobile number or email?</summary>
                    <div class="faq-answer">Navigate to the <strong>Personal Information</strong> tab and click <strong>Edit Info</strong> to update your contact details in real-time.</div>
                  </details>
                  <details class="faq-item">
                    <summary class="faq-summary">How is my account data secured?</summary>
                    <div class="faq-answer">ShopSphere uses industry-standard 256-bit SSL encryption and JWT authentication tokens to protect your profile and session.</div>
                  </details>
                  <details class="faq-item">
                    <summary class="faq-summary">How do I manage my saved delivery addresses?</summary>
                    <div class="faq-answer">Go to the <strong>Manage Addresses</strong> section where you can add new addresses, edit existing details, or choose your default shipping destination.</div>
                  </details>
                  <details class="faq-item">
                    <summary class="faq-summary">How can I track my existing order status?</summary>
                    <div class="faq-answer">Click on <strong>My Activity & Orders</strong> or access the Orders section from the main sidebar to view real-time delivery tracking.</div>
                  </details>
                </div>
              </div>
            </div>

            <!-- SECTION 8: Delete Account (Danger Zone) -->
            <div class="profile-tab-section" id="profile-tab-deletion" style="display:none;" role="tabpanel">
              <div class="profile-section-card danger-card">
                <div class="profile-card-header">
                  <div>
                    <h3 style="color: #ef4444;">Delete Account</h3>
                    <p>Permanently remove your account, saved addresses, and preferences</p>
                  </div>
                </div>

                <div class="danger-warning-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div>
                    <div style="font-weight: 700; color: #ef4444;">Warning: This action is permanent!</div>
                    <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px;">Once deleted, your profile details, saved delivery addresses, wishlist items, and order access will be permanently erased.</div>
                  </div>
                </div>

                <div>
                  <button id="trigger-delete-modal-btn" class="btn-secondary-action danger-border" style="margin-top: 16px; color: #ef4444; font-weight: 700;">
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </main>
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

    viewContainer.classList.add('view-entering');
    viewContainer.innerHTML = contentHtml;
    requestAnimationFrame(() => {
      viewContainer.classList.remove('view-entering');
      viewContainer.classList.add('view-entered');
    });

    if (viewName === 'profile') {
      const u = AuthService.getUser() || {};

      // 1. Tab Switcher Handler
      const navBtns = document.querySelectorAll('.profile-nav-btn');
      const tabSections = document.querySelectorAll('.profile-tab-section');

      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-tab');
          navBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');

          tabSections.forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('active');
          });

          const activeSec = document.getElementById(`profile-tab-${targetTab}`);
          if (activeSec) {
            activeSec.style.display = 'block';
            activeSec.classList.add('active');
          }

          if (targetTab === 'addresses') {
            renderProfileAddresses();
          }
        });
      });

      // 2. Personal Information Edit Toggle & Form Submit
      const editToggleBtn = document.getElementById('profile-edit-info-toggle');
      const viewModeGrid = document.getElementById('personal-info-view-mode');
      const editModeForm = document.getElementById('personal-info-edit-form');
      const cancelEditBtn = document.getElementById('cancel-personal-info-btn');
      const toggleLabel = document.getElementById('edit-toggle-label');

      if (editToggleBtn && viewModeGrid && editModeForm) {
        editToggleBtn.addEventListener('click', () => {
          const isEditing = editModeForm.style.display !== 'none';
          if (isEditing) {
            editModeForm.style.display = 'none';
            viewModeGrid.style.display = 'grid';
            if (toggleLabel) toggleLabel.textContent = 'Edit Info';
          } else {
            editModeForm.style.display = 'block';
            viewModeGrid.style.display = 'none';
            if (toggleLabel) toggleLabel.textContent = 'View Info';
          }
        });

        if (cancelEditBtn) {
          cancelEditBtn.addEventListener('click', () => {
            editModeForm.style.display = 'none';
            viewModeGrid.style.display = 'grid';
            if (toggleLabel) toggleLabel.textContent = 'Edit Info';
          });
        }

        editModeForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const fn = document.getElementById('edit-first-name').value.trim();
          const ln = document.getElementById('edit-last-name').value.trim();
          const email = document.getElementById('edit-email').value.trim();
          const phone = document.getElementById('edit-phone').value.trim();
          const genderEl = editModeForm.querySelector('input[name="edit-gender"]:checked');
          const gender = genderEl ? genderEl.value : '';
          const dob = document.getElementById('edit-dob').value;

          document.querySelectorAll('#personal-info-edit-form .field-error').forEach(el => el.textContent = '');

          let valid = true;
          if (!fn) {
            document.getElementById('err-first-name').textContent = 'First name is required.';
            valid = false;
          }
          if (!email || !email.includes('@')) {
            document.getElementById('err-email').textContent = 'Please enter a valid email address.';
            valid = false;
          }
          if (!phone || phone.replace(/\D/g, '').length < 10) {
            document.getElementById('err-phone').textContent = 'Please enter a valid 10-digit mobile number.';
            valid = false;
          }

          if (!valid) return;

          const saveBtn = document.getElementById('save-personal-info-btn');
          if (saveBtn) saveBtn.disabled = true;

          const fullName = `${fn} ${ln}`.trim();
          AuthService.updateProfile({ name: fullName, email, phone, gender, dob })
            .then(updated => {
              if (saveBtn) saveBtn.disabled = false;
              const vFn = document.getElementById('view-first-name');
              const vLn = document.getElementById('view-last-name');
              const vEm = document.getElementById('view-email');
              const vPh = document.getElementById('view-phone');
              const vGe = document.getElementById('view-gender');
              const vDb = document.getElementById('view-dob');
              const hName = document.getElementById('profile-display-name-header');
              const hEmail = document.getElementById('profile-display-email-header');

              if (vFn) vFn.textContent = fn;
              if (vLn) vLn.textContent = ln || '-';
              if (vEm) vEm.textContent = email;
              if (vPh) vPh.textContent = phone;
              if (vGe) vGe.textContent = gender || 'Not Specified';
              if (vDb) vDb.textContent = dob || 'Not Provided';
              if (hName) hName.textContent = fullName;
              if (hEmail) hEmail.textContent = email;

              editModeForm.style.display = 'none';
              viewModeGrid.style.display = 'grid';
              if (toggleLabel) toggleLabel.textContent = 'Edit Info';

              showToast('Personal information updated successfully', 'success');
            })
            .catch(err => {
              if (saveBtn) saveBtn.disabled = false;
              showToast(err.message || 'Failed to save changes', 'error');
            });
        });
      }

      // 3. Avatar Upload Handler
      const avatarInput = document.getElementById('profile-avatar-input');
      if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const base64 = evt.target.result;
              AuthService.updateProfile({ avatar: base64 }).then(() => {
                renderView('profile');
                showToast('Profile picture updated successfully', 'success');
              });
            };
            reader.readAsDataURL(file);
          }
        });
      }

      // 4. Address Cards Renderer
      function renderProfileAddresses() {
        const container = document.getElementById('profile-address-cards-container');
        if (!container) return;
        const addresses = typeof AddressService !== 'undefined' ? AddressService.getAll() : [];
        if (addresses.length === 0) {
          container.innerHTML = `<p style="font-size: 0.9rem; color: var(--text-secondary); grid-column: 1 / -1;">No addresses saved yet. Click "+ Add New Address" above to save your first shipping destination.</p>`;
          return;
        }

        const currentUser = AuthService.getUser() || {};
        container.innerHTML = addresses.map(addr => `
          <div class="profile-address-card ${addr.isDefault ? 'default-addr' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="status-pill" style="background: var(--bg-hover); color: var(--text-primary); font-weight: 700;">${addr.type || 'Home'}</span>
                ${addr.isDefault ? `<span class="status-pill success" style="margin-left: 6px;">Default</span>` : ''}
              </div>
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${addr.name || currentUser.name || 'User'}</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">
                ${addr.addressLine}, ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">Phone: ${addr.phone || currentUser.phone || ''}</div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 4px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
              ${!addr.isDefault ? `<button class="btn-secondary-action btn-sm set-default-addr-btn" data-id="${addr.id}" style="font-size: 0.78rem; padding: 4px 8px;">Set Default</button>` : ''}
              <button class="btn-secondary-action btn-sm edit-addr-btn" data-id="${addr.id}" style="font-size: 0.78rem; padding: 4px 8px;">Edit</button>
              <button class="btn-secondary-action btn-sm delete-addr-btn" data-id="${addr.id}" style="font-size: 0.78rem; padding: 4px 8px; color: #ef4444; border-color: rgba(239,68,68,0.3);">Delete</button>
            </div>
          </div>
        `).join('');

        container.querySelectorAll('.set-default-addr-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (typeof AddressService !== 'undefined') {
              AddressService.setDefault(id);
              renderProfileAddresses();
              showToast('Default delivery address updated', 'success');
            }
          });
        });

        container.querySelectorAll('.edit-addr-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (window.openAddressModal) window.openAddressModal(id);
          });
        });

        container.querySelectorAll('.delete-addr-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (typeof AddressService !== 'undefined') {
              AddressService.delete(id);
              renderProfileAddresses();
              showToast('Address deleted successfully', 'info');
            }
          });
        });
      }

      const addAddressBtn = document.getElementById('profile-add-address-trigger');
      if (addAddressBtn) {
        addAddressBtn.addEventListener('click', () => {
          if (window.openAddressModal) window.openAddressModal();
        });
      }

      // 5. Account Security Change Password Form & Logout
      const pwdForm = document.getElementById('change-password-form');
      if (pwdForm) {
        pwdForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const curr = document.getElementById('pwd-current').value;
          const newPwd = document.getElementById('pwd-new').value;
          const confirmPwd = document.getElementById('pwd-confirm').value;

          document.querySelectorAll('#change-password-form .field-error').forEach(el => el.textContent = '');

          let valid = true;
          if (!curr) {
            document.getElementById('err-pwd-current').textContent = 'Current password is required.';
            valid = false;
          }
          if (!newPwd || newPwd.length < 6) {
            document.getElementById('err-pwd-new').textContent = 'New password must be at least 6 characters.';
            valid = false;
          }
          if (newPwd !== confirmPwd) {
            document.getElementById('err-pwd-confirm').textContent = 'Passwords do not match.';
            valid = false;
          }

          if (!valid) return;

          const updBtn = document.getElementById('update-password-btn');
          if (updBtn) updBtn.disabled = true;

          AuthService.updatePassword(curr, newPwd)
            .then(() => {
              if (updBtn) updBtn.disabled = false;
              pwdForm.reset();
              showToast('Password updated successfully', 'success');
            })
            .catch(err => {
              if (updBtn) updBtn.disabled = false;
              showToast(err.message || 'Failed to update password', 'error');
            });
        });
      }

      const secLogoutCurrent = document.getElementById('sec-logout-current-btn');
      const secLogoutAll = document.getElementById('sec-logout-all-btn');
      if (secLogoutCurrent) secLogoutCurrent.addEventListener('click', () => AuthService.logout());
      if (secLogoutAll) secLogoutAll.addEventListener('click', () => AuthService.logout());

      // 6. Activity Navigation Shortcuts
      const actOrders = document.getElementById('act-goto-orders');
      const actWishlist = document.getElementById('act-goto-wishlist');
      const actSupport = document.getElementById('act-goto-support');
      if (actOrders) actOrders.addEventListener('click', () => renderView('orders'));
      if (actWishlist) actWishlist.addEventListener('click', () => renderView('wishlist'));
      if (actSupport) actSupport.addEventListener('click', () => renderView('support'));

      // 7. Preferences Handlers
      const prefThemeToggle = document.getElementById('pref-theme-toggle-btn');
      if (prefThemeToggle) {
        prefThemeToggle.addEventListener('click', () => {
          const globalThemeBtn = document.getElementById('theme-toggle');
          if (globalThemeBtn) {
            globalThemeBtn.click();
          } else {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
          }
          showToast('Theme preference updated', 'info');
        });
      }

      const prefLangSelect = document.getElementById('pref-lang-select');
      if (prefLangSelect) {
        prefLangSelect.addEventListener('change', (e) => {
          if (typeof changeLanguage === 'function') {
            changeLanguage(e.target.value);
          }
        });
      }

      // 8. FAQ Contact Support Button
      const faqSupportBtn = document.getElementById('faq-contact-support-btn');
      if (faqSupportBtn) faqSupportBtn.addEventListener('click', () => renderView('support'));

      // 9. Account Deletion Modal & Confirmation Handler
      const triggerDeleteBtn = document.getElementById('trigger-delete-modal-btn');
      const deleteModalOverlay = document.getElementById('account-delete-modal-overlay');
      const deleteModalCancel = document.getElementById('acct-delete-cancel-btn');
      const deleteModalConfirm = document.getElementById('acct-delete-confirm-btn');
      const deleteInput = document.getElementById('acct-delete-confirm-input');
      const deleteError = document.getElementById('acct-delete-error');

      if (triggerDeleteBtn && deleteModalOverlay) {
        triggerDeleteBtn.addEventListener('click', () => {
          if (deleteInput) deleteInput.value = '';
          if (deleteError) deleteError.textContent = '';
          deleteModalOverlay.classList.remove('hidden');
        });

        if (deleteModalCancel) {
          deleteModalCancel.addEventListener('click', () => {
            deleteModalOverlay.classList.add('hidden');
          });
        }

        document.addEventListener('keydown', function escHandler(evt) {
          if (evt.key === 'Escape' && !deleteModalOverlay.classList.contains('hidden')) {
            deleteModalOverlay.classList.add('hidden');
            document.removeEventListener('keydown', escHandler);
          }
        });

        if (deleteModalConfirm) {
          deleteModalConfirm.addEventListener('click', () => {
            const val = (deleteInput ? deleteInput.value : '').trim();
            if (val.toUpperCase() !== 'DELETE') {
              if (deleteError) deleteError.textContent = 'Please type DELETE exactly to confirm.';
              return;
            }

            deleteModalConfirm.disabled = true;
            AuthService.deleteAccount('DELETE')
              .then(() => {
                deleteModalConfirm.disabled = false;
                deleteModalOverlay.classList.add('hidden');
                showToast('Account deleted successfully', 'info');
              })
              .catch(err => {
                deleteModalConfirm.disabled = false;
                if (deleteError) deleteError.textContent = err.message || 'Deletion failed.';
              });
          });
        }
      }

      // 10. Bind interactive product ratings stars
      const widgets = document.querySelectorAll('.profile-star-rating-widget');
      widgets.forEach(w => {
        const stars = w.querySelectorAll('.profile-star-item');
        stars.forEach(star => {
          star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-value'));
            const pid = parseInt(w.getAttribute('data-product-id'));
            const u = AuthService.getUser();
            if (u && pid && val) {
              if (typeof saveProductRating === 'function') {
                saveProductRating(u.id, pid, val);
              }

              stars.forEach(s => {
                const sVal = parseInt(s.getAttribute('data-value'));
                s.style.color = sVal <= val ? '#ffb703' : 'inherit';
              });
              showToast('Thank you! Rating submitted successfully.', 'success');
            }
          });
        });
      });
    } else if (viewName === 'wishlist') {
      const wishlistBrowseBtn = document.getElementById('wishlist-empty-browse-btn');
      if (wishlistBrowseBtn) {
        wishlistBrowseBtn.addEventListener('click', () => renderView('shop'));
      }
    } else if (viewName === 'orders') {
      const ordersBrowseBtn = document.getElementById('orders-empty-browse-btn');
      if (ordersBrowseBtn) {
        ordersBrowseBtn.addEventListener('click', () => renderView('shop'));
      }
    }

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

    if (locationBtn && locationDropdown) {
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
          if (currentLocationLabel) currentLocationLabel.textContent = selectedValue;
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
      const card = button.closest('.product-card');
      const pid = button.dataset.productId || card?.getAttribute('data-product-id');

      // Sync active styling state with wishlist service
      if (pid && WishlistService.has(parseInt(pid))) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }

      if (button.dataset.wishBound) return;
      button.dataset.wishBound = 'true';

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const freshCard = button.closest('.product-card');
        const freshPid = button.dataset.productId || freshCard?.getAttribute('data-product-id');
        if (!freshPid) return;

        requireAuth('WISHLIST', { pid: freshPid }, () => {
          const isActive = WishlistService.toggle(parseInt(freshPid));
          if (isActive) {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }
          button.style.transform = 'scale(0.8)';
          setTimeout(() => {
            button.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
          }, 100);
          setTimeout(() => {
            button.style.transform = 'none';
          }, 250);
          showToast(isActive ? 'Item added to Wishlist' : 'Item removed from Wishlist', isActive ? 'success' : 'info');

          // If currently on wishlist page, immediately re-render view to reflect removal
          if (AppState.activeView === 'wishlist') {
            renderView('wishlist');
          }
        });
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
  const voiceBtn = document.getElementById('voice-search-btn');

  if (voiceBtn && searchInput) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let isListening = false;

      voiceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isListening) {
          recognition.stop();
          return;
        }

        try {
          recognition.start();
        } catch (err) {
          showToast('Speech recognition is already running.', 'warning');
        }
      });

      recognition.onstart = () => {
        isListening = true;
        voiceBtn.style.color = '#ef4444';
        voiceBtn.classList.add('pulse-mic');
        const micIcon = voiceBtn.querySelector('.mic-icon');
        if (micIcon) micIcon.style.transform = 'scale(1.2)';
        showToast('Listening... Speak now', 'info');
      };

      recognition.onend = () => {
        isListening = false;
        voiceBtn.style.color = 'var(--text-secondary)';
        voiceBtn.classList.remove('pulse-mic');
        const micIcon = voiceBtn.querySelector('.mic-icon');
        if (micIcon) micIcon.style.transform = 'scale(1)';
      };

      recognition.onerror = (e) => {
        isListening = false;
        voiceBtn.style.color = 'var(--text-secondary)';
        voiceBtn.classList.remove('pulse-mic');
        const micIcon = voiceBtn.querySelector('.mic-icon');
        if (micIcon) micIcon.style.transform = 'scale(1)';
        showToast('Voice search error: ' + e.error, 'error');
      };

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          searchInput.value = transcript;
          AppState.searchQuery = transcript.toLowerCase();
          AppState.currentPage = 1;
          renderView('shop');
          showToast(`Searching for: "${transcript}"`, 'success');
        }
      };
    } else {
      voiceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showToast('Voice search is not supported in this browser. Please use Chrome or Edge.', 'warning');
      });
    }
  }

  if (searchInput) {
    let searchDebounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      const query = e.target.value.trim();
      AppState.searchQuery = query;

      searchDebounceTimer = setTimeout(() => {
        if (query.length > 0 && AppState.currentView !== 'shop') {
          AppState.currentView = 'shop';
          renderView('shop');
        } else if (AppState.currentView === 'shop') {
          updateShopProductResultsOnly();
        }
      }, 250);
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        AppState.searchQuery = query;
        if (AppState.currentView !== 'shop') {
          AppState.currentView = 'shop';
        }
        AppState.currentPage = 1;
        renderProductListingView();
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

  /* Category Card Filter & Navigation Router (Delegated for dynamic views) */
  if (viewContainer) {
    viewContainer.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-nav-target]');
      if (navBtn) {
        e.preventDefault();
        const target = navBtn.getAttribute('data-nav-target');
        const navItem = document.querySelector(`.nav-item[data-nav="${target}"]`);
        if (navItem) {
          navItem.click();
        } else {
          renderView(target);
        }
        return;
      }

      const card = e.target.closest('.category-card[data-category]');
      if (card) {
        e.preventDefault();
        const catName = card.getAttribute('data-category');
        if (catName) {
          AppState.selectedCategory = catName;
          AppState.searchQuery = '';
          renderView('shop');
          showToast(`Filtered by ${catName}`, 'info');
        }
      }
    });
  }

  // Initial bindings for static elements on initial DOM load after API service resolves
  ApiService.init().then(() => {
    loadFiltersFromURL();
    bindProductCardListeners();
    bindGlobalNavigationEvents();
    bindAuthEventListeners();
    updateCartBadge();
  });

  // Automatically prompt login modal on site entry if unauthenticated
  if (!AuthService.isAuthenticated()) {
    setTimeout(() => {
      openAuthModal('LOGIN');
    }, 400);
  }

  /* ==========================================================================
     MODULE — Enterprise Notification Center Implementation
     ========================================================================== */

  const DEFAULT_NOTIFICATIONS = [];

  function initNotificationModule() {
    AppState.notifications = loadNotificationsFromStorage();
    updateNotificationBadge();
    initNotificationDropdown();
    initNotificationModal();

    // Auto-simulate notification after 45s of user activity
    setTimeout(() => {
      if (AppState.notifications.length > 0 && Math.random() > 0.4) {
        simulateRandomAlert();
      }
    }, 45000);
  }

  function loadNotificationsFromStorage() {
    const stored = localStorage.getItem('shopsphere_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(n => typeof n.id === 'string' && !n.id.startsWith('notif_10'));
          return filtered;
        }
      } catch (e) {
        console.error('Failed to parse notifications from localStorage', e);
      }
    }
    localStorage.setItem('shopsphere_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  }

  function saveNotificationsToStorage(notifs) {
    try {
      AppState.notifications = notifs;
      localStorage.setItem('shopsphere_notifications', JSON.stringify(notifs));
      updateNotificationBadge();
    } catch (error) {
      console.error('Failed to save notifications:', error);
      showErrorToastNotification('Failed to update notifications.');
    }
  }

  function showErrorToastNotification(message) {
    document.querySelectorAll('.app-toast-alert').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'app-toast-alert error';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2.5" style="width: 20px; height: 20px; flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function markNotificationAsRead(id) {
    const notifs = (AppState.notifications || []).map(n => {
      if (n.id === id) return { ...n, unread: false };
      return n;
    });
    saveNotificationsToStorage(notifs);
    renderNotificationDropdownList();
    if (AppState.currentView === 'notifications') {
      renderNotificationsView();
    }
  }

  function markAllNotificationsAsRead() {
    const notifs = (AppState.notifications || []).map(n => ({ ...n, unread: false }));
    saveNotificationsToStorage(notifs);
    renderNotificationDropdownList();
    if (AppState.currentView === 'notifications') {
      renderNotificationsView();
    }
  }

  function deleteNotification(id) {
    const notifs = (AppState.notifications || []).filter(n => n.id !== id);
    AppState.selectedNotificationIds.delete(id);
    saveNotificationsToStorage(notifs);
    renderNotificationDropdownList();
    if (AppState.currentView === 'notifications') {
      renderNotificationsView();
    }
  }

  function deleteSelectedNotifications() {
    if (AppState.selectedNotificationIds.size === 0) return;
    const notifs = (AppState.notifications || []).filter(n => !AppState.selectedNotificationIds.has(n.id));
    AppState.selectedNotificationIds.clear();
    saveNotificationsToStorage(notifs);
    renderNotificationDropdownList();
    if (AppState.currentView === 'notifications') {
      renderNotificationsView();
    }
  }

  function clearAllNotifications() {
    AppState.selectedNotificationIds.clear();
    saveNotificationsToStorage([]);
    renderNotificationDropdownList();
    if (AppState.currentView === 'notifications') {
      renderNotificationsView();
    }
  }

  function addNotification(newNotif) {
    const notifs = [newNotif, ...(AppState.notifications || [])];
    saveNotificationsToStorage(notifs);
    renderNotificationDropdownList();
    if (AppState.currentView === 'notifications') {
      renderNotificationsView();
    }
  }

  function updateNotificationBadge() {
    const notifs = AppState.notifications || [];
    const unreadCount = notifs.filter(n => n.unread).length;
    AppState.unreadNotificationCount = unreadCount;

    const headerBadge = document.getElementById('notification-badge');
    if (headerBadge) {
      headerBadge.textContent = unreadCount;
      if (unreadCount > 0) {
        headerBadge.classList.remove('hidden');
        headerBadge.classList.add('pulse');
      } else {
        headerBadge.classList.add('hidden');
        headerBadge.classList.remove('pulse');
      }
    }

    const sidebarBadge = document.getElementById('sidebar-notif-badge');
    if (sidebarBadge) {
      sidebarBadge.textContent = unreadCount;
      if (unreadCount > 0) {
        sidebarBadge.classList.remove('hidden');
      } else {
        sidebarBadge.classList.add('hidden');
      }
    }

    const dropdownPill = document.getElementById('notif-dropdown-unread-count');
    if (dropdownPill) {
      dropdownPill.textContent = `${unreadCount} New`;
    }
  }

  function getNotificationCategoryMeta(category, subType) {
    const metaMap = {
      order: {
        label: 'Order',
        pillClass: 'cat-order',
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8L12 3 3 8v10l9 5 9-5V8z"/><polyline points="3 8 12 13 21 8"/><line x1="12" y1="23" x2="12" y2="13"/></svg>`
      },
      offer: {
        label: 'Offer',
        pillClass: 'cat-offer',
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`
      },
      wishlist: {
        label: 'Wishlist',
        pillClass: 'cat-wishlist',
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
      },
      cart: {
        label: 'Cart',
        pillClass: 'cat-cart',
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
      },
      payment: {
        label: 'Payment',
        pillClass: 'cat-payment',
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`
      },
      account: {
        label: 'Account',
        pillClass: 'cat-account',
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
      },
      system: {
        label: 'System',
        pillClass: 'cat-system',
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      }
    };
    return metaMap[category] || metaMap.system;
  }

  function initNotificationDropdown() {
    const bellBtn = document.getElementById('header-notif-btn');
    const dropdown = document.getElementById('notification-dropdown');
    const markAllBtn = document.getElementById('notif-dropdown-mark-all-read');
    const viewAllBtn = document.getElementById('notif-dropdown-view-all');

    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
          renderNotificationDropdownList();
          dropdown.classList.remove('hidden');
          bellBtn.setAttribute('aria-expanded', 'true');
        } else {
          dropdown.classList.add('hidden');
          bellBtn.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('notif-wrapper');
        if (wrapper && !wrapper.contains(e.target) && !dropdown.classList.contains('hidden')) {
          dropdown.classList.add('hidden');
          bellBtn.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if ((e.key === 'Escape' || e.key === 'Esc') && !dropdown.classList.contains('hidden')) {
          dropdown.classList.add('hidden');
          bellBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (markAllBtn) {
      markAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        markAllNotificationsAsRead();
      });
    }

    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropdown) dropdown.classList.add('hidden');
        if (bellBtn) bellBtn.setAttribute('aria-expanded', 'false');
        renderView('notifications');
      });
    }
  }

  function renderNotificationDropdownList() {
    const listEl = document.getElementById('notif-dropdown-list');
    if (!listEl) return;

    const notifs = AppState.notifications || [];
    const unreadCount = notifs.filter(n => n.unread).length;

    const markAllBtn = document.getElementById('notif-dropdown-mark-all-read');
    if (markAllBtn) {
      markAllBtn.style.opacity = unreadCount === 0 ? '0.5' : '1';
      markAllBtn.style.cursor = unreadCount === 0 ? 'default' : 'pointer';
      markAllBtn.disabled = unreadCount === 0;
    }

    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div class="notif-dropdown-empty">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    const recent = notifs.slice(0, 5);
    listEl.innerHTML = recent.map(n => {
      const meta = getNotificationCategoryMeta(n.category, n.subType);
      return `
        <div class="notif-dropdown-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
          <div class="notif-item-icon ${meta.pillClass}">
            ${meta.iconSvg}
          </div>
          <div class="notif-item-content">
            <div class="notif-item-title-row">
              <span class="notif-item-title">${n.title}</span>
              <span class="notif-item-time">${n.time}</span>
            </div>
            <p class="notif-item-desc">${n.desc}</p>
          </div>
          <div class="notif-item-actions">
            ${n.unread ? `<button class="notif-action-icon-btn mark-read-btn" data-id="${n.id}" title="Mark as read"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button>` : ''}
            <button class="notif-action-icon-btn delete-btn" data-id="${n.id}" title="Delete notification"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.notif-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.notif-action-icon-btn')) return;
        const id = item.getAttribute('data-id');
        const targetNotif = AppState.notifications.find(n => n.id === id);
        if (targetNotif) {
          markNotificationAsRead(id);
          const dropdown = document.getElementById('notification-dropdown');
          const bellBtn = document.getElementById('header-notif-btn');
          if (dropdown) dropdown.classList.add('hidden');
          if (bellBtn) bellBtn.setAttribute('aria-expanded', 'false');
          if (targetNotif.actionUrl) {
            renderView(targetNotif.actionUrl);
          }
        }
      });
    });

    listEl.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        markNotificationAsRead(id);
      });
    });

    listEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        deleteNotification(id);
      });
    });
  }
  function initNotificationModal() {
    const modalOverlay = document.getElementById('notif-modal-overlay');
    const cancelBtn = document.getElementById('notif-modal-cancel-btn');
    const confirmBtn = document.getElementById('notif-modal-confirm-btn');

    if (cancelBtn && modalOverlay) {
      cancelBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
      });
    }

    if (confirmBtn && modalOverlay) {
      confirmBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        clearAllNotifications();
      });
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.classList.add('hidden');
        }
      });
    }
  }

  function openClearAllModal() {
    const modalOverlay = document.getElementById('notif-modal-overlay');
    if (modalOverlay) {
      modalOverlay.classList.remove('hidden');
    }
  }

  function simulateRandomAlert() {
    const pool = [
      { category: 'offer', subType: 'Discount Offers', title: 'Limited Time Deal: 20% OFF', desc: 'Use promo code SPEED20 for extra 20% savings at checkout.', actionUrl: 'shop', actionText: 'Redeem Offer', priority: 'high' },
      { category: 'wishlist', subType: 'Back in Stock', title: 'Wishlist Item Back in Stock!', desc: 'Urban Explorer Pro Backpack is now back in stock with 25% discount.', actionUrl: 'wishlist', actionText: 'View Item', priority: 'normal' },
      { category: 'order', subType: 'Packed', title: 'Order Packed & Ready', desc: 'Your order #ORD-9824 has been packed and handed to courier services.', actionUrl: 'orders', actionText: 'Track Order', priority: 'normal' },
      { category: 'cart', subType: 'Low Stock', title: 'Hurry! Low Stock Alert', desc: 'Only 3 items remaining for Noise Ultra 2 Max in your cart.', actionUrl: 'cart', actionText: 'Checkout Now', priority: 'high' },
      { category: 'account', subType: 'Profile Updated', title: 'Password Changed Successfully', desc: 'Your account security password was recently updated from settings.', actionUrl: 'profile', actionText: 'Security Settings', priority: 'normal' }
    ];

    const pick = pool[Math.floor(Math.random() * pool.length)];
    const newNotif = {
      id: 'notif_' + Date.now(),
      ...pick,
      time: 'Just now',
      timestamp: Date.now(),
      unread: true
    };
    addNotification(newNotif);
  }

  function renderNotificationsView(overrideState) {
    if (!viewContainer) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const targetState = overrideState || AppState.simulatedState;

    if (targetState === 'loading') {
      viewContainer.innerHTML = `
        <div class="view-section-header">
          <div>
            <h2 class="view-title">Notification Center</h2>
            <p class="view-subtitle">Fetching latest alerts...</p>
          </div>
        </div>
        ${Skeletons.notifications()}
      `;
      return;
    }

    if (targetState === 'error') {
      viewContainer.innerHTML = `
        <div class="notif-error-container">
          <div class="notif-error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>Unable to Load Notifications</h3>
          <p>Something went wrong while loading your notification center. Please try again.</p>
          <button id="notif-retry-btn" class="notif-btn notif-btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Retry Loading</span>
          </button>
        </div>
      `;
      const retryBtn = document.getElementById('notif-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => renderNotificationsView('normal'));
      }
      return;
    }

    const allNotifs = AppState.notifications || [];
    const filter = AppState.notificationFilter || 'all';
    const query = (AppState.notificationSearchQuery || '').toLowerCase().trim();

    let filtered = allNotifs.filter(n => {
      if (filter === 'unread' && !n.unread) return false;
      if (filter !== 'all' && filter !== 'unread' && n.category !== filter) return false;

      if (query) {
        const inTitle = n.title.toLowerCase().includes(query);
        const inDesc = n.desc.toLowerCase().includes(query);
        const inCat = n.category.toLowerCase().includes(query);
        const inSubType = (n.subType || '').toLowerCase().includes(query);
        return inTitle || inDesc || inCat || inSubType;
      }
      return true;
    });

    const unreadCount = allNotifs.filter(n => n.unread).length;
    const isAllSelected = filtered.length > 0 && filtered.every(n => AppState.selectedNotificationIds.has(n.id));

    let contentHtml = `
      <div class="notif-center-wrapper">
        <!-- Page Header -->
        <div class="notif-header">
          <div class="notif-header-title-group">
            <h2 class="notif-page-title">
              Notification Center
              <span class="notif-header-badge">${unreadCount} Unread</span>
            </h2>
            <p class="notif-page-subtitle">Manage your order updates, offers, wishlist alerts, and account activity</p>
          </div>
          <div class="notif-header-actions">
            <button id="notif-simulate-btn" class="notif-btn notif-btn-outline" title="Simulate a new incoming alert">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Simulate Alert</span>
            </button>
            <button id="notif-mark-all-btn" class="notif-btn notif-btn-outline" ${unreadCount === 0 ? 'disabled' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Mark All Read</span>
            </button>
            <button id="notif-clear-all-btn" class="notif-btn notif-btn-danger-outline" ${allNotifs.length === 0 ? 'disabled' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="notif-controls-bar">
          <!-- Search Box -->
          <div class="notif-search-box">
            <svg class="notif-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="notif-search-input" placeholder="Search notifications by title, category, keyword..." value="${AppState.notificationSearchQuery || ''}" aria-label="Search notifications">
            ${query ? `<button id="notif-search-clear" class="notif-search-clear-btn" aria-label="Clear search">&times;</button>` : ''}
          </div>

          <!-- Category Tabs Bar -->
          <div class="notif-tabs-scroll">
            <div class="notif-tabs-bar">
              <button class="notif-tab-pill ${filter === 'all' ? 'active' : ''}" data-filter="all">All (${allNotifs.length})</button>
              <button class="notif-tab-pill ${filter === 'unread' ? 'active' : ''}" data-filter="unread">Unread (${unreadCount})</button>
              <button class="notif-tab-pill ${filter === 'order' ? 'active' : ''}" data-filter="order">Orders</button>
              <button class="notif-tab-pill ${filter === 'offer' ? 'active' : ''}" data-filter="offer">Offers</button>
              <button class="notif-tab-pill ${filter === 'wishlist' ? 'active' : ''}" data-filter="wishlist">Wishlist</button>
              <button class="notif-tab-pill ${filter === 'cart' ? 'active' : ''}" data-filter="cart">Cart</button>
              <button class="notif-tab-pill ${filter === 'payment' ? 'active' : ''}" data-filter="payment">Payments</button>
              <button class="notif-tab-pill ${filter === 'account' ? 'active' : ''}" data-filter="account">Account</button>
              <button class="notif-tab-pill ${filter === 'system' ? 'active' : ''}" data-filter="system">System</button>
            </div>
          </div>
        </div>

        <!-- Bulk Selection Toolbar -->
        ${filtered.length > 0 ? `
          <div class="notif-bulk-bar">
            <label class="notif-select-all-label">
              <input type="checkbox" id="notif-select-all-checkbox" ${isAllSelected ? 'checked' : ''}>
              <span>Select All (${filtered.length})</span>
            </label>
            <div class="notif-bulk-actions">
              ${AppState.selectedNotificationIds.size > 0 ? `
                <span class="notif-selected-count">${AppState.selectedNotificationIds.size} Selected</span>
                <button id="notif-delete-selected-btn" class="notif-btn notif-btn-sm notif-btn-danger">
                  Delete Selected
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Main Content Area -->
        <div class="notif-content-area">
          ${filtered.length === 0 ? renderNotificationEmptyState(query, filter) : `
            <div class="notif-card-list">
              ${filtered.map(n => renderNotificationCard(n)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    viewContainer.innerHTML = contentHtml;
    bindNotificationViewEvents();
  }

  function renderNotificationCard(n) {
    const meta = getNotificationCategoryMeta(n.category, n.subType);
    const isSelected = AppState.selectedNotificationIds.has(n.id);
    return `
      <div class="notif-card ${n.unread ? 'unread' : ''} ${isSelected ? 'selected' : ''}" data-id="${n.id}">
        <div class="notif-card-checkbox-wrapper">
          <input type="checkbox" class="notif-card-checkbox" data-id="${n.id}" ${isSelected ? 'checked' : ''}>
        </div>

        <div class="notif-card-icon-container ${meta.pillClass}">
          ${meta.iconSvg}
        </div>

        <div class="notif-card-body">
          <div class="notif-card-top-row">
            <div class="notif-card-tags">
              <span class="notif-category-tag ${meta.pillClass}">${meta.label}</span>
              ${n.subType ? `<span class="notif-subtype-tag">${n.subType}</span>` : ''}
              ${n.priority === 'high' ? `<span class="notif-priority-tag">HIGH</span>` : ''}
            </div>
            <span class="notif-card-time">${n.time}</span>
          </div>

          <h4 class="notif-card-title">${n.title}</h4>
          <p class="notif-card-desc">${n.desc}</p>

          <div class="notif-card-footer">
            ${n.actionUrl ? `
              <button class="notif-card-action-btn" data-url="${n.actionUrl}">
                <span>${n.actionText || 'View Details'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            ` : '<div></div>'}

            <div class="notif-card-quick-actions">
              <button class="notif-icon-action-btn toggle-read-btn" data-id="${n.id}" title="${n.unread ? 'Mark as read' : 'Mark as unread'}">
                ${n.unread ? `
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                ` : `
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/></svg>
                `}
              </button>
              <button class="notif-icon-action-btn delete-card-btn" data-id="${n.id}" title="Delete notification">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderNotificationEmptyState(query, filter) {
    const isFiltered = query.length > 0 || filter !== 'all';
    return `
      <div class="notif-empty-state">
        <div class="notif-empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" fill="var(--bg-body)" stroke="var(--border-color)" stroke-width="2"/>
            <path d="M100 45 C75 45, 60 65, 60 90 L60 120 L45 135 L155 135 L140 120 L140 90 C140 65, 125 45, 100 45 Z" fill="var(--bg-card)" stroke="var(--text-muted)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M85 145 C85 153, 91 160, 100 160 C109 160, 115 153, 115 145" fill="none" stroke="var(--color-accent)" stroke-width="4" stroke-linecap="round"/>
            <circle cx="100" cy="90" r="16" fill="var(--color-accent)" opacity="0.2"/>
            <path d="M92 90 L98 96 L110 84" stroke="var(--color-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="notif-empty-title">${isFiltered ? 'No Matching Notifications Found' : 'No Notifications Yet'}</h3>
        <p class="notif-empty-desc">${isFiltered ? 'Try clearing your search query or switching category filters to see more notifications.' : 'We will notify you when there are order updates, flash sales, price drops, or account alerts.'}</p>
        ${isFiltered ? `
          <button id="notif-reset-filters-btn" class="notif-btn notif-btn-primary">Reset Filters</button>
        ` : `
          <button id="notif-explore-btn" class="notif-btn notif-btn-primary">Explore Products</button>
        `}
      </div>
    `;
  }

  function bindNotificationViewEvents() {
    const searchInput = document.getElementById('notif-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        AppState.notificationSearchQuery = e.target.value;
        renderNotificationsView();
      });
    }

    const searchClear = document.getElementById('notif-search-clear');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        AppState.notificationSearchQuery = '';
        renderNotificationsView();
      });
    }

    document.querySelectorAll('.notif-tab-pill').forEach(tab => {
      tab.addEventListener('click', () => {
        AppState.notificationFilter = tab.getAttribute('data-filter');
        renderNotificationsView();
      });
    });

    const markAllBtn = document.getElementById('notif-mark-all-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', markAllNotificationsAsRead);
    }

    const clearAllBtn = document.getElementById('notif-clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', openClearAllModal);
    }

    const simulateBtn = document.getElementById('notif-simulate-btn');
    if (simulateBtn) {
      simulateBtn.addEventListener('click', simulateRandomAlert);
    }

    const resetBtn = document.getElementById('notif-reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        AppState.notificationSearchQuery = '';
        AppState.notificationFilter = 'all';
        renderNotificationsView();
      });
    }

    const exploreBtn = document.getElementById('notif-explore-btn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => renderView('shop'));
    }

    const selectAllCb = document.getElementById('notif-select-all-checkbox');
    if (selectAllCb) {
      selectAllCb.addEventListener('change', (e) => {
        const allNotifs = AppState.notifications || [];
        const filter = AppState.notificationFilter || 'all';
        const query = (AppState.notificationSearchQuery || '').toLowerCase().trim();
        let filtered = allNotifs.filter(n => {
          if (filter === 'unread' && !n.unread) return false;
          if (filter !== 'all' && filter !== 'unread' && n.category !== filter) return false;
          if (query) {
            return n.title.toLowerCase().includes(query) || n.desc.toLowerCase().includes(query);
          }
          return true;
        });

        if (e.target.checked) {
          filtered.forEach(n => AppState.selectedNotificationIds.add(n.id));
        } else {
          filtered.forEach(n => AppState.selectedNotificationIds.delete(n.id));
        }
        renderNotificationsView();
      });
    }

    document.querySelectorAll('.notif-card-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.getAttribute('data-id');
        if (e.target.checked) {
          AppState.selectedNotificationIds.add(id);
        } else {
          AppState.selectedNotificationIds.delete(id);
        }
        renderNotificationsView();
      });
    });

    const deleteSelectedBtn = document.getElementById('notif-delete-selected-btn');
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', deleteSelectedNotifications);
    }

    document.querySelectorAll('.notif-card-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.notif-card');
        const id = card.getAttribute('data-id');
        const targetNotif = AppState.notifications.find(n => n.id === id);
        if (targetNotif) {
          markNotificationAsRead(id);
          renderView(btn.getAttribute('data-url'));
        }
      });
    });

    document.querySelectorAll('.toggle-read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const targetNotif = AppState.notifications.find(n => n.id === id);
        if (targetNotif) {
          if (targetNotif.unread) markNotificationAsRead(id);
          else {
            const notifs = AppState.notifications.map(n => n.id === id ? { ...n, unread: true } : n);
            saveNotificationsToStorage(notifs);
          }
          renderNotificationsView();
        }
      });
    });

    document.querySelectorAll('.delete-card-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.notif-card');
        const id = btn.getAttribute('data-id');
        if (card) {
          card.classList.add('removing');
          setTimeout(() => {
            deleteNotification(id);
            renderNotificationsView();
          }, 250);
        } else {
          deleteNotification(id);
          renderNotificationsView();
        }
      });
    });
  }

  // Initialize Notifications Module after all definitions
  initNotificationModule();

  /* ==========================================================================
     Home Page Animations & Sophisticated Micro-Interactions Engine
     ========================================================================== */
  /* ==========================================================================
     Enhanced Home Page Animations, Micro-interactions & Visual Effects Engine
     ========================================================================== */
  let dealsCountdownInterval = null;
  let heroCarouselInterval = null;

  function initHomePageAnimations() {
    // 1. Top Scroll Progress Indicator Bar
    const progressBar = document.getElementById('scroll-progress-bar');
    if (progressBar) {
      const updateProgressBar = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      };
      window.addEventListener('scroll', updateProgressBar, { passive: true });
      updateProgressBar();
    }

    // 2. Scroll Reveal Intersection Observer
    const revealElements = document.querySelectorAll('.reveal-element');
    if ('IntersectionObserver' in window && revealElements.length > 0) {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
      };

      const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('in-view');
        } else {
          scrollObserver.observe(el);
        }
      });
    } else {
      revealElements.forEach(el => el.classList.add('in-view'));
    }

    // 3. Sticky Glassmorphic Header Scroll FX
    const topHeader = document.querySelector('.top-header');
    if (topHeader) {
      const handleScroll = () => {
        if (window.scrollY > 20) {
          topHeader.classList.add('scrolled-header');
        } else {
          topHeader.classList.remove('scrolled-header');
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    // 4. Interactive Hero Carousel Controller
    const carouselContainer = document.getElementById('hero-carousel');
    const carouselTrack = document.getElementById('hero-carousel-track');
    const slides = document.querySelectorAll('.hero-slide');
    const prevBtn = document.getElementById('hero-prev-btn');
    const nextBtn = document.getElementById('hero-next-btn');
    const dots = document.querySelectorAll('.indicator-dot');

    if (carouselTrack && slides.length > 0) {
      let currentSlide = 0;
      const totalSlides = slides.length;

      const goToSlide = (index) => {
        currentSlide = (index + totalSlides) % totalSlides;
        carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

        slides.forEach((slide, idx) => {
          slide.classList.toggle('active', idx === currentSlide);
        });

        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === currentSlide);
        });
      };

      const nextSlide = () => goToSlide(currentSlide + 1);
      const prevSlide = () => goToSlide(currentSlide - 1);

      if (nextBtn) nextBtn.onclick = (e) => { e.preventDefault(); nextSlide(); resetCarouselTimer(); };
      if (prevBtn) prevBtn.onclick = (e) => { e.preventDefault(); prevSlide(); resetCarouselTimer(); };

      dots.forEach(dot => {
        dot.onclick = function () {
          const slideTo = parseInt(this.dataset.slideTo || '0', 10);
          goToSlide(slideTo);
          resetCarouselTimer();
        };
      });

      const startCarouselTimer = () => {
        if (heroCarouselInterval) clearInterval(heroCarouselInterval);
        heroCarouselInterval = setInterval(nextSlide, 5000);
      };

      const resetCarouselTimer = () => {
        startCarouselTimer();
      };

      if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => clearInterval(heroCarouselInterval));
        carouselContainer.addEventListener('mouseleave', startCarouselTimer);
      }

      startCarouselTimer();
    }

    // 5. Interactive Button Ripple FX
    document.querySelectorAll('.ripple-button').forEach(button => {
      if (button.dataset.rippleAttached) return;
      button.dataset.rippleAttached = 'true';

      button.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripple.classList.add('btn-ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      });
    });

    // 6. Wishlist Heart Pop & Particle Micro-interaction
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      if (btn.dataset.heartAttached) return;
      btn.dataset.heartAttached = 'true';

      btn.addEventListener('click', function (e) {
        this.classList.add('animated-heart');
        setTimeout(() => this.classList.remove('animated-heart'), 500);

        const rect = this.getBoundingClientRect();
        for (let i = 0; i < 4; i++) {
          const particle = document.createElement('span');
          particle.className = 'heart-particle';
          particle.innerHTML = '♥';
          particle.style.color = 'var(--color-danger)';
          particle.style.left = `${rect.left + rect.width / 2}px`;
          particle.style.top = `${rect.top + rect.height / 2}px`;

          const tx = (Math.random() - 0.5) * 60;
          const ty = -(Math.random() * 50 + 20);
          const rot = (Math.random() - 0.5) * 80;

          particle.style.setProperty('--tx', `${tx}px`);
          particle.style.setProperty('--ty', `${ty}px`);
          particle.style.setProperty('--rot', `${rot}deg`);

          document.body.appendChild(particle);
          setTimeout(() => particle.remove(), 650);
        }
      });
    });

    // 7. Add-to-Cart Floating "+1" Badge Micro-interaction
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      if (btn.dataset.cartAttached) return;
      btn.dataset.cartAttached = 'true';

      btn.addEventListener('click', function (e) {
        const badge = document.createElement('div');
        badge.className = 'cart-plus-one';
        badge.innerText = '+1';

        const rect = this.getBoundingClientRect();
        badge.style.top = `${e.clientY - rect.top - 20}px`;
        badge.style.left = `${e.clientX - rect.left}px`;

        this.appendChild(badge);
        setTimeout(() => badge.remove(), 800);
      });
    });

    // 8. Quick View Product Modal Handler
    const qvModal = document.getElementById('quickview-modal');
    const qvCloseBtn = document.getElementById('quickview-close-btn');

    const sampleProducts = {
      "1": { name: "Noise Ultra 2 Max", category: "Smart Watch", price: "₹4,999", original: "₹6,999", discount: "-20%", img: "assets/images/prod_watch.png", desc: "1.78'' AMOLED Display, Bluetooth Calling, 100+ Sports Modes with sleek metallic casing." },
      "2": { name: "Boat Airdopes 181", category: "Earbuds", price: "₹1,299", original: "₹1,999", discount: "HOT", img: "assets/images/prod_earbuds.png", desc: "ENx Tech, 20 Hours Playback, ASAP Charge with Beast Mode low-latency for gaming." },
      "3": { name: "Canon EOS M50 Mark II", category: "Camera", price: "₹54,990", original: "₹59,999", discount: "-8%", img: "assets/images/prod_camera.png", desc: "24.1 MP CMOS Sensor, 4K Video, Dual Pixel CMOS AF with Eye Detection AF." },
      "4": { name: "Urban Explorer Pro", category: "Backpack", price: "₹2,999", original: "₹3,999", discount: "-25%", img: "assets/images/prod_backpack.png", desc: "Water-resistant tech backpack with dedicated 15.6'' laptop sleeve & anti-theft pocket." }
    };

    document.querySelectorAll('.quickview-trigger-btn').forEach(btn => {
      if (btn.dataset.qvAttached) return;
      btn.dataset.qvAttached = 'true';

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const pid = this.dataset.productId || "1";
        const prod = sampleProducts[pid] || sampleProducts["1"];

        document.getElementById('qv-title').textContent = prod.name;
        document.getElementById('qv-category').textContent = prod.category;
        document.getElementById('qv-price-current').textContent = prod.price;
        document.getElementById('qv-price-original').textContent = prod.original;
        document.getElementById('qv-discount-badge').textContent = prod.discount;
        document.getElementById('qv-description').textContent = prod.desc;
        document.getElementById('qv-main-img').src = prod.img;

        qvModal.classList.remove('hidden');
      });
    });

    if (qvCloseBtn && qvModal) {
      qvCloseBtn.onclick = () => qvModal.classList.add('hidden');
      qvModal.onclick = (e) => {
        if (e.target === qvModal) qvModal.classList.add('hidden');
      };
    }

    const qvAddCartBtn = document.getElementById('qv-add-cart-btn');
    if (qvAddCartBtn) {
      qvAddCartBtn.onclick = function (e) {
        const badge = document.createElement('div');
        badge.className = 'cart-plus-one';
        badge.innerText = '+1';
        const rect = this.getBoundingClientRect();
        badge.style.top = `${e.clientY - rect.top - 20}px`;
        badge.style.left = `${e.clientX - rect.left}px`;
        this.appendChild(badge);
        setTimeout(() => badge.remove(), 800);
        setTimeout(() => qvModal.classList.add('hidden'), 500);
      };
    }

    // 9. Animated Counter Numbers on Scroll Reveal
    const counterElements = document.querySelectorAll('[data-counter]');
    if ('IntersectionObserver' in window && counterElements.length > 0) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const targetEl = entry.target;
            const targetNum = parseInt(targetEl.dataset.counter || '0', 10);
            let currentNum = 0;
            const duration = 1500;
            const stepTime = 30;
            const steps = duration / stepTime;
            const increment = targetNum / steps;

            const timer = setInterval(() => {
              currentNum += increment;
              if (currentNum >= targetNum) {
                currentNum = targetNum;
                clearInterval(timer);
              }
              const displayVal = currentNum >= 1000 ? `${Math.floor(currentNum / 1000)}K+` : Math.floor(currentNum);
              targetEl.textContent = displayVal;
            }, stepTime);

            observer.unobserve(targetEl);
          }
        });
      }, { threshold: 0.5 });

      counterElements.forEach(el => counterObserver.observe(el));
    }

    // 10. 3D Card Tilt Mouse Parallax (For Desktop Fine Pointer)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const tiltCards = document.querySelectorAll('.product-card, .category-card, .deals-block');
      tiltCards.forEach(card => {
        if (card.dataset.tiltAttached) return;
        card.dataset.tiltAttached = 'true';

        card.addEventListener('mousemove', function (e) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          const tiltX = (y / (rect.height / 2)) * -5;
          const tiltY = (x / (rect.width / 2)) * 5;

          this.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-6px) scale(1.015)`;
        });

        card.addEventListener('mouseleave', function () {
          this.style.transform = '';
        });
      });

      const magneticBtns = document.querySelectorAll('.shop-now-btn, .deals-action-btn, .promo-signup-btn');
      magneticBtns.forEach(btn => {
        if (btn.dataset.magneticAttached) return;
        btn.dataset.magneticAttached = 'true';
        btn.classList.add('magnetic-btn');

        btn.addEventListener('mousemove', function (e) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          this.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });

        btn.addEventListener('mouseleave', function () {
          this.style.transform = 'translate(0px, 0px)';
        });
      });
    }

    // 11. Exclusive Deals Live Countdown Timer Loop
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    if (hoursEl && minsEl && secsEl) {
      if (dealsCountdownInterval) clearInterval(dealsCountdownInterval);

      let totalSeconds = 8 * 3600 + 42 * 60 + 19;

      const updateTimer = () => {
        if (totalSeconds <= 0) {
          totalSeconds = 24 * 3600;
        } else {
          totalSeconds--;
        }

        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        const pad = (num) => String(num).padStart(2, '0');

        const newH = pad(h);
        const newM = pad(m);
        const newS = pad(s);

        if (hoursEl.textContent !== newH) {
          hoursEl.textContent = newH;
          hoursEl.classList.add('tick-pop');
          setTimeout(() => hoursEl.classList.remove('tick-pop'), 200);
        }
        if (minsEl.textContent !== newM) {
          minsEl.textContent = newM;
          minsEl.classList.add('tick-pop');
          setTimeout(() => minsEl.classList.remove('tick-pop'), 200);
        }
        if (secsEl.textContent !== newS) {
          secsEl.textContent = newS;
          secsEl.classList.add('tick-pop');
          setTimeout(() => secsEl.classList.remove('tick-pop'), 200);
        }
      };

      dealsCountdownInterval = setInterval(updateTimer, 1000);
    }
  }

  // Expose global initializer for SPA route switching
  window.initHomePageAnimations = initHomePageAnimations;

  // Run Home Page animations on initial DOM load
  initHomePageAnimations();
});


window.initHomePageAnimations = initHomePageAnimations;

// Run Home Page animations on initial DOM load
initHomePageAnimations();
});


