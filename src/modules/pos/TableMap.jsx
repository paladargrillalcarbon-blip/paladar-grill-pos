import { useState, useMemo } from 'react';
import { Users, Clock, Edit3, DollarSign, MapPin, Plus, Trash2, Settings2, X, Save } from 'lucide-react';
import { formatCOP } from '../../utils/currency';
import { useTableStore } from '../../store/tableStore';
import { format } from 'date-fns';

const ZONES = [
  { id: 'all',       label: 'Todas',              icon: '🏠' },
  { id: 'principal', label: 'Salón Principal',     icon: '🪑' },
  { id: 'terraza',   label: 'Terraza',             icon: '☀️' },
  { id: 'vip',       label: 'Zona VIP',            icon: '✨' },
];

const SHAPES = [
  { id: 'square', label: 'Cuadrada' },
  { id: 'round',  label: 'Redonda'  },
];

/**
 * TableMap - Visual grid of the restaurant tables.
 *
 * Props:
 *   activeUnpaidOrders - array of orders with paymentStatus === 'unpaid'
 *   onLoadOrder        - (order) => void  — load order into POS for editing
 *   onOpenTable        - (tableId) => void — start a new order for that table
 *   onPayOrder         - (order) => void  — open payment modal for order
 */
export default function TableMap({ activeUnpaidOrders, onLoadOrder, onOpenTable, onPayOrder }) {
  const { tables, addTable, updateTable, deleteTable } = useTableStore();

  const [selectedZone, setSelectedZone] = useState('all');
  const [showConfig, setShowConfig] = useState(false);

  // Modal para agregar/editar mesa
  const [tableModal, setTableModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [tableForm, setTableForm] = useState({ name: '', zone: 'principal', capacity: 4, shape: 'square' });

  // --- Estadísticas ---
  const occupiedCount = useMemo(() => {
    return tables.filter(t =>
      activeUnpaidOrders.some(o => o.type === 'local' && Number(o.tableNumber) === t.id)
    ).length;
  }, [activeUnpaidOrders, tables]);

  const localSales = useMemo(() => {
    return activeUnpaidOrders
      .filter(o => o.type === 'local')
      .reduce((s, o) => s + (o.totals?.grandTotal || 0), 0);
  }, [activeUnpaidOrders]);

  const deliverySales = useMemo(() => {
    return activeUnpaidOrders
      .filter(o => o.type !== 'local')
      .reduce((s, o) => s + (o.totals?.grandTotal || 0), 0);
  }, [activeUnpaidOrders]);

  const filteredTables = useMemo(() => {
    return tables.filter(t => selectedZone === 'all' || t.zone === selectedZone);
  }, [selectedZone, tables]);

  // --- Acciones de mesa ---
  const openTableModal = (mode, table = null) => {
    if (mode === 'edit' && table) {
      setTableForm({ name: table.name, zone: table.zone, capacity: table.capacity, shape: table.shape });
    } else {
      const nextNum = tables.length + 1;
      setTableForm({ name: `Mesa ${nextNum}`, zone: 'principal', capacity: 4, shape: 'square' });
    }
    setTableModal({ isOpen: true, mode, data: table });
  };

  const handleSaveTable = (e) => {
    e.preventDefault();
    if (!tableForm.name || tableForm.capacity < 1) return;

    if (tableModal.mode === 'create') {
      addTable(tableForm);
    } else {
      updateTable(tableModal.data.id, tableForm);
    }
    setTableModal({ isOpen: false, mode: 'create', data: null });
  };

  const handleDeleteTable = (id) => {
    const hasOrder = activeUnpaidOrders.some(o => o.type === 'local' && Number(o.tableNumber) === id);
    if (hasOrder) {
      alert('No puedes eliminar una mesa que tiene un pedido activo. Cobra o cancela el pedido primero.');
      return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar esta mesa?')) {
      deleteTable(id);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto', padding: 'var(--space-2)' }}>

      {/* ── Panel de Estadísticas Rápidas ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-3)',
        background: 'var(--bg-elevated)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ocupación
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>
            {occupiedCount} / {tables.length}{' '}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Mesas</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ventas en Mesa
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>
            {formatCOP(localSales)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Domicilios / Llevar
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {formatCOP(deliverySales)}
          </div>
        </div>
      </div>

      {/* ── Selector de Zonas + Botones de acción ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {ZONES.map(zone => (
            <button
              key={zone.id}
              className="btn btn-sm"
              onClick={() => setSelectedZone(zone.id)}
              style={{
                background: selectedZone === zone.id ? 'var(--accent)' : 'var(--bg-elevated)',
                color: selectedZone === zone.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${selectedZone === zone.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              {zone.icon} {zone.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowConfig(!showConfig)}
            title="Administrar mesas"
          >
            <Settings2 size={14} /> {showConfig ? 'Ocultar Admin' : 'Admin Mesas'}
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => openTableModal('create')}
            title="Agregar mesa"
          >
            <Plus size={14} /> Mesa
          </button>
        </div>
      </div>

      {/* ── Grid Visual de Mesas ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {filteredTables.map(t => {
          const order = activeUnpaidOrders.find(
            o => o.type === 'local' && Number(o.tableNumber) === t.id
          );
          const isOccupied = !!order;
          const occupiedBg = 'rgba(239, 68, 68, 0.08)';
          const freeBg     = 'rgba(34, 197, 94, 0.08)';

          return (
            <div
              key={t.id}
              className="card p-3 transition"
              style={{
                border: `2px solid ${isOccupied ? '#fca5a5' : '#86efac'}`,
                background: isOccupied ? occupiedBg : freeBg,
                borderRadius: t.shape === 'round' ? '50%' : 'var(--radius-xl)',
                aspectRatio: t.shape === 'round' ? '1' : '1.3',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                gap: 6,
                boxShadow: isOccupied ? '0 10px 15px -3px rgba(239,68,68,0.1)' : 'none',
                cursor: 'default',
              }}
            >
              {/* Badge de Capacidad */}
              <div style={{
                position: 'absolute', top: 8, right: 12,
                fontSize: '0.7rem', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
                <Users size={10} /> {t.capacity}
              </div>

              {/* Botones de admin (editar/eliminar) */}
              {showConfig && (
                <div style={{
                  position: 'absolute', top: 6, left: 8,
                  display: 'flex', gap: 2,
                }}>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ padding: 2, width: 22, height: 22 }}
                    onClick={(e) => { e.stopPropagation(); openTableModal('edit', t); }}
                    title="Editar mesa"
                  >
                    <Edit3 size={11} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    style={{ padding: 2, width: 22, height: 22 }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteTable(t.id); }}
                    title="Eliminar mesa"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}

              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {t.name}
              </div>

              {isOccupied ? (
                <>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>OCUPADA</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {formatCOP(order.totals?.grandTotal || 0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                    {order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : '--:--'}
                    {' · '}
                    {order.items?.reduce((s, i) => s + i.quantity, 0) || 0} items
                  </div>

                  {/* Barra de Acciones Rápidas */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    <button
                      className="btn btn-sm btn-ghost btn-icon"
                      style={{ padding: 4, color: 'var(--text-primary)' }}
                      title="Editar / Agregar productos"
                      onClick={() => onLoadOrder(order)}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn btn-sm btn-ghost btn-icon"
                      style={{ padding: 4, color: '#f59e0b' }}
                      title="Cobrar pedido"
                      onClick={() => onPayOrder(order)}
                    >
                      <DollarSign size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.8rem' }}>LIBRE</div>
                  <button
                    className="btn btn-xs btn-primary"
                    style={{ marginTop: 6 }}
                    onClick={() => onOpenTable(t.id)}
                  >
                    + Abrir Mesa
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* Tarjeta para agregar mesa rápida */}
        <div
          className="card p-3 transition"
          onClick={() => openTableModal('create')}
          style={{
            border: '2px dashed var(--border-light)',
            background: 'transparent',
            borderRadius: 'var(--radius-xl)',
            aspectRatio: '1.3',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            gap: 8,
            cursor: 'pointer',
            opacity: 0.6,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
        >
          <Plus size={28} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Agregar Mesa</div>
        </div>
      </div>

      {/* ── Pedidos Domicilio/Llevar activos ── */}
      {activeUnpaidOrders.some(o => o.type !== 'local') && (
        <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
          <h4 style={{ fontWeight: 800, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} /> Pedidos para Llevar y Domicilios Activos
          </h4>
          <div className="grid-3">
            {activeUnpaidOrders.filter(o => o.type !== 'local').map(order => (
              <div
                key={order.id}
                className="card p-3 hover:border-accent transition"
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-bold" style={{ textTransform: 'capitalize' }}>
                    {order.type === 'own' ? 'Domicilio Propio' : order.type}
                  </span>
                  <span className="badge badge-warning">Sin Pagar</span>
                </div>
                {order.customerName && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Cliente: {order.customerName}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Hora: {order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : '--:--'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span className="font-bold text-accent">
                    {formatCOP(order.totals?.grandTotal || 0)}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => onLoadOrder(order)}
                    >
                      <Edit3 size={12} /> Editar
                    </button>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => onPayOrder(order)}
                    >
                      <DollarSign size={12} /> Cobrar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal Agregar / Editar Mesa ── */}
      {tableModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {tableModal.mode === 'create' ? '➕ Nueva Mesa' : '✏️ Editar Mesa'}
              </h2>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setTableModal({ isOpen: false, mode: 'create', data: null })}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveTable}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Nombre de la mesa *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tableForm.name}
                    onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                    placeholder="Ej: Mesa 9, Barra 1..."
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Zona *</label>
                    <select
                      className="form-select"
                      value={tableForm.zone}
                      onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
                    >
                      <option value="principal">🪑 Salón Principal</option>
                      <option value="terraza">☀️ Terraza</option>
                      <option value="vip">✨ Zona VIP</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacidad (personas) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={tableForm.capacity}
                      onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
                      min="1"
                      max="30"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Forma visual</label>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    {SHAPES.map(s => (
                      <label
                        key={s.id}
                        className="card"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: 'var(--space-3)',
                          cursor: 'pointer',
                          background: tableForm.shape === s.id ? 'rgba(245,158,11,0.12)' : 'var(--bg-elevated)',
                          border: `2px solid ${tableForm.shape === s.id ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: s.id === 'round' ? 'var(--radius-full)' : 'var(--radius-md)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="shape"
                          value={s.id}
                          checked={tableForm.shape === s.id}
                          onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value })}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: 28, height: 28,
                          borderRadius: s.id === 'round' ? '50%' : 4,
                          border: `2px solid ${tableForm.shape === s.id ? 'var(--accent)' : 'var(--text-muted)'}`,
                        }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setTableModal({ isOpen: false, mode: 'create', data: null })}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} /> {tableModal.mode === 'create' ? 'Crear Mesa' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
