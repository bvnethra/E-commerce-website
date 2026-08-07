import pool from '../config/db.js';
import adminRepository from '../repositories/admin.repository.js';
import productRepository from '../repositories/product.repository.js';
import orderRepository from '../repositories/order.repository.js';
import { ApiError } from '../middlewares/error.middleware.js';

export const adminController = {
  // Main admin dashboard KPI metrics (aligned with API specs)
  async getDashboardMetrics(req, res, next) {
    try {
      // 1. Total revenue (completed payments sum)
      const [revRows] = await pool.query("SELECT SUM(amount) as total FROM payments WHERE status = 'COMPLETED'");
      const totalRevenue = parseFloat(revRows[0].total || 0);

      // 2. Active orders count
      const [ordRows] = await pool.query("SELECT COUNT(id) as count FROM orders WHERE status != 'CANCELLED'");
      const ordersCount = ordRows[0].count;

      // 3. Active users count
      const [usrRows] = await pool.query("SELECT COUNT(id) as count FROM users");
      const activeUsers = usrRows[0].count;

      // 4. Low stock items
      const [stockRows] = await pool.query("SELECT COUNT(id) as count FROM inventory WHERE quantity <= low_stock_threshold");
      const lowStockCount = stockRows[0].count;

      // Mock monthly sales array
      const monthlySales = [12000, 15000, 18000, 14000, 22000, 26000];

      res.status(200).json({
        totalRevenue,
        ordersCount,
        activeUsers,
        lowStockCount,
        monthlySales
      });
    } catch (error) {
      next(error);
    }
  },

  // Audit logs list
  async getAuditLogs(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const logs = await adminRepository.getLogs({ limit, offset });
      res.status(200).json({
        status: 'success',
        data: logs
      });
    } catch (error) {
      next(error);
    }
  },

  // Support Tickets
  async createSupportTicket(req, res, next) {
    try {
      const { subject, description, priority } = req.body;
      if (!subject || !description) {
        return next(new ApiError(400, 'Subject and description are required'));
      }
      const ticketId = await adminRepository.createTicket(req.user.id, { subject, description, priority });
      res.status(201).json({
        status: 'success',
        message: 'Support ticket submitted successfully',
        data: { ticketId }
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserTickets(req, res, next) {
    try {
      const tickets = await adminRepository.getTicketsByUser(req.user.id);
      res.status(200).json({
        status: 'success',
        data: tickets
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllSupportTickets(req, res, next) {
    try {
      const { status, priority, limit, offset } = req.query;
      const tickets = await adminRepository.getAllTickets({ status, priority, limit, offset });
      res.status(200).json({
        status: 'success',
        data: tickets
      });
    } catch (error) {
      next(error);
    }
  },

  async updateTicketStatus(req, res, next) {
    try {
      const ticketId = req.params.id;
      const { status } = req.body;
      if (!status) {
        return next(new ApiError(400, 'Status is required'));
      }
      await adminRepository.updateTicketStatus(ticketId, status);
      res.status(200).json({
        status: 'success',
        message: 'Ticket status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Analytics & Reports Generation
  async generateAnalyticsReport(req, res, next) {
    try {
      const { type } = req.body; // 'SALES', 'INVENTORY', 'CUSTOMER'
      if (!type) {
        return next(new ApiError(400, 'Report type is required'));
      }

      let reportData = {};
      if (type === 'SALES') {
        const [sales] = await pool.query(
          `SELECT DATE(order_date) as date, SUM(total_amount) as totalSales, COUNT(id) as orderCount 
           FROM orders GROUP BY DATE(order_date) ORDER BY date DESC LIMIT 30`
        );
        reportData = { sales };
      } else if (type === 'INVENTORY') {
        const [inventoryStatus] = await pool.query(
          `SELECT p.name, i.quantity, i.low_stock_threshold as threshold,
                  CASE WHEN i.quantity <= i.low_stock_threshold THEN 'LOW_STOCK' ELSE 'IN_STOCK' END as status
           FROM inventory i JOIN products p ON i.product_id = p.id`
        );
        reportData = { inventoryStatus };
      } else {
        const [customerGrowth] = await pool.query(
          `SELECT DATE(created_at) as joinDate, COUNT(id) as count 
           FROM users GROUP BY DATE(created_at) ORDER BY joinDate DESC LIMIT 30`
        );
        reportData = { customerGrowth };
      }

      const reportId = await adminRepository.saveReport({
        type,
        parameters: req.body,
        data: reportData
      });

      res.status(201).json({
        status: 'success',
        message: `${type} report generated successfully`,
        data: { reportId, type, data: reportData }
      });
    } catch (error) {
      next(error);
    }
  },

  async getReportsList(req, res, next) {
    try {
      const { type, limit, offset } = req.query;
      const reports = await adminRepository.getReports({ type, limit, offset });
      res.status(200).json({
        status: 'success',
        data: reports
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin Catalog CRUD Management
  async createProduct(req, res, next) {
    try {
      const { name, slug, description, price, categoryId, brandId, quantity } = req.body;
      if (!name || !slug || !price) {
        return next(new ApiError(400, 'Product name, slug, and price are required'));
      }

      const [result] = await pool.query(
        `INSERT INTO products (name, slug, description, price, category_id, brand_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, slug, description, price, categoryId, brandId]
      );

      const productId = result.insertId;

      // Initialize default inventory stock
      await pool.query(
        `INSERT INTO inventory (product_id, quantity, low_stock_threshold)
         VALUES (?, ?, 10)`,
        [productId, quantity || 0]
      );

      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: { productId }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const productId = req.params.id;
      const { name, description, price, categoryId, brandId } = req.body;

      await pool.query(
        `UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, brand_id = ?
         WHERE id = ?`,
        [name, description, price, categoryId, brandId, productId]
      );

      res.status(200).json({
        status: 'success',
        message: 'Product updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async updateInventory(req, res, next) {
    try {
      const { productId, variantId, quantity } = req.body;
      if (!productId || quantity === undefined) {
        return next(new ApiError(400, 'ProductId and stock quantity are required'));
      }

      let query = 'UPDATE inventory SET quantity = ? WHERE product_id = ?';
      const params = [quantity, productId];

      if (variantId) {
        query += ' AND product_variant_id = ?';
        params.push(variantId);
      } else {
        query += ' AND product_variant_id IS NULL';
      }

      await pool.query(query, params);
      res.status(200).json({
        status: 'success',
        message: 'Inventory quantity updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
export default adminController;
