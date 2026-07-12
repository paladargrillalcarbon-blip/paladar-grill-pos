import { NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Package,
  BookOpen, Users, DollarSign, Truck, Tag, Settings, LogOut, Receipt, FlaskConical,
} from 'lucide-react';
import { useOrdersStore } from '../store/ordersStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { canAccessRoute, ROLES } from '../utils/permissions';

const NAV_ITEMS = [
  {
    section: 'Principal',
    items: [
      { to: '/',          label: 'Dashboard',    icon: LayoutDashboard },
      { to: '/pos',       label: 'Punto de Venta', icon: ShoppingCart },
      { to: '/orders',    label: 'Pedidos',      icon: ClipboardList },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { to: '/inventory', label: 'Inventario',      icon: Package },
      { to: '/menu',      label: 'Menú & Productos', icon: BookOpen },
      { to: '/recipes',   label: 'Recetas',          icon: FlaskConical },
      { to: '/promotions',label: 'Promociones',     icon: Tag },
    ],
  },
  {
    section: 'Administración',
    items: [
      { to: '/staff',     label: 'Personal',       icon: Users },
      { to: '/finance',   label: 'Finanzas',       icon: DollarSign },
      { to: '/suppliers', label: 'Proveedores',    icon: Truck },
      { to: '/purchases', label: 'Compras del Día', icon: Receipt },
      { to: '/settings',  label: 'Configuración',  icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const orders = useOrdersStore((s) => s.orders);
  const ingredients = useInventoryStore((s) => s.ingredients);
  const { activeUser, logout } = useAuthStore();

  const activeOrders = useMemo(() => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  }, [orders]);

  const lowStock = useMemo(() => {
    return ingredients.filter(i => i.stock <= i.minStock);
  }, [ingredients]);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🍔</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">Paladar Grill</div>
          <div className="sidebar-logo-sub">ERP System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((section) => {
          // Filter items based on permissions
          const allowedItems = section.items.filter(item => canAccessRoute(activeUser?.role, item.to));
          
          if (allowedItems.length === 0) return null;

          return (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {allowedItems.map(({ to, label, icon: Icon }) => {
                const badge =
                  to === '/orders' ? activeOrders.length || null
                  : to === '/inventory' ? lowStock.length || null
                  : null;

                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-item-icon">
                      <Icon size={18} />
                    </span>
                    <span className="nav-item-label">{label}</span>
                    {badge ? <span className="nav-badge">{badge}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {activeUser && (
          <div className="mb-4 px-2 py-3 bg-surface rounded-lg border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-lg flex-shrink-0">
              {ROLES[activeUser.role]?.icon || '👤'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate text-foreground">{activeUser.name}</div>
              <div className="text-xs truncate" style={{ color: ROLES[activeUser.role]?.color || 'var(--muted)' }}>
                {ROLES[activeUser.role]?.label}
              </div>
            </div>
          </div>
        )}
        <button className="nav-item" style={{ color: 'var(--red-400)' }} onClick={logout}>
          <span className="nav-item-icon"><LogOut size={18} /></span>
          <span className="nav-item-label">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
