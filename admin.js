/* ==========================================================================
   ShopSphere Admin JS Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Enforce light/dark visual theme on load
  const activeTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', activeTheme);

  // Bind theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Check admin session validation
  const sessionToken = sessionStorage.getItem('shopsphere_admin_token');
  if (sessionToken === 'active_admin_session_token_2026') {
    showAdminDashboard();
  } else {
    showLoginScreen();
  }

  // Bind login action
  document.getElementById('admin-login-submit').addEventListener('click', handleAdminLogin);
  
  // Bind logout action
  document.getElementById('logout-btn').addEventListener('click', handleAdminLogout);

  // Bind storefront exit link
  document.getElementById('view-storefront').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index.html';
  });

  // Bind sidebar nav links routing
  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const targetTab = link.getAttribute('data-tab');
      document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
      
      const targetView = document.getElementById(`view-${targetTab}`);
      if (targetView) targetView.classList.add('active');

      // Set page title
      document.getElementById('page-title').innerText = link.innerText;

      // Render corresponding module view
      loadModuleView(targetTab);
    });
  });
});

/* ==========================================================================
   Authentication & Session Handling
   ========================================================================== */
const ADMIN_USERNAME = 'admin_ss';
const ADMIN_PASSWORD = 'ss123';

function showLoginScreen() {
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('sidebar-layout').style.display = 'none';
  document.getElementById('main-layout').style.display = 'none';
}

function showAdminDashboard() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('sidebar-layout').style.display = 'flex';
  document.getElementById('main-layout').style.display = 'block';
  
  // Load databases and render overview
  initializeAdminDatabases();
  loadModuleView('dashboard');
}

function handleAdminLogin() {
  const usernameInput = document.getElementById('admin-login-username').value.trim();
  const passwordInput = document.getElementById('admin-login-password').value.trim();
  const errorMsg = document.getElementById('login-error-msg');

  if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
    sessionStorage.setItem('shopsphere_admin_token', 'active_admin_session_token_2026');
    errorMsg.style.display = 'none';
    showAdminDashboard();
  } else {
    errorMsg.innerText = 'Invalid admin credentials. Please try again.';
    errorMsg.style.display = 'block';
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('shopsphere_admin_token');
  showLoginScreen();
}

/* ==========================================================================
   LocalStorage Database Sync & Initializer
   ========================================================================== */
function initializeAdminDatabases() {
  // 1. Coupons Database
  if (!localStorage.getItem('shopsphere_coupons')) {
    const defaultCoupons = [
      { id: 1, code: 'WELCOME10', type: 'PERCENTAGE', value: 10, isActive: true },
      { id: 2, code: 'HYPE500', type: 'FIXED_AMOUNT', value: 500, isActive: true }
    ];
    localStorage.setItem('shopsphere_coupons', JSON.stringify(defaultCoupons));
  }

  // 2. Settings Database
  if (!localStorage.getItem('shopsphere_settings')) {
    const defaultSettings = {
      taxRate: 18,
      shippingPrice: 99,
      gateway: 'razorpay'
    };
    localStorage.setItem('shopsphere_settings', JSON.stringify(defaultSettings));
  }

  // 3. Delivery database
  if (!localStorage.getItem('shopsphere_delivery_log')) {
    localStorage.setItem('shopsphere_delivery_log', JSON.stringify([]));
  }

  // 4. Notifications database
  if (!localStorage.getItem('shopsphere_notifications_log')) {
    const defaultLogs = [
      { recipient: 'All Users', medium: 'Push Notification', content: 'Big Summer Sale is Live! Get up to 30% off.', timestamp: new Date().toLocaleString() }
    ];
    localStorage.setItem('shopsphere_notifications_log', JSON.stringify(defaultLogs));
  }

  // 5. Sync default catalog/reviews/orders/users if storefront has not initialized them yet
  if (!localStorage.getItem('aura_registered_users')) {
    const defaultUsers = [
      { id: 'usr_1001', name: 'Admin Manager', email: 'admin@shopsphere.com', phone: '9988776655', role: 'ADMIN' },
      { id: 'usr_1002', name: 'John Doe', email: 'john@example.com', phone: '9876543210', role: 'CUSTOMER' }
    ];
    localStorage.setItem('aura_registered_users', JSON.stringify(defaultUsers));
  }
}

