import { useState, useMemo } from 'react';
import { 
  X, DollarSign, CreditCard, Smartphone, Gift, 
  Search, UserPlus, Check, UserCheck, Star, Sparkles 
} from 'lucide-react';
import { formatCOP, parseCOP } from '../../utils/currency';
import { useLoyaltyStore } from '../../store/loyaltyStore';

const BASE_PAYMENT_METHODS = [
  { id: 'cash',      label: 'Efectivo',   icon: '💵' },
  { id: 'card',      label: 'Tarjeta',    icon: '💳' },
  { id: 'nequi',     label: 'Nequi',      icon: '📱' },
  { id: 'daviplata', label: 'Daviplata',  icon: '📲' },
];

export default function PaymentModal({ totals, customerId, onClose, onConfirm }) {
  const { customers, settings, addCustomer } = useLoyaltyStore();
  
  // Estado del cliente seleccionado (puede inicializarse con el que venía del pedido o cambiarse)
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Registro rápido de cliente dentro del modal de cobro
  const [isRegistering, setIsRegistering] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: '', phone: '', email: '' });

  const activeCustomer = useMemo(() => {
    return selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;
  }, [selectedCustomerId, customers]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [searchQuery, customers]);

  const paymentMethods = useMemo(() => [
    ...BASE_PAYMENT_METHODS,
    ...(activeCustomer && settings.isActive ? [{ id: 'points', label: 'Puntos Club', icon: '🎁' }] : [])
  ], [activeCustomer, settings.isActive]);

  const [payments, setPayments] = useState([{ method: 'cash', amount: totals.grandTotal, ref: '' }]);
  const [cashReceived, setCashReceived] = useState('');

  // Validación de puntos
  const pointsPayment = payments.find(p => p.method === 'points');
  const pointsAmount = pointsPayment ? Number(pointsPayment.amount) || 0 : 0;
  const pointsCost = Math.round(pointsAmount / settings.redemptionRate);
  const customerHasEnoughPoints = activeCustomer ? activeCustomer.points >= pointsCost : true;

  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const change    = payments.find((p) => p.method === 'cash')
    ? (Number(cashReceived) || 0) - (totals.grandTotal - (payments.filter(p => p.method !== 'cash').reduce((sum, p) => sum + (Number(p.amount) || 0), 0)))
    : 0;
  const isValid   = totalPaid >= totals.grandTotal && customerHasEnoughPoints;

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

  const handleSelectCustomer = (cust) => {
    setSelectedCustomerId(cust.id);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleRegisterCustomer = (e) => {
    e.preventDefault();
    if (!quickForm.name || !quickForm.phone) {
      alert('Nombre y Teléfono son requeridos.');
      return;
    }
    try {
      addCustomer({
        name: quickForm.name.trim(),
        phone: quickForm.phone.trim(),
        email: quickForm.email.trim(),
        points: 0
      });
      // Buscar cliente recién agregado
      const created = useLoyaltyStore.getState().customers.find(c => c.phone === quickForm.phone.trim());
      if (created) {
        setSelectedCustomerId(created.id);
      }
      setIsRegistering(false);
      setQuickForm({ name: '', phone: '', email: '' });
      setSearchQuery('');
    } catch (err) {
      alert(err.message || 'Error al registrar cliente.');
    }
  };

  // Pagar con el máximo de puntos posible
  const handleUseMaxPoints = () => {
    if (!activeCustomer || !settings.isActive) return;
    const maxPointsValue = activeCustomer.points * settings.redemptionRate;
    const amountToCover = Math.min(totals.grandTotal, maxPointsValue);
    
    if (amountToCover <= 0) {
      alert('El cliente no tiene puntos disponibles para canjear.');
      return;
    }

    // Configurar el pago con puntos
    const remaining = totals.grandTotal - amountToCover;
    const newPayments = [{ method: 'points', amount: amountToCover, ref: 'Puntos Club' }];
    if (remaining > 0) {
      newPayments.push({ method: 'cash', amount: remaining, ref: '' });
    }
    setPayments(newPayments);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div className="modal modal-md" style={{ maxWidth: 540, width: '95%' }}>
        <div className="modal-header">
          <h3 className="modal-title flex items-center gap-2">
            <DollarSign size={20} className="text-accent" /> Cobro del Pedido
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* ── SECCIÓN DE FIDELIZACIÓN DE CLIENTE (CLUB PALADAR) ── */}
          {settings.isActive && (
            <div style={{
              background: activeCustomer ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)',
              border: `1.5px solid ${activeCustomer ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              transition: 'all 0.2s ease'
            }}>
              {activeCustomer ? (
                /* Cliente ya asociado */
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))',
                      color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1rem'
                    }}>
                      ⭐
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {activeCustomer.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        📞 {activeCustomer.phone} · <strong style={{ color: 'var(--green-400)' }}>{activeCustomer.points} pts</strong> (${formatCOP(activeCustomer.points * settings.redemptionRate)})
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {activeCustomer.points > 0 && (
                      <button 
                        type="button" 
                        className="btn btn-xs btn-primary"
                        onClick={handleUseMaxPoints}
                        title="Canjear puntos en este cobro"
                      >
                        🎁 Usar Puntos
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn btn-xs btn-ghost"
                      onClick={() => setSelectedCustomerId(null)}
                      title="Cambiar cliente"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : isRegistering ? (
                /* Formulario de registro rápido en línea */
                <form onSubmit={handleRegisterCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent)' }}>
                      👤 Registro Rápido para Fidelización
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm btn-icon" 
                      onClick={() => setIsRegistering(false)}
                      style={{ padding: 2, height: 22, width: 22 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid-2">
                    <input 
                      type="text" 
                      className="form-input text-xs" 
                      placeholder="Nombre del cliente *" 
                      value={quickForm.name} 
                      onChange={e => setQuickForm({ ...quickForm, name: e.target.value })} 
                      required 
                    />
                    <input 
                      type="text" 
                      className="form-input text-xs" 
                      placeholder="Teléfono / Celular *" 
                      value={quickForm.phone} 
                      onChange={e => setQuickForm({ ...quickForm, phone: e.target.value })} 
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-xs btn-ghost" onClick={() => setIsRegistering(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-xs btn-primary font-bold">
                      ✅ Registrar y Asociar
                    </button>
                  </div>
                </form>
              ) : (
                /* Buscador de cliente o botón de registrar */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      ⭐ Club de Fidelización (Acumular / Redimir)
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-xs btn-ghost text-accent font-bold"
                      onClick={() => setIsRegistering(true)}
                    >
                      <UserPlus size={12} /> + Nuevo Cliente
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      className="form-input text-xs"
                      style={{ paddingLeft: '2rem', width: '100%' }}
                      placeholder="Buscar cliente por nombre o celular..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                    />

                    {/* Dropdown de resultados */}
                    {showSearchResults && searchQuery.trim().length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', zIndex: 100, marginTop: 4,
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)', maxHeight: 180, overflowY: 'auto'
                      }}>
                        {filteredCustomers.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => handleSelectCustomer(c)}
                            style={{
                              padding: '8px 12px', borderBottom: '1px solid var(--border-light)',
                              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {c.phone}</div>
                            </div>
                            <span className="badge badge-warning text-xs font-bold">
                              {c.points} pts
                            </span>
                          </div>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            No se encontró el cliente.{' '}
                            <span 
                              style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => {
                                setQuickForm({ name: '', phone: searchQuery, email: '' });
                                setIsRegistering(true);
                                setShowSearchResults(false);
                              }}
                            >
                              ¿Registrar ahora?
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESUMEN DE TOTALES ── */}
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
              <span>TOTAL A PAGAR</span>
              <span style={{ color: 'var(--accent)' }}>{formatCOP(totals.grandTotal)}</span>
            </div>
          </div>

          {/* ── MÉTODOS DE PAGO ── */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: '0.88rem' }}>
              Formas de Pago
            </div>
            
            {payments.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ width: 140 }}
                  value={p.method}
                  onChange={(e) => updatePayment(idx, 'method', e.target.value)}
                >
                  {paymentMethods.map((m) => (
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

          {/* Detalles de puntos club si se seleccionó como método */}
          {pointsPayment && activeCustomer && (
            <div style={{ 
              background: customerHasEnoughPoints ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', 
              border: `1px solid ${customerHasEnoughPoints ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ fontWeight: 700, color: customerHasEnoughPoints ? 'var(--green-400)' : 'var(--red-400)' }}>
                🎁 Canje de Puntos Club
              </div>
              <div>
                Monto a pagar con puntos: <strong>{formatCOP(pointsAmount)}</strong>
              </div>
              <div>
                Costo en puntos: <strong>{pointsCost} pts</strong> (Saldo: {activeCustomer.points} pts)
              </div>
              {!customerHasEnoughPoints && (
                <div style={{ color: 'var(--red-400)', fontWeight: 700, marginTop: 4 }}>
                  ⚠️ ¡El cliente no tiene puntos suficientes para este monto!
                </div>
              )}
            </div>
          )}

          {/* Efectivo recibido / cambio */}
          {payments.some((p) => p.method === 'cash') && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 120 }}>Efectivo recibido:</label>
                <input
                  className="form-input font-bold"
                  type="number"
                  placeholder="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  style={{ flex: 1, fontSize: '1.05rem' }}
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

          {/* Pendiente de cobro */}
          {totalPaid < totals.grandTotal && (
            <div className="alert alert-warning mt-3" style={{ marginTop: 12 }}>
              Pendiente de cubrir: <strong>{formatCOP(totals.grandTotal - totalPaid)}</strong>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary btn-lg font-bold"
            onClick={() => onConfirm(payments, selectedCustomerId)}
            disabled={!isValid}
          >
            ✅ Confirmar Cobro ({formatCOP(totals.grandTotal)})
          </button>
        </div>
      </div>
    </div>
  );
}
