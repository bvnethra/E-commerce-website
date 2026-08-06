-- AURA E-COMMERCE SEED DATA
-- Default seeding profiles for roles, administrative accounts, brands, categories, and products

-- 1. Seed Roles
INSERT INTO roles (id, name) VALUES (1, 'ROLE_USER') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO roles (id, name) VALUES (2, 'ROLE_ADMIN') ON DUPLICATE KEY UPDATE name=name;

-- 2. Seed Admin and Customer Users
-- Default bcrypt hash for 'AdminSecretPass123!' is '$2a$10$8.tWgpyfG3Fx815858.7reX8HecV3o2rG/l4aD.y1yJc5F7r8F.oW'
-- Default bcrypt hash for 'CustomerPass123!' is '$2a$10$vNl1XGZ5yvVbY/oE.G7Fne9p8UeH87884K68xY8Z.47H2/c34tH5i'
INSERT INTO users (id, username, email, password, first_name, last_name, phone_number) 
VALUES (1, 'admin', 'admin@aura.com', '$2a$10$8.tWgpyfG3Fx815858.7reX8HecV3o2rG/l4aD.y1yJc5F7r8F.oW', 'System', 'Administrator', '+15550100')
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO users (id, username, email, password, first_name, last_name, phone_number) 
VALUES (2, 'john_doe', 'john@example.com', '$2a$10$vNl1XGZ5yvVbY/oE.G7Fne9p8UeH87884K68xY8Z.47H2/c34tH5i', 'John', 'Doe', '+15550199')
ON DUPLICATE KEY UPDATE username=username;

-- 3. Associate Users with Roles
INSERT INTO user_roles (user_id, role_id) VALUES (1, 2) ON DUPLICATE KEY UPDATE user_id=user_id; -- Admin User -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (2, 1) ON DUPLICATE KEY UPDATE user_id=user_id; -- Customer User -> ROLE_USER

-- 4. Seed Categories
INSERT INTO categories (id, name, slug, description) 
VALUES (1, 'Lighting', 'lighting', 'Task lamps, floor lamps, and ambient workspace lighting solutions.')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO categories (id, name, slug, description) 
VALUES (2, 'Decor', 'decor', 'Sculptural stone vessels, minimalist ceramics, and handcrafted room decor.')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO categories (id, name, slug, description) 
VALUES (3, 'Lifestyle', 'lifestyle', 'Luxury leather pouches, travel organizers, and premium home furniture.')
ON DUPLICATE KEY UPDATE name=name;

-- 5. Seed Brands
INSERT INTO brands (id, name, slug, description, logo_url)
VALUES (1, 'AURA Studio', 'aura-studio', 'Handcrafted lifestyle goods focusing on natural and sustainable materials.', 'assets/logo_aura.png')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO brands (id, name, slug, description, logo_url)
VALUES (2, 'Travertine Co.', 'travertine-co', 'Premium stonework sculpted from organic Italian travertine limestone.', 'assets/logo_travertine.png')
ON DUPLICATE KEY UPDATE name=name;