/* ==========================================================================
   Module Routing Controller
   ========================================================================== */
function loadModuleView(tabName) {
  renderKPIs();
  
  switch (tabName) {
    case 'dashboard':
      // Overview stats are loaded by renderKPIs
      break;
    case 'products':
      renderProductsTable();
      populateCategorySelectDropdown();
      break;
    case 'categories':
      renderCategoriesTable();
      break;
    case 'orders':
      renderOrdersTable();
      break;
    case 'users':
      renderUsersTable();
      break;
    case 'inventory':
      renderInventoryTable();
      break;
    case 'coupons':
      renderCouponsTable();
      break;
    case 'payments':
      renderPaymentsTable();
      break;
    case 'delivery':
      renderDeliveryTable();
      break;
    case 'reviews':
      renderReviewsTable();
      break;
    case 'notifications':
      renderNotificationsTable();
      break;
    case 'analytics':
      renderAnalyticsReport();
      break;
    case 'settings':
      loadSettingsValues();
      break;
  }
}

/* ==========================================================================
   KPI overview panel
   ========================================================================== */
function renderKPIs() {
  // Sales
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const totalRevenue = orders.reduce((sum, o) => {
    if (o.status === 'CANCELLED') return sum;
    const cleanNum = parseFloat(String(o.total || '0').replace(/[^\d.]/g, ''));
    return sum + cleanNum;
  }, 0);
  document.getElementById('kpi-sales').innerText = `₹${totalRevenue.toLocaleString()}`;

  // Orders
  document.getElementById('kpi-orders').innerText = orders.length;

  // Products catalog size
  const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  document.getElementById('kpi-products').innerText = products.length;

  // Coupons
  const coupons = JSON.parse(localStorage.getItem('shopsphere_coupons') || '[]');
  document.getElementById('kpi-coupons').innerText = coupons.filter(c => c.isActive).length;
}

/* ==========================================================================
   MODULE 2: Product Management
   ========================================================================== */
function renderProductsTable() {
  const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  const tableBody = document.getElementById('products-table-body');
  tableBody.innerHTML = '';

  if (products.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">No catalog products found. Add a new one to start!</td></tr>`;
    return;
  }

  products.forEach(p => {
    const priceStr = String(p.price).includes('₹') ? p.price : `₹${p.price.toLocaleString()}`;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><img src="${p.img || 'assets/images/prod_watch.png'}" class="product-img-th" alt="${p.name}"></td>
      <td style="font-weight: 600;">${p.name}</td>
      <td>${p.cat}</td>
      <td>${priceStr}</td>
      <td style="font-weight: 500; color: ${p.stockCount < 5 ? 'var(--color-danger)' : 'inherit'}">${p.stockCount}</td>
      <td style="font-family: monospace; font-size: 13px;">${p.sku || 'N/A'}</td>
      <td style="text-align: right;">
        <button class="btn btn-secondary" onclick="openEditProductModal(${p.id})" style="padding: 6px 12px; font-size: 12.5px; margin-right: 6px;">Edit</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})" style="padding: 6px 12px; font-size: 12.5px;">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function populateCategorySelectDropdown() {
  const categories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
  const select = document.getElementById('prod-form-cat');
  select.innerHTML = '';
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.innerText = c.name;
    select.appendChild(opt);
  });
}

function openProductModal() {
  document.getElementById('product-modal-title').innerText = 'Add New Product';
  document.getElementById('prod-form-id').value = '';
  document.getElementById('prod-form-name').value = '';
  document.getElementById('prod-form-price').value = '';
  document.getElementById('prod-form-stock').value = '';
  document.getElementById('prod-form-img').value = '';
  document.getElementById('prod-form-desc').value = '';
  document.getElementById('product-modal').style.display = 'flex';
}

