import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, BarChart2 } from 'lucide-react';
import { useOrdersStore } from '../../store/ordersStore';
import { useStaffStore } from '../../store/staffStore';
import { useSuppliersStore } from '../../store/suppliersStore';
import { formatCOP } from '../../utils/currency';

function StatCard({ title, value, icon: Icon, color = 'accent', subtitle }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
          <Icon size={22} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-extrabold">{value}</div>
        <div className="text-sm font-bold text-muted mt-1">{title}</div>
        {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function Finance() {
  const orders = useOrdersStore(s => s.orders);
  const { staff, payrollRecords } = useStaffStore();
  const { purchaseOrders } = useSuppliersStore();

  // --- Período actual: mes en curso ---
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthLabel = now.toLocaleString('es-CO', { month: 'long', year: 'numeric' });

  // Ingresos: Ventas pagadas en el mes
  const paidOrders = useMemo(() =>
    orders.filter(o => o.paymentStatus === 'paid' && o.createdAt >= monthStart),
    [orders, monthStart]
  );
  const totalRevenue = useMemo(() =>
    paidOrders.reduce((s, o) => s + (o.totals?.grandTotal || 0), 0),
    [paidOrders]
  );
  const totalDiscounts = useMemo(() =>
    paidOrders.reduce((s, o) => s + (o.totals?.totalDiscounts || 0), 0),
    [paidOrders]
  );
  const totalTax = useMemo(() =>
    paidOrders.reduce((s, o) => s + (o.totals?.impoconsumo || 0), 0),
    [paidOrders]
  );
  const netRevenue = totalRevenue - totalTax;

  // Egresos: Compras del mes
  const monthlyPurchases = useMemo(() =>
    purchaseOrders.filter(po => po.date >= monthStart),
    [purchaseOrders, monthStart]
  );
  const totalPurchases = useMemo(() =>
    monthlyPurchases.reduce((s, po) => s + (po.totalAmount || 0), 0),
    [monthlyPurchases]
  );

  // Egresos: Nómina del mes
  const monthlyPayroll = useMemo(() =>
    payrollRecords.filter(pr => pr.date >= monthStart),
    [payrollRecords, monthStart]
  );
  const totalPayroll = useMemo(() =>
    monthlyPayroll.reduce((s, pr) => s + (pr.amount || 0), 0),
    [monthlyPayroll]
  );

  const totalExpenses = totalPurchases + totalPayroll;
  const netProfit = netRevenue - totalExpenses;
  const profitMargin = netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : 0;

  // Exportar CSV simple
  const handleExport = () => {
    const rows = [
      ['ESTADO DE RESULTADOS — ' + monthLabel.toUpperCase()],
      [],
      ['INGRESOS', ''],
      ['Ventas Brutas', totalRevenue],
      ['Descuentos / Promos', -totalDiscounts],
      ['Impoconsumo 8%', -totalTax],
      ['Venta Neta', netRevenue],
      [],
      ['EGRESOS', ''],
      ['Compras / Proveedores', -totalPurchases],
      ['Nómina', -totalPayroll],
      ['Total Egresos', -totalExpenses],
      [],
      ['UTILIDAD NETA', netProfit],
      ['Margen de Utilidad', profitMargin + '%'],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaladarGrill_PL_${monthStart.slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finanzas</h1>
          <p className="page-subtitle">Estado de Resultados (P&L) — {monthLabel}</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard
          title="Ventas Brutas"
          value={formatCOP(totalRevenue)}
          icon={TrendingUp}
          color="var(--accent)"
          subtitle={`${paidOrders.length} órdenes pagadas`}
        />
        <StatCard
          title="Venta Neta"
          value={formatCOP(netRevenue)}
          icon={DollarSign}
          color="var(--accent)"
          subtitle="Después de impuestos"
        />
        <StatCard
          title="Total Egresos"
          value={formatCOP(totalExpenses)}
          icon={TrendingDown}
          color="var(--danger)"
          subtitle={`Compras + Nómina`}
        />
        <div className={`card p-5 flex flex-col gap-2 border ${netProfit >= 0 ? 'border-success/40 bg-success/5' : 'border-danger/40 bg-danger/5'}`}>
          <div className={`p-3 rounded-lg w-fit ${netProfit >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            <BarChart2 size={22} />
          </div>
          <div>
            <div className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>{formatCOP(netProfit)}</div>
            <div className="text-sm font-bold text-muted mt-1">Utilidad Neta</div>
            <div className="text-xs text-muted mt-1">Margen: {profitMargin}%</div>
          </div>
        </div>
      </div>

      {/* Estado de Resultados detallado */}
      <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Ingresos */}
        <div className="card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            <h2 className="font-bold text-lg">Ingresos</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm py-2 border-b border-border/50">
              <span className="text-muted">Ventas brutas</span>
              <span className="font-bold">{formatCOP(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-border/50">
              <span className="text-muted">Descuentos / Promos</span>
              <span className="text-danger font-bold">− {formatCOP(totalDiscounts)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-border/50">
              <span className="text-muted">Impoconsumo 8%</span>
              <span className="text-danger font-bold">− {formatCOP(totalTax)}</span>
            </div>
            <div className="flex justify-between py-3 mt-1 border-t-2 border-border">
              <span className="font-extrabold">Venta Neta</span>
              <span className="font-extrabold text-accent">{formatCOP(netRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Egresos */}
        <div className="card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <TrendingDown size={18} className="text-danger" />
            <h2 className="font-bold text-lg">Egresos</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm py-2 border-b border-border/50">
              <span className="text-muted">Compras a proveedores</span>
              <span className="font-bold">{formatCOP(totalPurchases)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-border/50">
              <span className="text-muted">Nómina pagada</span>
              <span className="font-bold">{formatCOP(totalPayroll)}</span>
            </div>
            <div className="flex justify-between py-3 mt-1 border-t-2 border-border">
              <span className="font-extrabold">Total Egresos</span>
              <span className="font-extrabold text-danger">− {formatCOP(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Resumen de nómina */}
        <div className="card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Users size={18} className="text-secondary" />
            <h2 className="font-bold text-lg">Nómina del Mes</h2>
          </div>
          <div className="p-4">
            {staff.map(emp => {
              const pagos = monthlyPayroll.filter(pr => pr.staffId === emp.id);
              const total = pagos.reduce((s, p) => s + p.amount, 0);
              return (
                <div key={emp.id} className="flex justify-between py-2 border-b border-border/50 text-sm">
                  <div>
                    <div className="font-bold">{emp.name}</div>
                    <div className="text-muted">{emp.role}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${total > 0 ? 'text-accent' : 'text-muted'}`}>{total > 0 ? formatCOP(total) : 'Sin pagos'}</div>
                    <div className="text-muted text-xs">Base: {formatCOP(emp.salary)}</div>
                  </div>
                </div>
              );
            })}
            {staff.length === 0 && <div className="text-muted text-center py-4">Sin empleados registrados.</div>}
          </div>
        </div>

        {/* Top productos del mes */}
        <div className="card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <ShoppingCart size={18} className="text-accent" />
            <h2 className="font-bold text-lg">Productos Más Vendidos</h2>
          </div>
          <div className="p-4">
            {(() => {
              const productSales = {};
              paidOrders.forEach(order => {
                (order.items || []).forEach(item => {
                  if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 };
                  productSales[item.name].qty += item.quantity;
                  productSales[item.name].revenue += item.price * item.quantity;
                });
              });
              const sorted = Object.entries(productSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
              if (sorted.length === 0) return <div className="text-muted text-center py-4">Sin ventas este mes.</div>;
              return sorted.map(([name, data], i) => (
                <div key={name} className="flex justify-between py-2 border-b border-border/50 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted font-bold w-4">#{i + 1}</span>
                    <span className="font-bold">{name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-accent">{formatCOP(data.revenue)}</div>
                    <div className="text-muted text-xs">{data.qty} uds</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
