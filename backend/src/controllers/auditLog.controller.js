const { promisePool: db } = require('../config/database');

const ACTION_LABELS = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',
};

const ENTITY_LABELS = {
  customers: 'Customer',
  raw_purchases: 'Raw Purchase',
  job_work: 'Job Work',
  sales_orders: 'Sales Order',
  expenses: 'Expense',
  workers: 'Worker',
  batches: 'Processing Batch',
  sales_payments: 'Payment',
  auth: 'Auth',
  settings: 'Settings',
};

/**
 * GET /api/v1/audit-logs
 * Query params: page, limit, action, entity, userId, search
 */
const getAuditLogs = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const { action, entity, userId, search } = req.query;

    const conditions = [];
    const params     = [];

    if (action)  { conditions.push('action = ?');          params.push(action); }
    if (entity)  { conditions.push('entity = ?');          params.push(entity); }
    if (userId)  { conditions.push('userId = ?');          params.push(userId); }
    if (search)  {
      conditions.push('(userName LIKE ? OR entityLabel LIKE ? OR description LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM audit_logs ${where}`,
      params
    );

    const [rows] = await db.execute(
      `SELECT id, userId, userName, userRole, action, entity, entityId, entityLabel, description, ipAddress, createdAt
       FROM audit_logs ${where}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Enrich with display labels
    const data = rows.map(r => ({
      ...r,
      actionLabel:  ACTION_LABELS[r.action]  || r.action,
      entityLabel2: ENTITY_LABELS[r.entity]  || r.entity,
      createdAt:    r.createdAt,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('audit logs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

/**
 * GET /api/v1/audit-logs/summary
 * Returns action counts + active users for dashboard widget
 */
const getAuditSummary = async (req, res) => {
  try {
    const [[actionsRow]] = await db.execute(`
      SELECT
        SUM(action = 'CREATE') AS creates,
        SUM(action = 'UPDATE') AS updates,
        SUM(action = 'DELETE') AS deletes,
        SUM(action = 'LOGIN')  AS logins,
        COUNT(*)               AS total
      FROM audit_logs
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    const [topUsers] = await db.execute(`
      SELECT userName, COUNT(*) AS count
      FROM audit_logs
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND userName != 'System'
      GROUP BY userName
      ORDER BY count DESC
      LIMIT 5
    `);

    const [recentActivity] = await db.execute(`
      SELECT action, entity, entityLabel, userName, createdAt
      FROM audit_logs
      ORDER BY createdAt DESC
      LIMIT 10
    `);

    res.json({ success: true, data: { week: actionsRow, topUsers, recentActivity } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit summary' });
  }
};

module.exports = { getAuditLogs, getAuditSummary };
