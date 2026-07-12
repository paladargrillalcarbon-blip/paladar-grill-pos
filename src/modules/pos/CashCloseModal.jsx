import { useState, useMemo } from 'react';
import { X, Calculator, Printer, CheckCircle } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { useOrdersStore } from '../../store/ordersStore';
import { useFinanceStore } from '../../store/financeStore';
import { useStaffStore } from '../../store/staffStore';
import { formatCOP } from '../../utils/currency';

export default function CashCloseModal({ onClose }) {
  const cashSession    = usePosStore((s) => s.cashSession);
  const closeSession   = usePosStore((s) => s.closeCashSession);
  const openSession    = usePosStore((s) => s.openCashSession);
  const orders         = useOrdersStore((s) => s.orders);
  const addCashClosing = useFinanceStore((s) => s.addCashClosing);
  const dailyPurchases = useFinanceStore((s) => s.dailyPurchases);
  const staff          = useStaffStore((s) => s.staff);

  const [step, setStep]               = useState(cashSession ? 'close' : 'open');
  const [openingBase, setOpeningBase]  = useState('100000');
  const [selectedStaff, setSelectedStaff] = useState(cashSession?.openedBy || '');
  const [countedCash, setCountedCash]  = useState('');
  const [closed, setClosed]            = useState(false);
  const [closingData, setClosingData]  = useState(null);

  const todaysCompletedOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(o =>
      o.createdAt.startsWith(today) && o.paymentStatus === 'paid'
    );
  }, [orders]);

  // Compras/gastos del dia pagados en efectivo
  const todayCashExpenses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyPurchases
      .filter(p => p.date.startsWith(today) && p.paymentMethod === 'cash')
      .reduce((s, p) => s + p.amount, 0);
  }, [dailyPurchases]);

  const stats = useMemo(() => {
    let cash = 0, card = 0, nequi = 0, daviplata = 0, totalSales = 0, totalTips = 0;
    todaysCompletedOrders.forEach(order => {
      totalSales += order.totals?.grandTotal || 0;
      totalTips  += order.tip || 0;
      (order.payments || []).forEach(p => {
        const amount = Number(p.amount) || 0;
        if (p.method === 'cash')      cash      += amount;
        if (p.method === 'card')      card      += amount;
        if (p.method === 'nequi')     nequi     += amount;
        if (p.method === 'daviplata') daviplata += amount;
      });
    });
    // Efectivo esperado = base + ventas efectivo - gastos pagados en efectivo
    const expectedCash = (cashSession?.initialAmount || 0) + cash - todayCashExpenses;
    const diff = (Number(countedCash) || 0) - expectedCash;
    return { cash, card, nequi, daviplata, totalSales, totalTips, expectedCash, diff };
  }, [todaysCompletedOrders, cashSession, countedCash, todayCashExpenses]);

  const handleOpen = () => {
    if (!selectedStaff || !openingBase) return;
    openSession(selectedStaff, Number(openingBase));
    onClose();
  };

  const handleClose = () => {
    const data = {
      openedAt:     cashSession.openedAt,
      openedBy:     cashSession.openedBy,
      closedAt:     new Date().toISOString(),
      initialBase:  cashSession.initialAmount,
      sales: {
        total:      stats.totalSales,
        cash:       stats.cash,
        card:       stats.card,
        nequi:      stats.nequi,
        daviplata:  stats.daviplata,
      },
      tips:           stats.totalTips,
      cashExpenses:   todayCashExpenses,
      expectedCash:   stats.expectedCash,
      countedCash:    Number(countedCash),
      difference:     stats.diff,
      ordersCount:    todaysCompletedOrders.length,
    };
    addCashClosing(data);
    closeSession();
    setClosingData(data);
    setClosed(true);
  };

  const handlePrint = () => {
    if (!closingData) return;
    const cashierName = staff.find(s => s.id === closingData.openedBy)?.name || closingData.openedBy || 'N/A';
    const openedAt  = new Date(closingData.openedAt).toLocaleString('es-CO');
    const closedAt  = new Date(closingData.closedAt).toLocaleString('es-CO');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>Cierre de Caja — Paladar Grill</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; max-width: 320px; margin: 0 auto; padding: 16px; }
          h1   { font-size: 16px; text-align: center; margin-bottom: 4px; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .bold { font-weight: bold; }
          .big  { font-size: 15px; font-weight: bold; }
          .red  { color: red; }
          .diff-ok  { color: green; }
          .diff-bad { color: red; }
        </style>
      </head>
      <body>
        <h1>PALADAR GRILL</h1>
        <p class="center">CIERRE DE CAJA</p>
        <p class="center">${closedAt}</p>
        <div class="divider"></div>
        <div class="row"><span>Cajero:</span><span>${cashierName}</span></div>
        <div class="row"><span>Apertura:</span><span>${openedAt}</span></div>
        <div class="row"><span>Pedidos cobrados:</span><span>${closingData.ordersCount}</span></div>
        <div class="divider"></div>
        <p class="bold">VENTAS POR MÉTODO</p>
        <div class="row"><span>Efectivo:</span><span>${formatCOP(closingData.sales.cash)}</span></div>
        <div class="row"><span>Tarjeta:</span><span>${formatCOP(closingData.sales.card)}</span></div>
        <div class="row"><span>Nequi:</span><span>${formatCOP(closingData.sales.nequi)}</span></div>
        <div class="row"><span>Daviplata:</span><span>${formatCOP(closingData.sales.daviplata)}</span></div>
        <div class="divider"></div>
        <div class="row bold"><span>TOTAL VENTAS:</span><span>${formatCOP(closingData.sales.total)}</span></div>
        <div class="row"><span>Propinas:</span><span>${formatCOP(closingData.tips)}</span></div>
        ${closingData.cashExpenses > 0 ? `
        <div class="divider"></div>
        <p class="bold">GASTOS PAGADOS EN EFECTIVO</p>
        <div class="row red"><span>Compras / Gastos del día:</span><span>- ${formatCOP(closingData.cashExpenses)}</span></div>
        ` : ''}
        <div class="divider"></div>
        <p class="bold">CUADRE DE CAJA</p>
        <div class="row"><span>Base inicial:</span><span>${formatCOP(closingData.initialBase)}</span></div>
        <div class="row"><span>+ Ventas efectivo:</span><span>${formatCOP(closingData.sales.cash)}</span></div>
        ${closingData.cashExpenses > 0 ? `<div class="row red"><span>- Gastos efectivo:</span><span>-${formatCOP(closingData.cashExpenses)}</span></div>` : ''}
        <div class="row bold"><span>= Efectivo esperado:</span><span>${formatCOP(closingData.expectedCash)}</span></div>
        <div class="row"><span>Efectivo contado:</span><span>${formatCOP(closingData.countedCash)}</span></div>
        <div class="divider"></div>
        <div class="row big ${closingData.difference === 0 ? 'diff-ok' : 'diff-bad'}">
          <span>DIFERENCIA:</span>
          <span>${formatCOP(closingData.difference)} ${closingData.difference > 0 ? '(Sobrante)' : closingData.difference < 0 ? '(Faltante)' : '✔ Cuadre Perfecto'}</span>
        </div>
        <div class="divider"></div>
        <p class="center" style="font-size:11px;">Generado por POS Paladar Grill</p>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=400,height=650');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  /* ── PANTALLA DE ÉXITO ── */
  if (closed) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ maxWidth: 380 }}>
          <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
            <h2 className="text-xl font-bold mb-2">¡Caja Cerrada!</h2>
            <p className="text-muted mb-6">El reporte ha sido guardado en Finanzas.</p>
            <div className="flex gap-2 justify-center">
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
      <div className="modal-content" style={{ maxWidth: 480 }}>
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
                  onChange={e => setSelectedStaff(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Base inicial (Efectivo en caja)</label>
                <input
                  type="number"
                  className="form-input w-full"
                  value={openingBase}
                  onChange={e => setOpeningBase(e.target.value)}
                  placeholder="Ej: 100000"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid-2">
                <div className="card p-3 border-light">
                  <div className="text-xs text-muted mb-1">Base Inicial</div>
                  <div className="font-bold">{formatCOP(cashSession?.initialAmount)}</div>
                </div>
                <div className="card p-3 border-light">
                  <div className="text-xs text-muted mb-1">Pedidos Cobrados Hoy</div>
                  <div className="font-bold">{todaysCompletedOrders.length}</div>
                </div>
              </div>

              <div className="card p-3 border-light">
                <div className="text-xs text-muted font-bold uppercase mb-2">Ventas por Método de Pago</div>
                <div className="flex justify-between text-sm py-1"><span>💵 Efectivo</span><span className="font-bold">{formatCOP(stats.cash)}</span></div>
                <div className="flex justify-between text-sm py-1"><span>💳 Tarjeta</span><span className="font-bold">{formatCOP(stats.card)}</span></div>
                <div className="flex justify-between text-sm py-1"><span>📱 Nequi</span><span className="font-bold">{formatCOP(stats.nequi)}</span></div>
                <div className="flex justify-between text-sm py-1"><span>📲 Daviplata</span><span className="font-bold">{formatCOP(stats.daviplata)}</span></div>
                <div className="border-t border-border mt-2 pt-2 flex justify-between font-extrabold">
                  <span>Total Ventas</span>
                  <span className="text-accent">{formatCOP(stats.totalSales)}</span>
                </div>
              </div>

              <div className="card p-3 border-light">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Efectivo esperado en caja</span>
                  <span className="font-bold text-accent">{formatCOP(stats.expectedCash)}</span>
                </div>
                <div className="text-xs text-muted mt-1">
                  Base inicial + ventas efectivo{todayCashExpenses > 0 ? ` − gastos efectivo (${formatCOP(todayCashExpenses)})` : ''}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">
                  <Calculator size={13} className="inline mr-1" />
                  Efectivo Real Contado
                </label>
                <input
                  type="number"
                  className="form-input w-full"
                  placeholder="Ingrese el dinero físico en caja..."
                  value={countedCash}
                  onChange={e => setCountedCash(e.target.value)}
                />
              </div>

              {countedCash && (
                <div className={`card p-3 border-light text-center font-bold ${stats.diff === 0 ? 'text-success' : stats.diff > 0 ? 'text-warning' : 'text-danger'}`}>
                  Diferencia: {formatCOP(stats.diff)}{' '}
                  {stats.diff > 0 ? '(Sobrante)' : stats.diff < 0 ? '(Faltante)' : '✔ Cuadre Perfecto'}
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
              disabled={!countedCash}
            >
              🔴 Confirmar Cierre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
