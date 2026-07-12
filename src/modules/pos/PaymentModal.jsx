import { useState } from 'react';
import { X, DollarSign, CreditCard, Smartphone } from 'lucide-react';
import { formatCOP, parseCOP } from '../../utils/currency';

const PAYMENT_METHODS = [
  { id: 'cash',      label: 'Efectivo',   icon: '💵' },
  { id: 'card',      label: 'Tarjeta',    icon: '💳' },
  { id: 'nequi',     label: 'Nequi',      icon: '📱' },
  { id: 'daviplata', label: 'Daviplata',  icon: '📲' },
];

export default function PaymentModal({ totals, onClose, onConfirm }) {
  const [payments, setPayments] = useState([{ method: 'cash', amount: totals.grandTotal, ref: '' }]);
  const [cashReceived, setCashReceived] = useState('');

  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const change    = payments.find((p) => p.method === 'cash')
    ? (Number(cashReceived) || 0) - totals.grandTotal
    : 0;
  const isValid   = totalPaid >= totals.grandTotal;

  const addPayment = () => {
    const remaining = totals.grandTotal - totalPaid;
    setPayments((prev) => [...prev, { method: 'card', amount: Math.max(0, remaining), ref: '' }]);
  };

  const updatePayment = (idx, field, value) => {
    setPayments((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removePayment = (idx) => {
    if (payments.length === 1) return;
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-md">
        <div className="modal-header">
          <h3 className="modal-title">💳 Cobro del Pedido</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Resumen */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span>Venta neta</span><span>{formatCOP(totals.netTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>Impoconsumo (8%)</span><span>{formatCOP(totals.impoconsumo)}</span>
            </div>
            {totals.totalDiscounts > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--red-400)', marginBottom: 8 }}>
                <span>Descuentos</span><span>- {formatCOP(totals.totalDiscounts)}</span>
              </div>
            )}
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.3rem' }}>
              <span>TOTAL</span>
              <span style={{ color: 'var(--accent)' }}>{formatCOP(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Métodos de pago */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)', fontSize: '0.9rem' }}>Método de Pago</div>
            {payments.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ width: 140 }}
                  value={p.method}
                  onChange={(e) => updatePayment(idx, 'method', e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                  ))}
                </select>

                <input
                  className="form-input"
                  type="number"
                  placeholder="Monto"
                  value={p.amount}
                  onChange={(e) => updatePayment(idx, 'amount', e.target.value)}
                  style={{ flex: 1 }}
                />

                {(p.method === 'nequi' || p.method === 'daviplata' || p.method === 'card') && (
                  <input
                    className="form-input"
                    placeholder="Referencia"
                    value={p.ref}
                    onChange={(e) => updatePayment(idx, 'ref', e.target.value)}
                    style={{ flex: 1 }}
                  />
                )}

                {idx > 0 && (
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => removePayment(idx)}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

            <button className="btn btn-ghost btn-sm" onClick={addPayment} style={{ marginTop: 4 }}>
              + Agregar otro método (pago mixto)
            </button>
          </div>

          {/* Efectivo recibido / cambio */}
          {payments.some((p) => p.method === 'cash') && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 120 }}>Efectivo recibido:</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              {cashReceived && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem' }}>
                  <span>Cambio a devolver:</span>
                  <span style={{ color: change >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>
                    {formatCOP(Math.max(0, change))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pendiente */}
          {totalPaid < totals.grandTotal && (
            <div className="alert alert-warning mt-3" style={{ marginTop: 12 }}>
              Pendiente de cobro: {formatCOP(totals.grandTotal - totalPaid)}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onConfirm(payments)}
            disabled={!isValid}
          >
            ✅ Confirmar Cobro
          </button>
        </div>
      </div>
    </div>
  );
}