-- 6. Seed Products
INSERT INTO products (id, name, slug, description, price, image_url, category_id, brand_id)
VALUES (1, 'Minimalist Gooseneck Lamp', 'gooseneck-lamp', 'Constructed from premium steel with a matte powder-coat finish, this lighting essential features a curved neck and a tactile brass toggle switch. Emits a warm, diffused ambient glow that adds focus to any workspace.', 145.00, 'assets/product_lamp.png', 1, 1)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO products (id, name, slug, description, price, image_url, category_id, brand_id)
VALUES (2, 'Travertine Amber Candle', 'travertine-candle', 'Hand-poured coconut soy wax scented with earth notes of cedarwood, vetiver, and smoky amber. Housed in a substantial travertine stone vessel carved by hand. Once burned, the stone canister can be repurposed as a catch-all tray.', 64.00, 'assets/product_candle.png', 2, 2)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO products (id, name, slug, description, price, image_url, category_id, brand_id)
VALUES (3, 'Ribbed Ceramic Vase', 'ribbed-vase', 'A gorgeous off-white terracotta vase styled with clean ribbed columns. The matte finish absorbs light gently, accentuating organic shadows. Perfect for dry botanical arrangements.', 89.00, 'assets/product_vase.png', 2, 1)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO products (id, name, slug, description, price, image_url, category_id, brand_id)
VALUES (4, 'Leather Tech Pouch', 'leather-pouch', 'Meticulously crafted from full-grain vegetable tanned leather. Designed with internal mesh divisions, dynamic elastic bands, and a smooth zipper track. Comfortably accommodates chargers, cords, and travel essentials.', 110.00, 'assets/product_pouch.png', 3, 1)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO products (id, name, slug, description, price, image_url, category_id, brand_id)
VALUES (5, 'Bouclé Accent Armchair', 'boucle-chair', 'A statement piece combining architectural geometry and organic comfort. Wrapped in heavy cream bouclé fabric, this armchair features a low profile and plush padding, bringing luxury relaxation to your reading corner.', 850.00, 'assets/hero_banner.png', 3, 1)
ON DUPLICATE KEY UPDATE name=name;

-- 7. Seed Product Variants
INSERT INTO product_variants (id, product_id, sku, price, sku_details)
VALUES (1, 1, 'LMP-GOOSE-BLK', 145.00, 'Color: Matte Black, Finish: Powder Coat')
ON DUPLICATE KEY UPDATE sku=sku;

INSERT INTO product_variants (id, product_id, sku, price, sku_details)
VALUES (2, 2, 'CND-TRAV-AMB', 64.00, 'Material: Amber Stone, Scent: Amber & Cedar')
ON DUPLICATE KEY UPDATE sku=sku;

INSERT INTO product_variants (id, product_id, sku, price, sku_details)
VALUES (3, 4, 'PCH-LTHR-TAN', 110.00, 'Color: Cognac Tan, Material: Full-Grain Leather')
ON DUPLICATE KEY UPDATE sku=sku;

-- 8. Seed Inventory
INSERT INTO inventory (id, product_id, product_variant_id, quantity, low_stock_threshold)
VALUES (1, 1, 1, 45, 10)
ON DUPLICATE KEY UPDATE product_id=product_id;

INSERT INTO inventory (id, product_id, product_variant_id, quantity, low_stock_threshold)
VALUES (2, 2, 2, 12, 5)
ON DUPLICATE KEY UPDATE product_id=product_id;

INSERT INTO inventory (id, product_id, product_variant_id, quantity, low_stock_threshold)
VALUES (3, 3, NULL, 60, 15)
ON DUPLICATE KEY UPDATE product_id=product_id;

INSERT INTO inventory (id, product_id, product_variant_id, quantity, low_stock_threshold)
VALUES (4, 4, 3, 35, 10)
ON DUPLICATE KEY UPDATE product_id=product_id;

INSERT INTO inventory (id, product_id, product_variant_id, quantity, low_stock_threshold)
VALUES (5, 5, NULL, 4, 2)
ON DUPLICATE KEY UPDATE product_id=product_id;

-- 9. Seed Coupons
INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase_amount, is_active)
VALUES (1, 'WELCOME10', 'PERCENTAGE', 10.00, 50.00, 1)
ON DUPLICATE KEY UPDATE code=code;

INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase_amount, is_active)
VALUES (2, 'AURASAVE20', 'FIXED_AMOUNT', 20.00, 100.00, 1)
ON DUPLICATE KEY UPDATE code=code;

-- 10. Seed Banners
INSERT INTO banners (id, title, image_url, link_url, position, is_active)
VALUES (1, 'New Season Collection 2026', 'assets/hero_banner.png', '#shop', 1, 1)
ON DUPLICATE KEY UPDATE title=title;
