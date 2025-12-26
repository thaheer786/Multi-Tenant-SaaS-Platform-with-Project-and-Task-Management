// Authorization Middleware
const { USER_ROLES } = require('../config/constants');
const { logAuditAction, getClientIp, AUDIT_ACTIONS } = require('../utils/auditLogger');

// Require specific roles
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      await logAuditAction(
        req.user.tenantId,
        req.user.userId,
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS_ATTEMPT,
        'endpoint',
        req.path,
        getClientIp(req)
      );

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

// Require super admin only
const requireSuperAdmin = requireRole(USER_ROLES.SUPER_ADMIN);

// Require tenant admin or super admin
const requireTenantAdmin = requireRole(USER_ROLES.TENANT_ADMIN, USER_ROLES.SUPER_ADMIN);

// Require user to be in specific tenant
const requireTenantAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Super admin can access any tenant
  if (req.user.role === USER_ROLES.SUPER_ADMIN) {
    return next();
  }

  // Regular users must be in the tenant they're accessing
  const tenantIdFromUrl = req.params.tenantId;
  if (tenantIdFromUrl && req.user.tenantId !== tenantIdFromUrl) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this tenant'
    });
  }

  next();
};

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireTenantAdmin,
  requireTenantAccess
};
