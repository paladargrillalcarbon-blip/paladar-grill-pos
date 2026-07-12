import { useState, useMemo } from 'react';
import { Plus, Trash2, DollarSign, Building2, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../../store/financeStore';
import { formatCOP } from '../../utils/currency';

const CATEGORIES = [
  'Materia Prima / Ingredientes',
  'Servicios (Gas, Agua, Luz)',
  'Arriendo / Local',
  'Transporte / Domicilios',
  'Nómina / Personal',
  'Mantenimiento / Reparaciones',
  'Papelería / Insumos Oficina',
  'Publicidad / Marketing',
  'Otro',
];

export default function DailyPurchases() {
  const { dailyPurchases, addDailyPurchase, deleteDailyPurchase } = useFinanceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    concept: '',
    amount: '',
    paymentMethod: 'cash',
    category: CATEGORIES[0],
    notes: '',
  });

  // Solo compras del día de hoy
  const today = new Date().toISOString().split('T')[0];
  const todaysPurchases = useMemo(
    () => dailyPurchases.filter(p => p.date.startsWith(today)),
    [dailyPurchases, today]
  );

  const totals = useMemo(() => {
    const cash = todaysPurchases.filter(p => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0);
    const bank = todaysPurchases.filter(p => p.paymentMethod === 'bank').reduce((s, p) => s + p.amount, 0);
    const nequi = todaysPurchases.filter(p => p.paymentMethod === 'nequi').reduce((s, p) => s + p.amount, 0);
    return { cash, bank, nequi, total: cash + bank + nequi };
  }, [todaysPurchases]);

  const handleSave = () => {
    if (!form.concept || !form.amount || form.amount <= 0) return;
    addDailyPurchase({ ...form, amount: Number(form.amount) });
    setForm({ concept: '', amount: '', paymentMethod: 'cash', category: CATEGORIES[0], notes: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este gasto?')) deleteDailyPurchase(id);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compras y Gastos del Día</h1>
          <p className="page-subtitle">
            Registra cada gasto diario indicando si se pagó en efectivo (sale de caja) o por banco
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Registrar Gasto
        </button>
      </div>

      {/* Resumen por método */}
      <div className="grid-3 mb-6">
        <div className="card p-4 border-light">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-danger/10 text-danger"><DollarSign size={20} /></div>
            <div>
              <div className="text-sm text-muted">Pagado en Efectivo</div>
              <div className="text-xs text-muted">(Sale de la caja)</div>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-danger">{formatCOP(totals.cash)}</div>
        </div>
        <div className="card p-4 border-light">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-900/20 text-blue-400"><Building2 size={20} /></div>
            <div>
              <div className="text-sm text-muted">Pagado por Banco</div>
              <div className="text-xs text-muted">(No afecta caja)</div>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-400">{formatCOP(totals.bank)}</div>
        </div>
        <div className="card p-4 border-light">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10 text-accent"><DollarSign size={20} /></div>
            <div>
              <div className="text-sm text-muted">Total Gastos Hoy</div>
              <div className="text-xs text-muted">(Todos los métodos)</div>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-accent">{formatCOP(totals.total)}</div>
        </div>
      </div>

      {/* Alerta si hay gastos en efectivo */}
      {totals.cash > 0 && (
        <div className="card p-3 border-light mb-4 flex items-center gap-3" style={{ borderColor: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }}>
          <AlertCircle size={18} className="text-danger flex-shrink-0" />
          <span className="text-sm">
            <strong className="text-danger">{formatCOP(totals.cash)}</strong> en gastos de efectivo serán descontados del efectivo esperado al hacer el <strong>cierre de caja</strong>.
          </span>
        </div>
      )}

      {/* Lista de compras del día */}
      <div className="card">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-lg">Registro de Hoy</h2>
          <span className="text-sm text-muted">{todaysPurchases.length} gastos registrados</span>
        </div>
        {todaysPurchases.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <div className="text-4xl mb-3">🧾</div>
            <div>No hay gastos registrados hoy.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Método de Pago</th>
                  <th>Hora</th>
                  <th>Notas</th>
                  <th className="text-right">Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {todaysPurchases.map(p => (
                  <tr key={p.id}>
                    <td className="font-bold">{p.concept}</td>
                    <td className="text-muted text-sm">{p.category}</td>
                    <td>
                      {p.paymentMethod === 'cash' && (
                        <span className="badge badge-danger">💵 Efectivo (Caja)</span>
                      )}
                      {p.paymentMethod === 'bank' && (
                        <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>🏦 Banco/Transf.</span>
                      )}
                      {p.paymentMethod === 'nequi' && (
                        <span className="badge badge-warning">📱 Nequi/Digital</span>
                      )}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(p.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="text-muted text-sm">{p.notes || '—'}</td>
                    <td className="text-right font-bold text-danger">{formatCOP(p.amount)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="font-bold text-right text-muted">Totales del día:</td>
                  <td className="text-right font-extrabold text-accent">{formatCOP(totals.total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar Gasto / Compra</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">

              <div>
                <label className="block text-sm font-bold mb-1">Concepto / Descripción *</label>
                <input
                  className="form-input w-full"
                  value={form.concept}
                  onChange={e => setForm({ ...form, concept: e.target.value })}
                  placeholder="Ej: Compra de carne, Pago de gas..."
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Categoría</label>
                  <select
                    className="form-select w-full"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Monto (COP) *</label>
                  <input
                    type="number"
                    className="form-input w-full"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Método de Pago *</label>
                <div className="flex gap-2">
                  {[
                    { id: 'cash',  label: '💵 Efectivo (Caja)',    desc: 'Descuenta del cierre' },
                    { id: 'bank',  label: '🏦 Banco / Transf.',   desc: 'No afecta caja' },
                    { id: 'nequi', label: '📱 Nequi / Digital',   desc: 'No afecta caja' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: m.id })}
                      className={`card p-3 flex-1 text-left transition ${form.paymentMethod === m.id ? 'border-accent' : 'border-light'}`}
                      style={{ border: `2px solid ${form.paymentMethod === m.id ? 'var(--accent)' : 'var(--border)'}` }}
                    >
                      <div className="font-bold text-sm">{m.label}</div>
                      <div className="text-xs text-muted mt-1">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Notas (Opcional)</label>
                <input
                  className="form-input w-full"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ej: Factura #1234, nombre del proveedor..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!form.concept || !form.amount || form.amount <= 0}
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
