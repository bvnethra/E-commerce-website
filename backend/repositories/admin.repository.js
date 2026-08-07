import pool from '../config/db.js';

export const adminRepository = {
  // Support Tickets
  async createTicket(userId, { subject, description, priority = 'MEDIUM' }) {
    const [result] = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, description, priority, status)
       VALUES (?, ?, ?, ?, 'OPEN')`,
      [userId, subject, description, priority]
    );
    return result.insertId;
  },

  async getTicketsByUser(userId) {
    const [rows] = await pool.query(
      `SELECT id, subject, description, status, priority, created_at as createdAt, updated_at as updatedAt
       FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async getAllTickets({ status, priority, limit = 20, offset = 0 } = {}) {
    let query = `
      SELECT t.id, t.subject, t.description, t.status, t.priority, t.created_at as createdAt, t.updated_at as updatedAt,
             u.username, u.email
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async updateTicketStatus(ticketId, status) {
    await pool.query('UPDATE support_tickets SET status = ? WHERE id = ?', [status, ticketId]);
  },

  // Saved Reports
  async saveReport({ type, parameters, data }) {
    const [result] = await pool.query(
      `INSERT INTO saved_reports (report_type, parameters, data)
       VALUES (?, ?, ?)`,
      [type, JSON.stringify(parameters), JSON.stringify(data)]
    );
    return result.insertId;
  },

  async getReports({ type, limit = 20, offset = 0 } = {}) {
    let query = 'SELECT id, report_type as type, parameters, data, created_at as createdAt FROM saved_reports';
    const params = [];

    if (type) {
      query += ' WHERE report_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      parameters: JSON.parse(r.parameters),
      data: JSON.parse(r.data),
      createdAt: r.createdAt
    }));
  },

  // Audit Logs
  async logAction({ userId = null, action, details = null, ipAddress = null }) {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address)
       VALUES (?, ?, ?, ?)`,
      [userId, action, details, ipAddress]
    );
  },

  async getLogs({ limit = 50, offset = 0 } = {}) {
    const [rows] = await pool.query(
      `SELECT a.id, a.action, a.details, a.ip_address as ipAddress, a.created_at as createdAt,
              u.username, u.email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit, 10), parseInt(offset, 10)]
    );
    return rows;
  }
};
export default adminRepository;
