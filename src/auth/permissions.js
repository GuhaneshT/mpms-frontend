export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  PROFILE_READ: 'profile:read',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  ORDER_LIFECYCLE_READ: 'order_lifecycle:read',
  ORDER_LIFECYCLE_WRITE: 'order_lifecycle:write',
  MACHINES_READ: 'machines:read',
  MACHINES_WRITE: 'machines:write',
  SERVICE_CALLS_READ: 'service_calls:read',
  SERVICE_CALLS_WRITE: 'service_calls:write',
  SERVICE_CALLS_RESOLVE: 'service_calls:resolve',
  KNOWLEDGE_BASE_READ: 'knowledge_base:read',
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const RESERVED_SUPABASE_ROLES = new Set(['anon', 'authenticated', 'service_role']);

const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,
  operations_manager: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.ORDER_LIFECYCLE_READ,
    PERMISSIONS.ORDER_LIFECYCLE_WRITE,
    PERMISSIONS.MACHINES_READ,
    PERMISSIONS.MACHINES_WRITE,
    PERMISSIONS.SERVICE_CALLS_READ,
    PERMISSIONS.KNOWLEDGE_BASE_READ,
  ],
  service_manager: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDER_LIFECYCLE_READ,
    PERMISSIONS.ORDER_LIFECYCLE_WRITE,
    PERMISSIONS.MACHINES_READ,
    PERMISSIONS.MACHINES_WRITE,
    PERMISSIONS.SERVICE_CALLS_READ,
    PERMISSIONS.SERVICE_CALLS_WRITE,
    PERMISSIONS.SERVICE_CALLS_RESOLVE,
    PERMISSIONS.KNOWLEDGE_BASE_READ,
  ],
  service_engineer: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDER_LIFECYCLE_READ,
    PERMISSIONS.MACHINES_READ,
    PERMISSIONS.SERVICE_CALLS_READ,
    PERMISSIONS.SERVICE_CALLS_WRITE,
    PERMISSIONS.SERVICE_CALLS_RESOLVE,
    PERMISSIONS.KNOWLEDGE_BASE_READ,
  ],
  viewer: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDER_LIFECYCLE_READ,
    PERMISSIONS.MACHINES_READ,
    PERMISSIONS.SERVICE_CALLS_READ,
    PERMISSIONS.KNOWLEDGE_BASE_READ,
  ],
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeRoleValue = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || RESERVED_SUPABASE_ROLES.has(normalized)) {
    return null;
  }

  return Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, normalized) ? normalized : null;
};

const normalizePermissions = (rawPermissions) => {
  if (typeof rawPermissions === 'string') {
    return ALL_PERMISSIONS.includes(rawPermissions) ? [rawPermissions] : [];
  }

  if (!Array.isArray(rawPermissions)) {
    return [];
  }

  return rawPermissions.filter((permission) => ALL_PERMISSIONS.includes(permission));
};

export const resolveRole = (claims = {}) => {
  const appMetadata = isPlainObject(claims.app_metadata) ? claims.app_metadata : {};
  const userMetadata = isPlainObject(claims.user_metadata) ? claims.user_metadata : {};

  const candidates = [
    ['app_metadata.rbac_role', appMetadata.rbac_role],
    ['app_metadata.role', appMetadata.role],
    ['user_metadata.role', userMetadata.role],
    ['token.role', claims.role],
  ];

  for (const [source, rawRole] of candidates) {
    const role = normalizeRoleValue(rawRole);
    if (role) {
      return { role, roleSource: source };
    }
  }

  return { role: 'viewer', roleSource: 'default' };
};

export const buildProfileFromClaims = (claims = {}) => {
  const appMetadata = isPlainObject(claims.app_metadata) ? claims.app_metadata : {};
  const userMetadata = isPlainObject(claims.user_metadata) ? claims.user_metadata : {};
  const { role, roleSource } = resolveRole(claims);
  const permissions = [
    ...(ROLE_PERMISSIONS[role] || []),
    ...normalizePermissions(appMetadata.permissions),
    ...normalizePermissions(userMetadata.permissions),
    ...normalizePermissions(claims.permissions),
  ];

  return {
    ...claims,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
    role,
    role_source: roleSource,
    permissions: [...new Set(permissions)].sort(),
    display_name: userMetadata.full_name || claims.email || claims.sub || 'User',
  };
};

export const hasPermission = (profile, permission) => {
  if (!permission) {
    return true;
  }

  return Boolean(profile?.permissions?.includes(permission));
};

export const formatRole = (role = 'viewer') =>
  role
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export const formatPermission = (permission) => {
  const [resource = '', action = ''] = permission.split(':');
  const resourceLabel = resource.replace(/_/g, ' ');
  return `${resourceLabel} ${action}`.trim();
};
