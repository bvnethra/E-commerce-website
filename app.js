document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     Theme Toggle (Light/Dark Mode)
     ========================================================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  // Initialize theme from localStorage or system preferences
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
  } else if (systemPrefersDark) {
    htmlElement.setAttribute('data-theme', 'dark');
  } else {
    htmlElement.setAttribute('data-theme', 'light');
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Add temporary rotation animation to the button
    themeToggleBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      themeToggleBtn.style.transform = 'none';
    }, 300);
  });


  /* ==========================================================================
     Location Selector Dropdown
     ========================================================================== */
  const locationSelector = document.getElementById('location-select');
  const locationBtn = locationSelector.querySelector('.location-value-btn');
  const locationDropdown = document.getElementById('location-dropdown');
  const currentLocationLabel = document.getElementById('current-location');
  const dropdownItems = locationDropdown.querySelectorAll('li');

  // Toggle Dropdown Display
  locationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = locationBtn.getAttribute('aria-expanded') === 'true';
    locationBtn.setAttribute('aria-expanded', !isExpanded);
    locationDropdown.classList.toggle('show');
  });

  // Handle Location Selection
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedValue = item.getAttribute('data-value');
      
      // Update Button Value
      currentLocationLabel.textContent = selectedValue;
      
      // Update Active/Selected States
      dropdownItems.forEach(li => {
        li.setAttribute('aria-selected', 'false');
      });
      item.setAttribute('aria-selected', 'true');
      
      // Close Dropdown
      closeDropdown();
    });
  });

  // Helper: Close location dropdown
  function closeDropdown() {
    locationBtn.setAttribute('aria-expanded', 'false');
    locationDropdown.classList.remove('show');
  }

  // Close when clicking anywhere else
  document.addEventListener('click', (e) => {
    if (!locationSelector.contains(e.target)) {
      closeDropdown();
    }
  });


  /* ==========================================================================
     Dynamic Shopping Cart Counters & Feedback
     ========================================================================== */
  const cartBadge = document.getElementById('cart-badge');
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  let cartCount = parseInt(cartBadge.textContent) || 0;

  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Prevent rapid double clicking during animation
      if (button.classList.contains('added')) return;
      
      // Increment Cart State
      cartCount++;
      cartBadge.textContent = cartCount;
      
      // Trigger Badge Pop Animation
      cartBadge.style.animation = 'none';
      // Force Reflow
      void cartBadge.offsetWidth;
      cartBadge.style.animation = 'popBadge 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards';

      // Visual Feedback on Button
      button.classList.add('added');
      const originalIcon = button.innerHTML;
      
      // Change to Checkmark icon
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;

      // Reset Button State after Delay
      setTimeout(() => {
        button.classList.remove('added');
        button.innerHTML = originalIcon;
      }, 1500);
    });
  });


  /* ==========================================================================
     Wishlist Hearts Toggling
     ========================================================================== */
  const wishlistButtons = document.querySelectorAll('.wishlist-btn');

  wishlistButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = button.classList.toggle('active');
      
      // Micro-animation pop effect
      button.style.transform = 'scale(0.8)';
      setTimeout(() => {
        button.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
      }, 100);
      setTimeout(() => {
        button.style.transform = 'none';
      }, 250);
      
      // Trigger a visual confirmation alert/toast in console
      const productName = button.closest('.product-card').querySelector('.product-name').textContent;
      console.log(`${productName} ${isActive ? 'added to' : 'removed from'} wishlist.`);
    });
  });


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
      document.body.style.overflow = 'hidden'; // Lock background scroll
    };

    const closeMenu = () => {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = 'auto'; // Release background scroll
    };

    menuToggle.addEventListener('click', openMenu);
    sidebarClose.addEventListener('click', closeMenu);
    sidebarOverlay.addEventListener('click', closeMenu);
  }


  /* ==========================================================================
     Search Bar Matching (Dynamic Filtering)
     ========================================================================== */
  const searchInput = document.getElementById('search-input');
  const productCards = document.querySelectorAll('.products-grid .product-card');

  // Create a placeholder block for "No results found" dynamically
  const productsGrid = document.querySelector('.products-grid');
  const noResultsMsg = document.createElement('div');
  noResultsMsg.className = 'no-results-message';
  noResultsMsg.style.display = 'none';
  noResultsMsg.style.gridColumn = '1 / -1';
  noResultsMsg.style.textAlign = 'center';
  noResultsMsg.style.padding = '40px 20px';
  noResultsMsg.style.color = 'var(--text-muted)';
  noResultsMsg.style.fontWeight = '600';
  noResultsMsg.style.fontSize = '1.1rem';
  noResultsMsg.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;">
      <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <p>No products match your search. Try another query.</p>
  `;
  productsGrid.appendChild(noResultsMsg);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    let matchCount = 0;

    productCards.forEach(card => {
      const name = card.querySelector('.product-name').textContent.toLowerCase();
      const cat = card.querySelector('.product-cat').textContent.toLowerCase();
      
      if (name.includes(query) || cat.includes(query)) {
        card.style.display = 'flex';
        card.style.opacity = '1';
        matchCount++;
      } else {
        card.style.display = 'none';
        card.style.opacity = '0';
      }
    });

    if (matchCount === 0 && query !== '') {
      noResultsMsg.style.display = 'block';
    } else {
      noResultsMsg.style.display = 'none';
    }
  });


  /* ==========================================================================
     Active Navigation Links Highlight Toggling
     ========================================================================== */
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Allow link functionality but visually toggle active state
      e.preventDefault();
      
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Close mobile menu sidebar if navigating
      if (sidebar.classList.contains('active')) {
        const sidebarCloseBtn = document.getElementById('sidebar-close');
        sidebarCloseBtn.click();
      }
    });
  });

});
