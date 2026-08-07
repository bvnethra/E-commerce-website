import pool from '../config/db.js';

export const userRepository = {
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, username, email, first_name as firstName, last_name as lastName, phone_number as phoneNumber, created_at as createdAt 
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async create({ username, email, password, firstName = null, lastName = null, phoneNumber = null }) {
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, phone_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, password, firstName, lastName, phoneNumber]
    );
    return result.insertId;
  },

  async update(id, { firstName, lastName, phoneNumber }) {
    await pool.query(
      `UPDATE users SET first_name = ?, last_name = ?, phone_number = ? WHERE id = ?`,
      [firstName, lastName, phoneNumber, id]
    );
    return this.findById(id);
  },

  async assignRole(userId, roleId) {
    await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
  },

  async getRoles(userId) {
    const [rows] = await pool.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows.map(row => row.name);
  },

  // Addresses
  async getAddresses(userId) {
    const [rows] = await pool.query(
      `SELECT id, address_line1 as addressLine1, address_line2 as addressLine2, city, state, zip_code as zipCode, country, is_default_shipping as isDefaultShipping, is_default_billing as isDefaultBilling
       FROM addresses WHERE user_id = ?`,
      [userId]
    );
    return rows;
  },

  async addAddress(userId, { addressLine1, addressLine2, city, state, zipCode, country, isDefaultShipping = false, isDefaultBilling = false }) {
    const [result] = await pool.query(
      `INSERT INTO addresses (user_id, address_line1, address_line2, city, state, zip_code, country, is_default_shipping, is_default_billing)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, addressLine1, addressLine2, city, state, zipCode, country, isDefaultShipping, isDefaultBilling]
    );
    return result.insertId;
  },

  async deleteAddress(id, userId) {
    const [result] = await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  },

  // Wishlist
  async getWishlist(userId) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.image_url as imageUrl
       FROM products p
       JOIN wishlist w ON p.id = w.product_id
       WHERE w.user_id = ?`,
      [userId]
    );
    return rows;
  },

  async addToWishlist(userId, productId) {
    await pool.query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
  },

  async removeFromWishlist(userId, productId) {
    await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
  },

  // Saved Cards
  async getCards(userId) {
    const [rows] = await pool.query(
      `SELECT id, card_brand as cardBrand, last_four as lastFour, expiry_month as expiryMonth, expiry_year as expiryYear 
       FROM saved_cards WHERE user_id = ?`,
      [userId]
    );
    return rows;
  },

  async addCard(userId, { cardToken, cardBrand, lastFour, expiryMonth, expiryYear }) {
    const [result] = await pool.query(
      `INSERT INTO saved_cards (user_id, card_token, card_brand, last_four, expiry_month, expiry_year)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, cardToken, cardBrand, lastFour, expiryMonth, expiryYear]
    );
    return result.insertId;
  }
};
export default userRepository;
