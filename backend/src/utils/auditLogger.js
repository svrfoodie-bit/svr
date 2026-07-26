/**
 * Audit logger — call this from controllers after successful writes.
 * Fire-and-forget: never throws, never blocks the response.
 */
const { promisePool: db } = require('../config/database');

/**
 * @param {object} opts
 * @param {object|null} opts.user      - req.user (may be null for system actions)
 * @param {string}      opts.action    - CREATE | UPDATE | DELETE | LOGIN | LOGOUT
 * @param {string}      opts.entity    - module name: customers, raw_purchases, etc.
 * @param {string|number|null} opts.entityId
 * @param {string|null} opts.entityLabel - human-readable: customer name, order#, etc.
 * @param {string|null} opts.description
 * @param {string|null} opts.ip        - req.ip
 */
const auditLog = (opts) => {
  const { user, action, entity, entityId = null, entityLabel = null, description = null, ip = null } = opts;
  setImmediate(async () => {
    try {
      await db.execute(
        `INSERT INTO audit_logs (userId, userName, userRole, action, entity, entityId, entityLabel, description, ipAddress)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user?.id ?? null,
          user?.name ?? 'System',
          user?.role ?? null,
          action,
          entity,
          entityId != null ? String(entityId) : null,
          entityLabel,
          description,
          ip,
        ]
      );
    } catch (err) {
      // Silently fail — audit logging must never break business logic
      if (process.env.NODE_ENV === 'development') console.error('[audit] log failed:', err.message);
    }
  });
};

module.exports = { auditLog };
