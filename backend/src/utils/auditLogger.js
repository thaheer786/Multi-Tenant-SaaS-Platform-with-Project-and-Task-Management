// Audit logging utility
const pool = require('../config/database');
const { AUDIT_ACTIONS } = require('../config/constants');

async function logAuditAction(tenantId, userId, action, entityType, entityId, ipAddress, details = null) {
  try {
    const query = `
      INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await pool.query(query, [
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      details ? JSON.stringify(details) : null
    ]);
  } catch (error) {
    // Log error but don't fail the request
    console.error('Audit logging failed:', error.message);
  }
}

// Helper to get client IP from request
function getClientIp(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

module.exports = {
  logAuditAction,
  getClientIp,
  AUDIT_ACTIONS
};
