import pool from '../config/db.js';

export const productRepository = {
  async getAllProducts({ categoryId, brandId, minPrice, maxPrice, search, limit = 20, offset = 0, sortBy = 'popularity' }) {
    let query = `
      SELECT p.id, p.name, p.slug, p.description, p.price, p.image_url as imageUrl,
             c.id as categoryId, c.name as categoryName, c.slug as categorySlug,
             b.id as brandId, b.name as brandName,
             COALESCE(AVG(r.rating), 0) as rating,
             COUNT(r.id) as reviewCount
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    if (brandId) {
      query += ' AND p.brand_id = ?';
      params.push(brandId);
    }
    if (minPrice !== undefined) {
      query += ' AND p.price >= ?';
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      query += ' AND p.price <= ?';
      params.push(maxPrice);
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' GROUP BY p.id';

    // Sorting
    if (sortBy === 'price_asc') {
      query += ' ORDER BY p.price ASC';
    } else if (sortBy === 'price_desc') {
      query += ' ORDER BY p.price DESC';
    } else if (sortBy === 'rating') {
      query += ' ORDER BY rating DESC';
    } else {
      query += ' ORDER BY p.id DESC'; // default / popularity
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);
    
    // Map response objects into structure expected by UI
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: parseFloat(row.price),
      imageUrl: row.imageUrl,
      category: {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug
      },
      brand: row.brandId ? {
        id: row.brandId,
        name: row.brandName
      } : null,
      rating: parseFloat(row.rating),
      reviewCount: row.reviewCount
    }));
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.description, p.price, p.image_url as imageUrl,
              c.id as categoryId, c.name as categoryName, c.slug as categorySlug,
              b.id as brandId, b.name as brandName
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: parseFloat(row.price),
      imageUrl: row.imageUrl,
      category: {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug
      },
      brand: row.brandId ? {
        id: row.brandId,
        name: row.brandName
      } : null
    };
  },

  async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.description, p.price, p.image_url as imageUrl,
              c.id as categoryId, c.name as categoryName, c.slug as categorySlug,
              b.id as brandId, b.name as brandName
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.slug = ?`,
      [slug]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: parseFloat(row.price),
      imageUrl: row.imageUrl,
      category: {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug
      },
      brand: row.brandId ? {
        id: row.brandId,
        name: row.brandName
      } : null
    };
  },

  async getCategories() {
    const [rows] = await pool.query('SELECT id, name, slug, description FROM categories');
    return rows;
  },

  async getBrands() {
    const [rows] = await pool.query('SELECT id, name, slug, description, logo_url as logoUrl FROM brands');
    return rows;
  },

  async getVariantsByProductId(productId) {
    const [rows] = await pool.query(
      'SELECT id, product_id as productId, sku, price, sku_details as skuDetails FROM product_variants WHERE product_id = ?',
      [productId]
    );
    return rows;
  },

  async getInventory(productId, variantId = null) {
    let query = 'SELECT id, product_id as productId, product_variant_id as variantId, quantity, low_stock_threshold as threshold FROM inventory WHERE product_id = ?';
    const params = [productId];

    if (variantId) {
      query += ' AND product_variant_id = ?';
      params.push(variantId);
    } else {
      query += ' AND product_variant_id IS NULL';
    }

    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  },

  async updateStock(productId, variantId = null, quantityDelta) {
    let query = 'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?';
    const params = [quantityDelta, productId];

    if (variantId) {
      query += ' AND product_variant_id = ?';
      params.push(variantId);
    } else {
      query += ' AND product_variant_id IS NULL';
    }

    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  },

  // Reviews
  async getReviews(productId) {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at as date, u.username as user
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    return rows.map(r => ({
      id: r.id,
      user: r.user,
      rating: r.rating,
      comment: r.comment,
      date: new Date(r.date).toLocaleDateString()
    }));
  },

  async checkUserBoughtProduct(userId, productId) {
    const [rows] = await pool.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'DELIVERED'`,
      [userId, productId]
    );
    return rows.length > 0;
  },

  async addReview(userId, productId, { rating, comment }) {
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment)',
      [userId, productId, rating, comment]
    );
    return result.insertId;
  }
};
export default productRepository;
