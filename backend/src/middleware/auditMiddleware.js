/**
 * Auto-audit middleware for mutating routes.
 * Attach to a route like: router.post('/customers', authenticate, auditMiddleware('customers', 'CREATE'), ...)
 * Or use the patchResponse helper for create (needs new entity ID from the response).
 *
 * For full coverage we monkey-patch res.json to capture the response body.
 */
const { auditLog } = require('../utils/auditLogger');

const METHOD_ACTION = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };

/**
 * Generic auto-audit middleware.
 * @param {string} entity  - e.g. 'raw_purchases'
 * @param {function} [labelFn] - optional (req, resBody) => string
 */
const autoAudit = (entity, labelFn) => (req, res, next) => {
  const action = METHOD_ACTION[req.method];
  if (!action) return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body?.success) {
      const entityId  = body.data?.id || req.params?.id || null;
      const entityLabel = labelFn ? labelFn(req, body) : (body.data?.name || body.data?.orderNumber || body.data?.supplierName || null);
      auditLog({ user: req.user, action, entity, entityId, entityLabel, ip: req.ip });
    }
    return originalJson(body);
  };

  next();
};

module.exports = { autoAudit };
