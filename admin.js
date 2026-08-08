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

  if (!localStorage.getItem('aura_registered_users')) {
    const defaultUsers = [
      { id: 'usr_1001', name: 'Admin Manager', email: 'admin@shopsphere.com', phone: '9988776655', role: 'ADMIN' },
      { id: 'usr_1002', name: 'John Doe', email: 'john@example.com', phone: '9876543210', role: 'CUSTOMER' }
    ];
    localStorage.setItem('aura_registered_users', JSON.stringify(defaultUsers));
  }

  // Sync active storefront user to user registry on initialization
  try {
    const active = JSON.parse(localStorage.getItem('aura_user') || 'null');
    if (active) {
      const registeredUsers = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
      const exists = registeredUsers.some(u => u.email.toLowerCase() === active.email.toLowerCase());
      if (!exists) {
        registeredUsers.push(active);
        localStorage.setItem('aura_registered_users', JSON.stringify(registeredUsers));
      }
    }
  } catch (e) {}

  // 6. Categories Database initialization fallback
  const CURRENT_DB_VERSION = 'v5';
  const storedCats = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
  const currentDbVersion = localStorage.getItem('shopsphere_db_version');
  if (storedCats.length < 27 || currentDbVersion !== CURRENT_DB_VERSION || storedCats[0]?.img !== 'assets/images/cat_men.png') {
    const defaultCategories = [
      { name: 'Men', subtitle: 'T-Shirts, Jeans & Jackets', bg: '#e0f2fe', img: 'assets/images/cat_men.png' },
      { name: 'Women', subtitle: 'Dresses, Tops & Jeans', bg: '#fce7f3', img: 'assets/images/cat_women.png' },
      { name: 'Activewear', subtitle: 'Gym Shorts & Leggings', bg: '#ccfbf1', img: 'assets/images/cat_activewear.png' },
      { name: 'Sleepwear', subtitle: 'Pajama Sets & Loungewear', bg: '#fae8ff', img: 'assets/images/cat_sleepwear.svg' },
      { name: 'Shoes', subtitle: 'Sneakers, Boots & Sandals', bg: '#fef9c3', img: 'assets/images/cat_shoes.png' },
      { name: 'Bags & Luggage', subtitle: 'Backpacks & Suitcases', bg: '#e2e8f0', img: 'assets/images/prod_backpack.png' },
      { name: 'Jewelry', subtitle: 'Necklaces, Rings & Earrings', bg: '#ffe4e6', img: 'assets/images/cat_jewelry.svg' },
      { name: 'Accessories', subtitle: 'Smartwatches, Sunglasses & Wallets', bg: '#fef9c3', img: 'assets/images/cat_accessories.png' },
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
    ];
    localStorage.setItem('shopsphere_categories', JSON.stringify(defaultCategories));
    localStorage.setItem('shopsphere_db_version', CURRENT_DB_VERSION);
  }

  // 7. Products Database initialization fallback
  const CURRENT_DB_VERSION_PROD = 'v8';
  let storedProds = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  if (storedProds.length < 108 || currentDbVersion !== CURRENT_DB_VERSION_PROD || !storedProds[0]?.name.includes('Shirt')) {
    const defaultProducts = [];
    const categories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
    
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
      'Men Shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80',
      'Men T-Shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
      'Men Pants': 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=300&q=80',
      'Men Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=300&q=80',
      'Women Dress': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
      'Women Top': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80',
      'Women Skirt': 'https://images.unsplash.com/photo-1583496661160-fb488b2c1a82?auto=format&fit=crop&w=300&q=80',
      'Women Jeans': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=300&q=80',
      'Activewear Gym Shorts': 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=300&q=80',
      'Activewear Sports Bra': 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=300&q=80',
      'Activewear Leggings': 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=300&q=80',
      'Activewear Tracksuit': 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=300&q=80',
      'Sleepwear Pajama Set': 'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&w=300&q=80',
      'Sleepwear Nightgown': 'https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?auto=format&fit=crop&w=300&q=80',
      'Sleepwear Robe': 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80',
      'Sleepwear Sweatpants': 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=300&q=80',
      'Shoes Sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
      'Shoes Boots': 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=300&q=80',
      'Shoes Sandals': 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=300&q=80',
      'Shoes Formal Shoes': 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=300&q=80',
      'Bags & Luggage Backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80',
      'Bags & Luggage Suitcase': 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=300&q=80',
      'Bags & Luggage Handbag': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80',
      'Bags & Luggage Laptop Bag': 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=300&q=80',
      'Jewelry Necklace': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80',
      'Jewelry Ring': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=300&q=80',
      'Jewelry Earrings': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80',
      'Jewelry Bracelet': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=300&q=80',
      'Accessories Sunglasses': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=300&q=80',
      'Accessories Wallet': 'https://images.unsplash.com/photo-1627124118303-622c97be5e31?auto=format&fit=crop&w=300&q=80',
      'Accessories Belt': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80',
      'Accessories Smartwatch': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=300&q=80',
      'Kids & Baby Onesie': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80',
      'Kids & Baby Kids T-Shirt': 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=300&q=80',
      'Kids & Baby Kids Shorts': 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=300&q=80',
      'Kids & Baby Baby Blanket': 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
      'Electronics Smartphone': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80',
      'Electronics Laptop': 'https://images.unsplash.com/photo-1496181130204-7552cc14ac1a?auto=format&fit=crop&w=300&q=80',
      'Electronics Power Bank': 'https://images.unsplash.com/photo-1609592424109-dd2556b68b8e?auto=format&fit=crop&w=300&q=80',
      'Electronics Tablet': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=300&q=80',
      'Audio Headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
      'Audio Earbuds': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80',
      'Audio Bluetooth Speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=300&q=80',
      'Audio Soundbar': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=80',
      'Gaming Gaming Console': 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=300&q=80',
      'Gaming Game Controller': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80',
      'Gaming Gaming Headset': 'https://images.unsplash.com/photo-1574744577884-64260b433a78?auto=format&fit=crop&w=300&q=80',
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
      'Bedding & Bath Bed Sheet': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80',
      'Bedding & Bath Comforter': 'https://images.unsplash.com/photo-150569339888-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
      'Bedding & Bath Bath Towel': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=300&q=80',
      'Bedding & Bath Pillow': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=300&q=80',
      'Kitchen & Dining Frying Pan': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80',
      'Kitchen & Dining Air Fryer': 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=300&q=80',
      'Kitchen & Dining Water Bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=80',
      'Kitchen & Dining Dinnerware Set': 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=300&q=80',
      'Lighting Desk Lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80',
      'Lighting Ceiling Light': 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=300&q=80',
      'Lighting Floor Lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80',
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
      'Sports & Fitness Resistance Band': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80',
      'Sports & Fitness Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80',
      'Outdoor & Camping Camping Tent': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80',
      'Outdoor & Camping Sleeping Bag': 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=300&q=80',
      'Outdoor & Camping Hiking Backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80',
      'Outdoor & Camping Headlamp': 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=300&q=80',
      'Office & Stationery Notebook': 'https://images.unsplash.com/photo-1531346878377-a5c20888254f?auto=format&fit=crop&w=300&q=80',
      'Office & Stationery Pen Set': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
      'Office & Stationery Desk Organizer': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80',
      'Office & Stationery Planner': 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80',
      'Toys & Games Action Figure': 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?auto=format&fit=crop&w=300&q=80',
      'Toys & Games Board Game': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=300&q=80',
      'Toys & Games Building Blocks': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=300&q=80',
      'Toys & Games Puzzle': 'https://images.unsplash.com/photo-1585250000033-03333e577078?auto=format&fit=crop&w=300&q=80',
      'Pet Supplies Dog Food': 'https://images.unsplash.com/photo-1589721062801-44026de174e5?auto=format&fit=crop&w=300&q=80',
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
        defaultProducts.push({
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
          sku: `SKU-${cat.name.substring(0,3).toUpperCase()}-${globalId * 111}`,
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
    localStorage.setItem('shopsphere_products', JSON.stringify(defaultProducts));
    localStorage.setItem('shopsphere_db_version', CURRENT_DB_VERSION);
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
      populateInventoryCategorySelectDropdown();
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
let currentProductCategoryFilter = 'ALL';

function renderProductsTable() {
  let products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  const tableBody = document.getElementById('products-table-body');
  tableBody.innerHTML = '';

  if (currentProductCategoryFilter !== 'ALL') {
    products = products.filter(p => String(p.cat).toUpperCase() === currentProductCategoryFilter.toUpperCase());
  }

  if (products.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">No catalog products found for this category. Add a new one to start!</td></tr>`;
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

function filterProductsByCategory(val) {
  currentProductCategoryFilter = val;
  renderProductsTable();
}

function populateCategorySelectDropdown() {
  const categories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
  
  // 1. Form dropdown
  const select = document.getElementById('prod-form-cat');
  if (select) {
    select.innerHTML = '';
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name;
      select.appendChild(opt);
    });
  }

  // 2. Filter dropdown
  const filterSelect = document.getElementById('admin-product-category-filter');
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="ALL">All Categories</option>';
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name;
      if (c.name.toUpperCase() === currentProductCategoryFilter.toUpperCase()) {
        opt.selected = true;
      }
      filterSelect.appendChild(opt);
    });
  }
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
    const addrStr = typeof order.address === 'object' 
      ? `${order.address.line1 || ''}, ${order.address.city || ''}` 
      : (order.address || 'N/A');
    const itemsSummary = (order.itemsDetail || []).map(it => `${it.name} (x${it.quantity})`).join(', ') || `${order.items || 1} items`;

    let statusActionHtml = '';
    const statusUpper = (order.status || 'PLACED').toUpperCase();
    if (statusUpper === 'PROCESSING' || statusUpper === 'PLACED') {
      statusActionHtml = `
        <div style="display:flex; gap: 8px;">
          <button class="btn" style="padding: 5px 10px; font-size: 11.5px; background-color: var(--color-success); color: white;" onclick="approveOrder('${order.id}', true)">Accept</button>
          <button class="btn" style="padding: 5px 10px; font-size: 11.5px; background-color: var(--color-danger); color: white;" onclick="approveOrder('${order.id}', false)">Reject</button>
        </div>
      `;
    } else {
      statusActionHtml = `
        <select class="form-control" style="padding: 4px 8px; font-size: 12px; height: auto;" onchange="updateOrderStatus('${order.id}', this.value)">
          <option value="PLACED" ${order.status === 'PLACED' ? 'selected' : ''}>Placed</option>
          <option value="PACKED" ${order.status === 'PACKED' ? 'selected' : ''}>Packed</option>
          <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
          <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
          <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
        </select>
      `;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 13px; font-weight: 600;">#${order.id}</td>
      <td>${order.customerName || 'Guest User'}</td>
      <td style="font-size: 13px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsSummary}">${itemsSummary}</td>
      <td style="font-weight: 600;">${order.total}</td>
      <td>${order.paymentMethod || 'COD'}</td>
      <td style="font-size: 12.5px; color: var(--text-secondary); max-width: 180px;">${addrStr}</td>
      <td><span class="badge-status status-${(order.status || 'PLACED').toLowerCase()}">${order.status || 'PLACED'}</span></td>
      <td>${statusActionHtml}</td>
    `;
    tableBody.appendChild(row);
  });
}

function approveOrder(orderId, isAccepted) {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const index = orders.findIndex(o => String(o.id) === String(orderId));
  if (index !== -1) {
    const newStatus = isAccepted ? 'PACKED' : 'CANCELLED';
    orders[index].status = newStatus;
    orders[index].statusClass = isAccepted ? 'packed' : 'cancelled';
    localStorage.setItem('shopsphere_orders', JSON.stringify(orders));
    
    // Log dynamic status update to delivery logs automatically
    updateDeliveryLogStatus(orderId, newStatus);
    
    // Log standard notification triggers
    logSystemNotification('Customer', 'SMS & Email', `Order #${orderId} has been ${isAccepted ? 'Accepted & Packed' : 'Rejected & Cancelled'} by administrator.`);
    
    renderOrdersTable();
    renderKPIs();
  }
}