function openEditProductModal(id) {
  const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  const p = products.find(prod => prod.id === id);
  if (!p) return;

  document.getElementById('product-modal-title').innerText = 'Edit Product Details';
  document.getElementById('prod-form-id').value = p.id;
  document.getElementById('prod-form-name').value = p.name;
  document.getElementById('prod-form-cat').value = p.cat;
  document.getElementById('prod-form-price').value = String(p.price).replace(/[^\d.]/g, '');
  document.getElementById('prod-form-stock').value = p.stockCount || 10;
  document.getElementById('prod-form-img').value = p.img || '';
  document.getElementById('prod-form-desc').value = p.shortDesc || '';
  
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

function saveProductForm() {
  const id = document.getElementById('prod-form-id').value;
  const name = document.getElementById('prod-form-name').value.trim();
  const cat = document.getElementById('prod-form-cat').value;
  const price = parseFloat(document.getElementById('prod-form-price').value);
  const stock = parseInt(document.getElementById('prod-form-stock').value);
  const img = document.getElementById('prod-form-img').value.trim();
  const desc = document.getElementById('prod-form-desc').value.trim();

  if (!name || isNaN(price) || isNaN(stock)) {
    alert('Please fill out the product name, price, and stock quantity.');
    return;
  }

  const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');

  if (id) {
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      products[index] = {
        ...products[index],
        name,
        cat,
        price: `₹${price.toLocaleString()}`,
        numericPrice: price,
        stockCount: stock,
        inStock: stock > 0,
        img: img || 'assets/images/prod_watch.png',
        shortDesc: desc,
        description: desc
      };
    }
  } else {
    const nextId = products.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
    const newProduct = {
      id: nextId,
      name,
      cat,
      brand: 'ShopSphere',
      price: `₹${price.toLocaleString()}`,
      originalPrice: `₹${(price * 1.35).toFixed(0)}`,
      numericPrice: price,
      discount: 25,
      badge: 'NEW',
      rating: 4.5,
      reviewCount: 0,
      inStock: stock > 0,
      stockCount: stock,
      sku: `SKU-PROD-${nextId}20`,
      img: img || 'assets/images/prod_watch.png',
      images: [img || 'assets/images/prod_watch.png'],
      shortDesc: desc,
      description: desc,
      specs: { 'Shipping': 'Standard Delivery' }
    };
    products.push(newProduct);
  }

  localStorage.setItem('shopsphere_products', JSON.stringify(products));
  closeProductModal();
  renderProductsTable();
  renderKPIs();
}

function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  let products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  products = products.filter(p => p.id !== id);
  localStorage.setItem('shopsphere_products', JSON.stringify(products));
  renderProductsTable();
  renderKPIs();
}

/* ==========================================================================
   MODULE 3: Category Management
   ========================================================================== */
