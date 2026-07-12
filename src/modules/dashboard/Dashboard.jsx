import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, Users, Package,
  AlertTriangle, Clock, Tag,
} from 'lucide-react';
import { useOrdersStore }    from '../../store/ordersStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { formatCOP }         from '../../utils/currency';
import { format, subDays }   from 'date-fns';
import { es }                from 'date-fns/locale';

const CHANNEL_COLOR = {
  local: '#a855f7', own: '#f59e0b', rappi: '#ef4444',
  ifood: '#22c55e', pedidosya: '#3b82f6', takeaway: '#64748b',
};

export default function Dashboard() {
  const orders       = useOrdersStore((s) => s.orders);
  const ingredients  = useInventoryStore((s) => s.ingredients);

  const todaysOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(o => o.createdAt.startsWith(today));
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  }, [orders]);

  const lowStock = useMemo(() => {
    return ingredients.filter(i => i.stock <= i.minStock);
  }, [ingredients]);

  // KPIs del día
  const todayStats = useMemo(() => {
    const validOrders = todaysOrders.filter((o) => o.paymentStatus === 'paid');
    const totalSales  = validOrders.reduce((s, o) => s + (o.totals?.grandTotal || 0), 0);
    const totalTips   = validOrders.reduce((s, o) => s + (o.tip || 0), 0);
    const avgTicket   = validOrders.length ? totalSales / validOrders.length : 0;
    const discounts   = validOrders.reduce((s, o) => s + (o.totals?.totalDiscounts || 0), 0);
    return { totalSales, totalTips, avgTicket, discounts, ordersCount: validOrders.length };
  }, [todaysOrders]);

  // Ventas por canal
  const salesByChannel = useMemo(() => {
    const map = {};
    todaysOrders
      .filter((o) => o.paymentStatus === 'paid')
      .forEach((o) => {
        const ch = o.type || 'local';
        map[ch] = (map[ch] || 0) + (o.totals?.grandTotal || 0);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [todaysOrders]);

  // Últimos 7 días de ventas
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOrders = orders.filter(
        (o) => o.createdAt?.startsWith(dateStr) && o.paymentStatus === 'paid'
      );
      return {
        day: format(date, 'EEE', { locale: es }),
        ventas: dayOrders.reduce((s, o) => s + (o.totals?.grandTotal || 0), 0),
        pedidos: dayOrders.length,
      };
    });
  }, [orders]);

  // Top 5 productos
  const topProducts = useMemo(() => {
    const map = {};
    orders
      .filter((o) => o.paymentStatus === 'paid')
      .flatMap((o) => o.items || [])
      .forEach((item) => {
        map[item.name] = (map[item.name] || 0) + item.quantity;
      });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [orders]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {format(new Date(), "EEEE dd 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {activeOrders.length > 0 && (
            <div className="badge badge-warning">
              <Clock size={12} /> {activeOrders.length} pedidos activos
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {lowStock.length > 0 && (
        <div className="alert alert-danger mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
          <AlertTriangle size={16} />
          <span>
            <strong>{lowStock.length} ingrediente{lowStock.length > 1 ? 's' : ''} con stock bajo:</strong>{' '}
            {lowStock.slice(0, 3).map((i) => i.name).join(', ')}
            {lowStock.length > 3 ? ` y ${lowStock.length - 3} más.` : ''}
          </span>
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card amber">
          <div className="kpi-icon amber"><TrendingUp size={20} /></div>
          <div className="kpi-label">Ventas del Día</div>
          <div className="kpi-value">{formatCOP(todayStats.totalSales)}</div>
          <div className="kpi-sub">{todayStats.ordersCount} pedidos completados</div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon green"><ShoppingBag size={20} /></div>
          <div className="kpi-label">Ticket Promedio</div>
          <div className="kpi-value">{formatCOP(todayStats.avgTicket)}</div>
          <div className="kpi-sub">por pedido hoy</div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple"><Clock size={20} /></div>
          <div className="kpi-label">Pedidos Activos</div>
          <div className="kpi-value">{activeOrders.length}</div>
          <div className="kpi-sub">en preparación</div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon blue">💰</div>
          <div className="kpi-label">Propinas del Día</div>
          <div className="kpi-value">{formatCOP(todayStats.totalTips)}</div>
          <div className="kpi-sub">acumuladas hoy</div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-icon red"><Tag size={20} /></div>
          <div className="kpi-label">Descuentos Otorgados</div>
          <div className="kpi-value">{formatCOP(todayStats.discounts)}</div>
          <div className="kpi-sub">en promociones hoy</div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon green"><Package size={20} /></div>
          <div className="kpi-label">Alertas Inventario</div>
          <div className="kpi-value" style={{ color: lowStock.length > 0 ? 'var(--red-400)' : 'var(--green-400)' }}>
            {lowStock.length}
          </div>
          <div className="kpi-sub">ingredientes bajo mínimo</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-4" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        {/* Ventas últimos 7 días */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ventas — Últimos 7 días</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }}
                tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
              <Tooltip
                formatter={(v) => [formatCOP(v), 'Ventas']}
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="ventas" stroke="#f59e0b" strokeWidth={2}
                fill="url(#gradVentas)" dot={{ fill: '#f59e0b', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por canal */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ventas por Canal — Hoy</span>
          </div>
          {salesByChannel.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">Sin ventas aún hoy</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesByChannel} layout="vertical">
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={80} />
                <Tooltip
                  formatter={(v) => [formatCOP(v), 'Ventas']}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {salesByChannel.map((entry) => (
                    <Cell key={entry.name} fill={CHANNEL_COLOR[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2" style={{ gap: 'var(--space-5)' }}>
        {/* Top Productos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏆 Top Productos</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍔</div>
              <div className="empty-state-text">Sin ventas aún</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {topProducts.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ width: 24, height: 24, background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{p.name}</span>
                  <div className="badge badge-warning">{p.count} uds</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos activos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Pedidos Activos</span>
          </div>
          {activeOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Sin pedidos activos</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {activeOrders.slice(0, 6).map((o) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 60 }}>
                    #{o.id?.slice(-4) || '0000'}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.8rem' }}>
                    {o.type === 'local' ? '🍽️' : o.type === 'rappi' ? '🔴' : o.type === 'ifood' ? '🟢' : '🛵'}{' '}
                    {o.tableNumber || o.customerName || o.type}
                  </span>
                  <span className={`badge badge-${o.status}`}>
                    {o.status === 'pending' ? 'Pendiente' : o.status === 'preparing' ? 'Preparando' : 'Listo'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                    {formatCOP(o.totals?.grandTotal || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