function updateOrderStatus(orderId, newStatus) {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const index = orders.findIndex(o => String(o.id) === String(orderId));
  if (index !== -1) {
    orders[index].status = newStatus;
    orders[index].statusClass = newStatus.toLowerCase();
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
    let deleteActionHtml = '';
    if (u.role === 'ADMIN') {
      deleteActionHtml = `<span style="font-size: 12.5px; color: var(--text-secondary); font-style: italic;">Protected</span>`;
    } else {
      deleteActionHtml = `<button class="btn btn-danger" style="padding: 5px 10px; font-size: 11.5px;" onclick="deleteRegisteredUser('${u.id}')">Delete</button>`;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 13px;">${u.id}</td>
      <td style="font-weight: 600;">${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone || 'N/A'}</td>
      <td><span style="font-weight: 700; color: ${u.role === 'ADMIN' ? 'var(--color-success)' : 'inherit'}">${u.role || 'CUSTOMER'}</span></td>
      <td style="text-align: right;">${deleteActionHtml}</td>
    `;
    tableBody.appendChild(row);
  });
}

function deleteRegisteredUser(userId) {
  if (!confirm('Are you sure you want to delete this customer account?')) return;
  let users = JSON.parse(localStorage.getItem('aura_registered_users') || '[]');
  users = users.filter(u => String(u.id) !== String(userId));
  localStorage.setItem('aura_registered_users', JSON.stringify(users));

  // Clear storefront active session if this was the active customer
  try {
    const active = JSON.parse(localStorage.getItem('aura_user') || 'null');
    if (active && String(active.id) === String(userId)) {
      localStorage.removeItem('aura_user');
      localStorage.removeItem('aura_jwt_token');
    }
  } catch (e) {}

  renderUsersTable();
  renderKPIs();
}

/* ==========================================================================
   MODULE 6: Inventory Management
   ========================================================================== */
const AdminApiService = {
  baseUrl: 'http://localhost:8080',
  isLive: false,

  async init() {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (res.ok) {
        const health = await res.json();
        if (health.status === 'UP') {
          this.isLive = true;
          console.log('Admin connected to live backend.');
        }
      }
    } catch (e) {
      this.isLive = false;
    }
  },

  async syncProducts() {
    if (!this.isLive) return;
    try {
      const res = await fetch(`${this.baseUrl}/api/products?limit=100`);
      if (res.ok) {
        const backendProds = await res.json();
        const localProds = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
        
        const mergedProds = backendProds.map(bp => {
          const lp = localProds.find(p => p.id === bp.id);
          const stock = lp ? lp.stockCount : 15;
          return {
            id: bp.id,
            name: bp.name,
            cat: bp.category ? bp.category.name : (lp ? lp.cat : 'Accessories'),
            brand: bp.brand ? bp.brand.name : (lp ? lp.brand : 'HypeBrand'),
            price: `₹${parseFloat(bp.price).toLocaleString('en-IN')}`,
            originalPrice: `₹${Math.round(parseFloat(bp.price) * 1.5).toLocaleString('en-IN')}`,
            numericPrice: parseFloat(bp.price),
            discount: 33,
            badge: '-33%',
            rating: bp.rating || 4.2,
            reviewCount: bp.reviewCount || 15,
            inStock: stock > 0,
            stockCount: stock,
            sku: bp.sku || `SKU-${bp.id * 123}`,
            deliveryBadge: 'Express Shipping in 2 Days',
            warranty: '1 Year Brand Warranty',
            returnPolicy: '30 Days Money Back Guarantee',
            sellerInfo: 'Hype Direct Official Store',
            shortDesc: bp.description || 'Premium build quality.',
            description: bp.description || 'Premium quality.',
            img: bp.imageUrl || 'assets/images/cat_accessories.png',
            images: [bp.imageUrl || 'assets/images/cat_accessories.png']
          };
        });

        localStorage.setItem('shopsphere_products', JSON.stringify(mergedProds));
      }
    } catch (err) {
      console.error('Failed to sync products with backend database', err);
    }
  }
};

function populateInventoryCategorySelectDropdown() {
  const categories = JSON.parse(localStorage.getItem('shopsphere_categories') || '[]');
  const select = document.getElementById('inventory-category-select');
  if (select) {
    const currentVal = select.value;
    select.innerHTML = '<option value="ALL">All Categories</option>';
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.innerText = c.name;
      if (c.name === currentVal) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }
}

async function renderInventoryTable() {
  await AdminApiService.init();
  if (AdminApiService.isLive) {
    await AdminApiService.syncProducts();
  }
  const products = JSON.parse(localStorage.getItem('shopsphere_products') || '[]');
  const tableBody = document.getElementById('inventory-table-body');
  tableBody.innerHTML = '';

  const filterSelect = document.getElementById('inventory-category-select');
  const selectedCategory = filterSelect ? filterSelect.value : 'ALL';

  products.forEach(p => {
    if (selectedCategory !== 'ALL' && p.cat !== selectedCategory) {
      return;
    }

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
    const defaultStatus = o.paymentMethod === 'COD' ? 'Pending (COD)' : 'Verified';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 13px; font-weight: 600;">#${o.id}</td>
      <td style="font-weight: 600;">${o.paymentMethod || 'COD'}</td>
      <td style="font-weight: bold;">${o.total}</td>
      <td><span class="badge-status status-delivered">${defaultStatus}</span></td>
      <td>
        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="openPaymentDetailsModal('${o.id}')">Verify Details</button>
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

/* ==========================================================================
   Payment Details Modal Managers
   ========================================================================== */
function openPaymentDetailsModal(orderId) {
  const orders = JSON.parse(localStorage.getItem('shopsphere_orders') || '[]');
  const o = orders.find(ord => String(ord.id) === String(orderId));
  if (!o) return;

  const details = o.itemsDetail || [
    { id: 1, name: 'Noise Ultra 2 Max', price: o.total, img: 'assets/images/prod_watch.png', quantity: o.items || 1 }
  ];

  const itemsHtml = details.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border-color); padding: 8px 0;">
      <span style="font-size: 13px; font-weight:600; color:var(--text-primary);">${item.name} (x${item.quantity})</span>
      <span style="font-size: 13px; font-weight:bold; color:var(--text-primary);">${item.price}</span>
    </div>
  `).join('');

  const dateStr = o.date || new Date().toLocaleDateString('en-IN');
  const timeStr = o.time || '10:45 AM';

  document.getElementById('payment-modal-body').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
      <div>
        <span style="font-size: 11px; color: var(--text-secondary); font-weight:bold; text-transform:uppercase; letter-spacing:0.3px;">Customer Name</span>
        <div style="font-size: 14.5px; font-weight:600; color:var(--text-primary); margin-top:2px;">${o.customerName || 'Guest User'}</div>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div>
          <span style="font-size: 11px; color: var(--text-secondary); font-weight:bold; text-transform:uppercase; letter-spacing:0.3px;">Date of Payment</span>
          <div style="font-size: 14px; font-weight:600; color:var(--text-primary); margin-top:2px;">${dateStr}</div>
        </div>
        <div>
          <span style="font-size: 11px; color: var(--text-secondary); font-weight:bold; text-transform:uppercase; letter-spacing:0.3px;">Time of Payment</span>
          <div style="font-size: 14px; font-weight:600; color:var(--text-primary); margin-top:2px;">${timeStr}</div>
        </div>
      </div>
      <div>
        <span style="font-size: 11px; color: var(--text-secondary); font-weight:bold; text-transform:uppercase; letter-spacing:0.3px;">Method of Payment</span>
        <div style="font-size: 14px; font-weight:600; color:var(--text-primary); margin-top:2px;">${o.paymentMethod || 'COD'}</div>
      </div>
      <div style="margin-top: 8px; border-top:1px solid var(--border-color); padding-top:10px;">
        <span style="font-size: 11px; color: var(--text-secondary); font-weight:bold; text-transform:uppercase; letter-spacing:0.3px;">Items Ordered</span>
        <div style="margin-top: 6px; max-height:160px; overflow-y:auto; padding-right:4px;">
          ${itemsHtml}
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; font-size:14.5px; font-weight:700; border-top:1px solid var(--border-color); padding-top:10px;">
        <span>Total Transaction Amount:</span>
        <span style="color:var(--color-success);">${o.total}</span>
      </div>
    </div>
  `;

  document.getElementById('payment-modal').style.display = 'flex';
}

function closePaymentModal() {
  document.getElementById('payment-modal').style.display = 'none';
}
