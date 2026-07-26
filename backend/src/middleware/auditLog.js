const { promisePool } = require('../config/database');
const logger = require('../config/logger');

// Audit log middleware - tracks create/edit actions
const auditLog = (action) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to capture response
    res.send = function (data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAuditLog(req, action, data).catch(err => {
          logger.error('Audit log creation failed:', err);
        });
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

// Create audit log entry
const createAuditLog = async (req, action, responseData) => {
  try {
    const parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

    const query = `
      INSERT INTO audit_logs (
        user_id,
        username,
        action,
        module,
        record_id,
        ip_address,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      req.user?.id || null,
      req.user?.username || 'System',
      action,
      req.baseUrl.split('/').pop() || 'unknown',
      parsedData?.data?.id || null,
      req.ip,
      req.get('user-agent')
    ];

    await promisePool.execute(query, values);
  } catch (error) {
    logger.error('Error creating audit log:', error);
  }
};

module.exports = auditLog;