function renderCategoriesTable() {
  const categories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
  const tableBody = document.getElementById('categories-table-body');
  tableBody.innerHTML = '';

  categories.forEach((c, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: 600;">${c.name}</td>
      <td>${c.subtitle || 'Collection'}</td>
      <td><span style="display:inline-block; width: 18px; height: 18px; border-radius: 50%; background-color:${c.bg || '#ccc'}; margin-right: 8px; vertical-align: middle;"></span>${c.bg || '#ccc'}</td>
      <td style="text-align: right;">
        <button class="btn btn-danger" onclick="deleteCategory(${index})" style="padding: 6px 12px; font-size: 12.5px;">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function openCategoryModal() {
  document.getElementById('cat-form-id').value = '';
  document.getElementById('cat-form-name').value = '';
  document.getElementById('cat-form-subtitle').value = '';
  document.getElementById('cat-form-bg').value = '#f3e8ff';
  document.getElementById('category-modal').style.display = 'flex';
}

function closeCategoryModal() {
  document.getElementById('category-modal').style.display = 'none';
}

function saveCategoryForm() {
  const name = document.getElementById('cat-form-name').value.trim();
  const subtitle = document.getElementById('cat-form-subtitle').value.trim();
  const bg = document.getElementById('cat-form-bg').value.trim();

  if (!name) {
    alert('Category Name is required.');
    return;
  }

  const categories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
  categories.push({
    name,
    subtitle: subtitle || 'Collection',
    bg: bg || '#f3e8ff',
    img: 'assets/images/cat_accessories.png'
  });

  localStorage.setItem('shopsphere_categories', JSON.stringify(categories));
  closeCategoryModal();
  renderCategoriesTable();
}

function deleteCategory(index) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  const categories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
  categories.splice(index, 1);
  localStorage.setItem('shopsphere_categories', JSON.stringify(categories));
  renderCategoriesTable();
}

/* ==========================================================================
   MODULE 4: Order Management Workflow
   ========================================================================== */
function renderOrdersTable() {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const tableBody = document.getElementById('orders-table-body');
  tableBody.innerHTML = '';

  if (orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 30px;">No transaction orders logged.</td></tr>`;
    return;
  }

  orders.forEach(order => {
    const addr = order.address || {};
    const addrStr = `${addr.line1 || ''}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city || ''}, ${addr.state || ''} - ${addr.zip || ''}`;
    const itemsSummary = (order.items || []).map(it => `${it.name} (x${it.quantity})`).join(', ');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 13px; font-weight: 600;">#${order.id}</td>
      <td>${order.customerName || 'Guest User'}</td>
      <td style="font-size: 13px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsSummary}">${itemsSummary}</td>
      <td style="font-weight: 600;">${order.total}</td>
      <td>${order.paymentMethod || 'COD'}</td>
      <td style="font-size: 12.5px; color: var(--text-secondary); max-width: 180px;">${addrStr}</td>
      <td><span class="badge-status status-${(order.status || 'PLACED').toLowerCase()}">${order.status || 'PLACED'}</span></td>
      <td>
        <select class="form-control" style="padding: 4px 8px; font-size: 12px; height: auto;" onchange="updateOrderStatus('${order.id}', this.value)">
          <option value="PLACED" ${order.status === 'PLACED' ? 'selected' : ''}>Placed</option>
          <option value="PACKED" ${order.status === 'PACKED' ? 'selected' : ''}>Packed</option>
          <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
          <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
          <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function updateOrderStatus(orderId, newStatus) {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const index = orders.findIndex(o => String(o.id) === String(orderId));
  if (index !== -1) {
    orders[index].status = newStatus;
    localStorage.setItem('shopsphere_orders', JSON.stringify(orders));
    
    // Log dynamic status update to delivery logs automatically
    updateDeliveryLogStatus(orderId, newStatus);
    
    // Log standard notification triggers
    logSystemNotification('Customer', 'SMS & Email', `Order #${orderId} status has been updated to: ${newStatus}`);
    
    renderOrdersTable();
    renderKPIs();
  }
}

/* ==========================================================================
   MODULE 5: User Management
   ========================================================================== */
function renderUsersTable() {
  const users = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
  const tableBody = document.getElementById('users-table-body');
  tableBody.innerHTML = '';

  users.forEach(u => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 13px;">${u.id}</td>
      <td style="font-weight: 600;">${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone || 'N/A'}</td>
      <td><span style="font-weight: 700; color: ${u.role === 'ADMIN' ? 'var(--color-success)' : 'inherit'}">${u.role || 'CUSTOMER'}</span></td>
    `;
    tableBody.appendChild(row);
  });
}

/* ==========================================================================
   MODULE 6: Inventory Management
   ========================================================================== */
function renderInventoryTable() {
  const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  const tableBody = document.getElementById('inventory-table-body');
  tableBody.innerHTML = '';

  products.forEach(p => {
    const statusText = p.stockCount <= 0 ? 'Out of Stock' : (p.stockCount <= 5 ? 'Low Stock' : 'In Stock');
    const colorClass = p.stockCount <= 0 ? 'var(--color-danger)' : (p.stockCount <= 5 ? 'var(--color-warning)' : 'var(--color-success)');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: 600;">${p.name}</td>
      <td style="font-weight: bold; color: ${colorClass}">${p.stockCount}</td>
      <td><span style="font-weight: 600; color:${colorClass}">${statusText}</span></td>
      <td>
        <div style="display:flex; gap: 8px; align-items:center;">
          <input type="number" class="form-control" style="width: 80px; padding: 4px 8px; height:auto;" id="inv-update-${p.id}" value="${p.stockCount}">
          <button class="btn btn-secondary" onclick="updateSingleProductStock(${p.id})" style="padding: 5px 10px; font-size: 12px;">Update</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function updateSingleProductStock(id) {
  const inputVal = parseInt(document.getElementById(`inv-update-${id}`).value);
  if (isNaN(inputVal) || inputVal < 0) {
    alert('Please enter a valid stock quantity.');
    return;
  }
  const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index].stockCount = inputVal;
    products[index].inStock = inputVal > 0;
    localStorage.setItem('shopsphere_products', JSON.stringify(products));
    renderInventoryTable();
    renderKPIs();
  }
}

/* ==========================================================================
   MODULE 7: Coupon Management
   ========================================================================== */
function renderCouponsTable() {
  const coupons = JSON.parse(localStorage.getItem('shopsphere_coupons') || '[]');
  const tableBody = document.getElementById('coupons-table-body');
  tableBody.innerHTML = '';

  coupons.forEach(c => {
    const valText = c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-weight: bold;">${c.code}</td>
      <td>${c.type}</td>
      <td style="font-weight: 600;">${valText}</td>
      <td>
        <span class="badge-status" style="background-color:${c.isActive ? 'rgba(46,196,182,0.12)' : 'rgba(231,29,54,0.12)'}; color:${c.isActive ? 'var(--color-success)' : 'var(--color-danger)'}">
          ${c.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td style="text-align: right;">
        <button class="btn btn-secondary" onclick="toggleCouponStatus(${c.id})" style="padding: 6px 12px; font-size: 12.5px; margin-right: 6px;">Toggle</button>
        <button class="btn btn-danger" onclick="deleteCoupon(${c.id})" style="padding: 6px 12px; font-size: 12.5px;">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function openCouponModal() {
  document.getElementById('coupon-form-id').value = '';
  document.getElementById('coupon-form-code').value = '';
  document.getElementById('coupon-form-type').value = 'PERCENTAGE';
  document.getElementById('coupon-form-value').value = '';
  document.getElementById('coupon-modal').style.display = 'flex';
}

function closeCouponModal() {
  document.getElementById('coupon-modal').style.display = 'none';
}

function saveCouponForm() {
  const code = document.getElementById('coupon-form-code').value.trim().toUpperCase();
  const type = document.getElementById('coupon-form-type').value;
  const value = parseFloat(document.getElementById('coupon-form-value').value);

  if (!code || isNaN(value) || value <= 0) {
    alert('Please fill out a valid coupon code and numeric discount value.');
    return;
  }

  const coupons = JSON.parse(localStorage.getItem('shopsphere_coupons') || '[]');
  const nextId = coupons.reduce((max, c) => c.id > max ? c.id : max, 0) + 1;

  coupons.push({
    id: nextId,
    code,
    type,
    value,
    isActive: true
  });

  localStorage.setItem('shopsphere_coupons', JSON.stringify(coupons));
  closeCouponModal();
  renderCouponsTable();
  renderKPIs();
}

function toggleCouponStatus(id) {
  const coupons = JSON.parse(localStorage.getItem('shopsphere_coupons') || '[]');
  const index = coupons.findIndex(c => c.id === id);
  if (index !== -1) {
    coupons[index].isActive = !coupons[index].isActive;
    localStorage.setItem('shopsphere_coupons', JSON.stringify(coupons));
    renderCouponsTable();
    renderKPIs();
  }
}

function deleteCoupon(id) {
  if (!confirm('Are you sure you want to delete this coupon?')) return;
  let coupons = JSON.parse(localStorage.getItem('shopsphere_coupons') || '[]');
  coupons = coupons.filter(c => c.id !== id);
  localStorage.setItem('shopsphere_coupons', JSON.stringify(coupons));
  renderCouponsTable();
  renderKPIs();
}

/* ==========================================================================
   MODULE 8: Payment Management
   ========================================================================== */
function renderPaymentsTable() {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const tableBody = document.getElementById('payments-table-body');
  tableBody.innerHTML = '';

  if (orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 30px;">No transaction records available.</td></tr>`;
    return;
  }

  orders.forEach(o => {
    // If Cash On Delivery, payment status defaults to pending until marked delivered
    const defaultStatus = o.paymentMethod === 'COD' ? 'Pending (COD)' : 'Verified';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 13px; font-weight: 600;">#${o.id}</td>
      <td style="font-weight: 600;">${o.paymentMethod || 'COD'}</td>
      <td style="font-weight: bold;">${o.total}</td>
      <td><span class="badge-status status-delivered">${defaultStatus}</span></td>
      <td>
        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="alert('Transaction receipt checked successfully.')">Verify Details</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/* ==========================================================================
   MODULE 9: Delivery & Shipments Coordinator
   ========================================================================== */
function renderDeliveryTable() {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const deliveryLog = JSON.parse(localStorage.getItem('shopsphere_delivery_log') || '[]');
  const tableBody = document.getElementById('delivery-table-body');
  tableBody.innerHTML = '';

  if (orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 30px;">No shipments logs logged.</td></tr>`;
    return;
  }

  orders.forEach(o => {
    const delivery = deliveryLog.find(d => String(d.orderId) === String(o.id)) || { partner: 'Unassigned', status: o.status || 'PLACED' };
    const addr = o.address || {};
    const addrStr = `${addr.line1 || ''}, ${addr.city || ''}`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 13px; font-weight: 600;">#${o.id}</td>
      <td style="font-size: 13px; color: var(--text-secondary);">${addrStr}</td>
      <td style="font-weight: 600;">${delivery.partner}</td>
      <td><span class="badge-status status-${delivery.status.toLowerCase()}">${delivery.status}</span></td>
      <td>
        <div style="display:flex; gap: 8px;">
          <select class="form-control" style="padding: 4px 8px; font-size: 12px; height: auto;" onchange="assignDeliveryPartner('${o.id}', this.value)">
            <option value="">Assign Partner</option>
            <option value="Delhivery" ${delivery.partner === 'Delhivery' ? 'selected' : ''}>Delhivery</option>
            <option value="BlueDart" ${delivery.partner === 'BlueDart' ? 'selected' : ''}>BlueDart</option>
            <option value="EcomExpress" ${delivery.partner === 'EcomExpress' ? 'selected' : ''}>EcomExpress</option>
          </select>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function assignDeliveryPartner(orderId, partnerName) {
  if (!partnerName) return;
  const deliveryLog = JSON.parse(localStorage.getItem('shopsphere_delivery_log') || '[]');
  const index = deliveryLog.findIndex(d => String(d.orderId) === String(orderId));

  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const order = orders.find(o => String(o.id) === String(orderId)) || {};

  const entry = {
    orderId,
    partner: partnerName,
    status: order.status || 'PLACED'
  };

  if (index !== -1) {
    deliveryLog[index] = entry;
  } else {
    deliveryLog.push(entry);
  }

  localStorage.setItem('shopsphere_delivery_log', JSON.stringify(deliveryLog));
  renderDeliveryTable();
  
  logSystemNotification('Delivery Partner', 'API Webhook', `Shipment for Order #${orderId} assigned to ${partnerName}`);
}

function updateDeliveryLogStatus(orderId, status) {
  const deliveryLog = JSON.parse(localStorage.getItem('shopsphere_delivery_log') || '[]');
  const index = deliveryLog.findIndex(d => String(d.orderId) === String(orderId));
  if (index !== -1) {
    deliveryLog[index].status = status;
    localStorage.setItem('shopsphere_delivery_log', JSON.stringify(deliveryLog));
  }
}

/* ==========================================================================
   MODULE 10: Reviews Management Panel
   ========================================================================== */
function renderReviewsTable() {
  const reviews = JSON.parse(localStorage.getItem('shopsphere_reviews') || '[]');
  const tableBody = document.getElementById('reviews-table-body');
  tableBody.innerHTML = '';

  if (reviews.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">No product reviews found.</td></tr>`;
    return;
  }

  reviews.forEach((r, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: 600;">${r.user}</td>
      <td style="color: var(--color-warning); font-weight:bold;">${'★'.repeat(r.rating)}</td>
      <td style="font-style: italic; color: var(--text-secondary);">${r.comment}</td>
      <td>
        <button class="btn btn-danger" onclick="removeReview(${index})" style="padding: 5px 10px; font-size: 12px;">Remove</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function removeReview(index) {
  if (!confirm('Are you sure you want to remove this review?')) return;
  const reviews = JSON.parse(localStorage.getItem('shopsphere_reviews') || '[]');
  reviews.splice(index, 1);
  localStorage.setItem('shopsphere_reviews', JSON.stringify(reviews));
  renderReviewsTable();
}

/* ==========================================================================
   MODULE 11: System Notifications Log
   ========================================================================== */
function renderNotificationsTable() {
  const logs = JSON.parse(localStorage.getItem('shopsphere_notifications_log') || '[]');
  const tableBody = document.getElementById('notifications-table-body');
  tableBody.innerHTML = '';

  logs.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: 600;">${log.recipient}</td>
      <td><span class="badge-status status-delivered" style="background-color: var(--color-accent-bg); color: var(--text-primary);">${log.medium}</span></td>
      <td style="font-size: 13px; color: var(--text-secondary);">${log.content}</td>
      <td style="font-size: 12.5px; color: var(--text-muted);">${log.timestamp}</td>
    `;
    tableBody.appendChild(row);
  });
}

function logSystemNotification(recipient, medium, content) {
  const logs = JSON.parse(localStorage.getItem('shopsphere_notifications_log') || '[]');
  logs.unshift({
    recipient,
    medium,
    content,
    timestamp: new Date().toLocaleString()
  });
  localStorage.setItem('shopsphere_notifications_log', JSON.stringify(logs));
}

function triggerNotificationBroadcast() {
  const msg = prompt('Enter a test alert message to send to all customer accounts:');
  if (!msg) return;
  logSystemNotification('All Registered Users', 'Push & SMS Broadcast', msg);
  renderNotificationsTable();
  alert('Broadcast alert dispatched successfully.');
}

/* ==========================================================================
   MODULE 12: Analytics & Reports
   ========================================================================== */
function renderAnalyticsReport() {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const activeOrders = orders.filter(o => o.status !== 'CANCELLED');
  
  const totalAmount = activeOrders.reduce((sum, o) => {
    const cleanNum = parseFloat(String(o.total || '0').replace(/[^\d.]/g, ''));
    return sum + cleanNum;
  }, 0);

  const averageBasketValue = activeOrders.length > 0 ? (totalAmount / activeOrders.length).toFixed(0) : 0;
  
  document.getElementById('analytics-summary-text').innerHTML = `
    <strong>Accumulated Stores Revenue</strong>: ₹${totalAmount.toLocaleString()}<br>
    <strong>Fulfilled Orders Volume</strong>: ${activeOrders.length} checkouts<br>
    <strong>Average Checkout Basket Value</strong>: ₹${parseInt(averageBasketValue).toLocaleString()}<br>
    <strong>System Database Status</strong>: Syncing localstorage caches dynamically.
  `;
}

/* ==========================================================================
   MODULE 13: Settings Editor
   ========================================================================== */
function loadSettingsValues() {
  const settings = JSON.parse(localStorage.getItem('shopsphere_settings') || '{}');
  if (settings.taxRate) document.getElementById('settings-tax-rate').value = settings.taxRate;
  if (settings.shippingPrice) document.getElementById('settings-shipping-price').value = settings.shippingPrice;
  if (settings.gateway) document.getElementById('settings-gateway').value = settings.gateway;
}

function saveAdminSettings() {
  const taxRate = parseFloat(document.getElementById('settings-tax-rate').value);
  const shippingPrice = parseFloat(document.getElementById('settings-shipping-price').value);
  const gateway = document.getElementById('settings-gateway').value;

  if (isNaN(taxRate) || isNaN(shippingPrice)) {
    alert('Please enter valid numerical values for tax rates and shipping fee.');
    return;
  }

  const settings = { taxRate, shippingPrice, gateway };
  localStorage.setItem('shopsphere_settings', JSON.stringify(settings));
  alert('Global settings stored successfully.');
}
