import { useState } from 'react';
import { X, Calculator, Printer, CheckCircle } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { useOrdersStore } from '../../store/ordersStore';
import { useFinanceStore } from '../../store/financeStore';
import { useStaffStore } from '../../store/staffStore';

function fmtCOP(num) {
  const n = Number(num);
  if (isNaN(n)) return '$ 0';
  return '$ ' + Math.round(n).toLocaleString('es-CO');
}

const PAYMENT_METHODS = [
  { id: 'cash',       label: '💵 Efectivo',   color: '#f59e0b' },
  { id: 'card',       label: '💳 Tarjeta',    color: '#3b82f6' },
  { id: 'nequi',      label: '📱 Nequi',      color: '#8b5cf6' },
  { id: 'daviplata',  label: '📲 Daviplata',  color: '#10b981' },
];

export default function CashCloseModal({ onClose }) {
  const cashSession    = usePosStore((s) => s.cashSession);
  const closeSession   = usePosStore((s) => s.closeCashSession);
  const openSession    = usePosStore((s) => s.openCashSession);
  const orders         = useOrdersStore((s) => s.orders);
  const addCashClosing = useFinanceStore((s) => s.addCashClosing);
  const dailyPurchases = useFinanceStore((s) => s.dailyPurchases);
  const staff          = useStaffStore((s) => s.staff);

  const [step, setStep]               = useState(cashSession ? 'close' : 'open');
  const [openingBase, setOpeningBase] = useState('100000');
  const [selectedStaff, setSelectedStaff] = useState(cashSession?.openedBy || '');
  const [closed, setClosed]           = useState(false);
  const [closingData, setClosingData] = useState(null);

  // Conteos ingresados por el cajero para cada método
  const [counted, setCounted] = useState({
    cash: '',
    card: '',
    nequi: '',
    daviplata: '',
  });

  /* ── Calcular ventas del día ── */
  const today = new Date().toISOString().split('T')[0];

  const todaysOrders = (orders || []).filter(
    (o) => o.createdAt?.startsWith(today) && o.paymentStatus === 'paid'
  );

  const salesByMethod = { cash: 0, card: 0, nequi: 0, daviplata: 0 };
  let totalSales = 0;
  let totalTips  = 0;

  todaysOrders.forEach((order) => {
    totalSales += Number(order.totals?.grandTotal) || 0;
    totalTips  += Number(order.tip) || 0;
    (order.payments || []).forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (salesByMethod[p.method] !== undefined) salesByMethod[p.method] += amt;
    });
  });

  const cashExpenses = (dailyPurchases || [])
    .filter((p) => p.date?.startsWith(today) && p.paymentMethod === 'cash')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const initialAmount = Number(cashSession?.initialAmount) || 0;

  // Efectivo esperado = base + ventas efectivo - gastos
  const expectedByMethod = {
    cash:      initialAmount + salesByMethod.cash - cashExpenses,
    card:      salesByMethod.card,
    nequi:     salesByMethod.nequi,
    daviplata: salesByMethod.daviplata,
  };

  // Diferencias por método
  const getDiff = (methodId) => {
    const val = counted[methodId];
    if (val === '' || val === undefined) return null;
    return Number(val) - expectedByMethod[methodId];
  };

  const allEntered = PAYMENT_METHODS.every(m => counted[m.id] !== '');

  /* ── Handlers ── */
  const handleOpen = () => {
    if (!selectedStaff || !openingBase) return;
    openSession(selectedStaff, Number(openingBase));
    onClose();
  };

  const handleClose = () => {
    const sessionOpenedAt  = cashSession?.openedAt       || new Date().toISOString();
    const sessionOpenedBy  = cashSession?.openedBy       || '';
    const sessionInitial   = cashSession?.initialAmount  || 0;

    const countedValues = {
      cash:      Number(counted.cash)      || 0,
      card:      Number(counted.card)      || 0,
      nequi:     Number(counted.nequi)     || 0,
      daviplata: Number(counted.daviplata) || 0,
    };

    const diffs = {
      cash:      countedValues.cash      - expectedByMethod.cash,
      card:      countedValues.card      - expectedByMethod.card,
      nequi:     countedValues.nequi     - expectedByMethod.nequi,
      daviplata: countedValues.daviplata - expectedByMethod.daviplata,
    };

    const data = {
      openedAt:       sessionOpenedAt,
      openedBy:       sessionOpenedBy,
      closedAt:       new Date().toISOString(),
      initialBase:    sessionInitial,
      sales:          { total: totalSales, ...salesByMethod },
      tips:           totalTips,
      cashExpenses,
      expectedByMethod,
      countedByMethod: countedValues,
      diffByMethod:   diffs,
      ordersCount:    todaysOrders.length,
    };

    setClosingData(data);
    setClosed(true);
    setTimeout(() => {
      addCashClosing(data);
      closeSession();
    }, 0);
  };

  const handlePrint = () => {
    if (!closingData) return;
    const cashierName = staff.find((s) => s.id === closingData.openedBy)?.name || closingData.openedBy || 'N/A';
    const openedAt    = new Date(closingData.openedAt).toLocaleString('es-CO');
    const closedAt    = new Date(closingData.closedAt).toLocaleString('es-CO');

    const methodRows = PAYMENT_METHODS.map(m => {
      const expected = closingData.expectedByMethod[m.id] || 0;
      const counted  = closingData.countedByMethod[m.id]  || 0;
      const diff     = closingData.diffByMethod[m.id]     || 0;
      const diffStr  = diff === 0 ? 'CUADRA' : diff > 0 ? `+${fmtCOP(diff)} (Sobrante)` : `${fmtCOP(diff)} (Faltante)`;
      const diffColor = diff === 0 ? 'green' : diff > 0 ? 'orange' : 'red';
      return `
        <tr>
          <td>${m.label}</td>
          <td style="text-align:right">${fmtCOP(expected)}</td>
          <td style="text-align:right">${fmtCOP(counted)}</td>
          <td style="text-align:right; color:${diffColor}; font-weight:bold">${diffStr}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Cierre de Caja — Paladar Grill</title>
<style>
  body { font-family:'Courier New',monospace; font-size:13px; max-width:400px; margin:0 auto; padding:16px; }
  h1 { font-size:16px; text-align:center; }
  .center { text-align:center; }
  .divider { border-top:1px dashed #000; margin:8px 0; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { text-align:left; border-bottom:1px solid #000; padding:3px 0; }
  td { padding:4px 2px; }
  .bold { font-weight:bold; }
</style></head><body>
<h1>PALADAR GRILL</h1>
<p class="center">CIERRE DE CAJA</p>
<p class="center">${closedAt}</p>
<div class="divider"></div>
<div class="bold">Cajero: ${cashierName}</div>
<div>Apertura: ${openedAt}</div>
<div>Pedidos cobrados: ${closingData.ordersCount}</div>
<div class="divider"></div>
<p class="bold">CUADRE POR MÉTODO DE PAGO</p>
<table>
  <tr><th>Método</th><th style="text-align:right">Esperado</th><th style="text-align:right">Contado</th><th style="text-align:right">Diferencia</th></tr>
  ${methodRows}
</table>
<div class="divider"></div>
<div class="bold">Ventas totales del día: ${fmtCOP(closingData.sales.total)}</div>
<div>Propinas: ${fmtCOP(closingData.tips)}</div>
${closingData.cashExpenses > 0 ? `<div>Gastos en efectivo: -${fmtCOP(closingData.cashExpenses)}</div>` : ''}
<div class="divider"></div>
<p class="center" style="font-size:11px;">Generado por POS Paladar Grill</p>
</body></html>`;

    const win = window.open('', '_blank', 'width=450,height=650');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  /* ── PANTALLA DE ÉXITO ── */
  if (closed && closingData) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ maxWidth: 420 }}>
          <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>¡Caja Cerrada!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>El reporte ha sido guardado en Finanzas.</p>

            {/* Resumen de diferencias */}
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              {PAYMENT_METHODS.map(m => {
                const diff = closingData.diffByMethod[m.id];
                const diffColor = diff === 0 ? '#22c55e' : diff > 0 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <span>{m.label}</span>
                    <span style={{ fontWeight: 700, color: diffColor }}>
                      {diff === 0 ? '✔ Cuadra' : diff > 0 ? `+${fmtCOP(diff)} Sobrante` : `${fmtCOP(diff)} Faltante`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <Printer size={16} /> Imprimir Reporte
              </button>
              <button className="btn btn-primary" onClick={onClose}>Finalizar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── FORMULARIO PRINCIPAL ── */
  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 'open' ? '🟢 Abrir Caja' : '🔴 Cierre de Caja'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {step === 'open' ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Cajero responsable del turno</label>
                <select
                  className="form-select w-full"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {(staff || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Base inicial (Efectivo en caja)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input w-full"
                  value={openingBase}
                  onChange={(e) => setOpeningBase(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej: 100000"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">

              {/* Resumen del día */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="card p-3 border-light">
                  <div className="text-xs text-muted mb-1">Base Inicial</div>
                  <div className="font-bold">{fmtCOP(initialAmount)}</div>
                </div>
                <div className="card p-3 border-light">
                  <div className="text-xs text-muted mb-1">Pedidos Cobrados Hoy</div>
                  <div className="font-bold">{todaysOrders.length}</div>
                </div>
              </div>

              {/* Ventas esperadas por método */}
              <div className="card p-3 border-light">
                <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-muted)' }}>
                  Ventas del Sistema (esperado)
                </div>
                {PAYMENT_METHODS.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem' }}>
                    <span>{m.label}</span>
                    <span style={{ fontWeight: 700 }}>{fmtCOP(expectedByMethod[m.id])}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span>Total ventas</span>
                  <span style={{ color: 'var(--accent)' }}>{fmtCOP(totalSales)}</span>
                </div>
              </div>

              {/* Ingreso de lo contado por método */}
              <div className="card p-3 border-light">
                <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-muted)' }}>
                  <Calculator size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Ingrese lo contado por cada método
                </div>
                {PAYMENT_METHODS.map(m => {
                  const diff = getDiff(m.id);
                  const diffColor = diff === null ? 'var(--text-muted)' : diff === 0 ? '#22c55e' : diff > 0 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={m.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.label}</label>
                        {diff !== null && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: diffColor }}>
                            {diff === 0 ? '✔ Cuadra' : diff > 0 ? `+${fmtCOP(diff)} Sobrante` : `${fmtCOP(diff)} Faltante`}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-input w-full"
                        placeholder={`Esperado: ${fmtCOP(expectedByMethod[m.id])}`}
                        value={counted[m.id]}
                        autoComplete="off"
                        onChange={(e) => setCounted(prev => ({
                          ...prev,
                          [m.id]: e.target.value.replace(/[^0-9]/g, '')
                        }))}
                      />
                    </div>
                  );
                })}
              </div>

              {cashExpenses > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.9rem' }}>
                  ⚠️ Gastos en efectivo del día: <strong>-{fmtCOP(cashExpenses)}</strong> (ya descontados del esperado en efectivo)
                </div>
              )}

              {!allEntered && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Ingrese todos los valores para habilitar el cierre
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {step === 'open' ? (
            <button
              className="btn btn-primary"
              onClick={handleOpen}
              disabled={!selectedStaff || !openingBase}
            >
              🟢 Abrir Turno
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={handleClose}
              disabled={!allEntered}
            >
              🔴 Confirmar Cierre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
