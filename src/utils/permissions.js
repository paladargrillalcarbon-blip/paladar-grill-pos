/**
 * Sistema de Permisos y Roles
 * Define qué puede hacer y ver cada rol en el sistema
 */

export const ROLES = {
  superadmin: {
    label: 'Super Administrador',
    color: '#f59e0b',
    icon: '👑',
    description: 'Acceso total al sistema. Puede gestionar usuarios y configuración avanzada.',
  },
  admin: {
    label: 'Administrador',
    color: '#a855f7',
    icon: '🛡️',
    description: 'Acceso completo excepto gestión de usuarios y configuración del sistema.',
  },
  cajero: {
    label: 'Cajero',
    color: '#3b82f6',
    icon: '💳',
    description: 'Puede operar la caja, cobrar pedidos y ver órdenes activas.',
  },
  mesero: {
    label: 'Mesero',
    color: '#22c55e',
    icon: '🍽️',
    description: 'Solo puede tomar pedidos y ver el estado de las órdenes de su turno.',
  },
};

// Rutas permitidas por rol
export const ROLE_ROUTES = {
  superadmin: 'all', // todas las rutas
  admin:      ['/', '/pos', '/orders', '/inventory', '/menu', '/recipes', '/promotions', '/staff', '/finance', '/suppliers', '/purchases'],
  cajero:     ['/', '/pos', '/orders'],
  mesero:     ['/pos', '/orders'],
};

// Permisos granulares (acciones específicas)
export const PERMISSIONS = {
  // Caja
  openCloseRegister:  ['superadmin', 'admin', 'cajero'],
  processPayment:     ['superadmin', 'admin', 'cajero'],
  applyDiscount:      ['superadmin', 'admin', 'cajero'],

  // Pedidos
  createOrder:        ['superadmin', 'admin', 'cajero', 'mesero'],
  cancelOrder:        ['superadmin', 'admin', 'cajero'],

  // Menú & Inventario
  editMenu:           ['superadmin', 'admin'],
  editInventory:      ['superadmin', 'admin'],
  editRecipes:        ['superadmin', 'admin'],
  editPromotions:     ['superadmin', 'admin'],

  // Finanzas
  viewFinance:        ['superadmin', 'admin'],
  exportReports:      ['superadmin', 'admin'],

  // Personal
  viewStaff:          ['superadmin', 'admin'],
  editStaff:          ['superadmin', 'admin'],

  // Proveedores
  viewSuppliers:      ['superadmin', 'admin'],
  editSuppliers:      ['superadmin', 'admin'],

  // Sistema
  manageUsers:        ['superadmin'],
  accessSettings:     ['superadmin'],
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export const hasPermission = (role, permission) => {
  if (!role || !PERMISSIONS[permission]) return false;
  return PERMISSIONS[permission].includes(role);
};

/**
 * Verifica si un rol puede acceder a una ruta
 */
export const canAccessRoute = (role, route) => {
  if (!role) return false;
  const allowed = ROLE_ROUTES[role];
  if (allowed === 'all') return true;
  // exact match or starts with (for nested routes)
  return allowed.some(r => route === r || route.startsWith(r + '/'));
};
