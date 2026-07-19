import { useState } from 'react';
import { X, Calculator, Printer, CheckCircle } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { useOrdersStore } from '../../store/ordersStore';
import { useFinanceStore } from '../../store/financeStore';
import { useStaffStore } from '../../store/staffStore';
import { formatCOP } from '../../utils/currency';

// Formatea número con puntos de miles al estilo colombiano
function fmtCOP(num) {
  if (isNaN(num) || num === null || num === undefined) return '$ 0';
  return '$ ' + Math.round(num).toLocaleString('es-CO');
}

export default function CashCloseModal({ onClose }) {
  const cashSession    = usePosStore((s) => s.cashSession);
  const closeSession   = usePosStore((s) => s.closeCashSession);
  const openSession    = usePosStore((s) => s.openCashSession);
  const orders         = useOrdersStore((s) => s.orders);
  const addCashClosing = useFinanceStore((s) => s.addCashClosing);
  const dailyPurchases = useFinanceStore((s) => s.dailyPurchases);
  const staff          = useStaffStore((s) => s.staff);

  const [step, setStep]                   = useState(cashSession ? 'close' : 'open');
  const [openingBase, setOpeningBase]     = useState('100000');
  const [selectedStaff, setSelectedStaff] = useState(cashSession?.openedBy || '');
  // rawCash guarda SOLO dígitos, ej: "100000"
  const [rawCash, setRawCash]             = useState('');
  const [closed, setClosed]               = useState(false);
  const [closingData, setClosingData]     = useState(null);

  /* ── Calcular ventas del día ── */
  const today = new Date().toISOString().split('T')[0];

  const todaysOrders = orders.filter(
    (o) => o.createdAt?.startsWith(today) && o.paymentStatus === 'paid'
  );

  let salesCash = 0, salesCard = 0, salesNequi = 0, salesDaviplata = 0, totalSales = 0, totalTips = 0;
  todaysOrders.forEach((order) => {
    totalSales += Number(order.totals?.grandTotal) || 0;
    totalTips  += Number(order.tip) || 0;
    (order.payments || []).forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.method === 'cash')      salesCash      += amt;
      if (p.method === 'card')      salesCard      += amt;
      if (p.method === 'nequi')     salesNequi     += amt;
      if (p.method === 'daviplata') salesDaviplata += amt;
    });
  });

  const cashExpenses = dailyPurchases
    .filter((p) => p.date?.startsWith(today) && p.paymentMethod === 'cash')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  // Efectivo esperado = base inicial + ventas en efectivo - gastos en efectivo
  const initialAmount  = Number(cashSession?.initialAmount) || 0;
  const expectedCash   = initialAmount + salesCash - cashExpenses;

  // Monto contado ingresado por el usuario (solo dígitos)
  const countedAmount  = rawCash.length > 0 ? Number(rawCash) : null;
  const diff           = countedAmount !== null ? countedAmount - expectedCash : null;

  /* ── Handlers ── */
  const handleOpen = () => {
    if (!selectedStaff || !openingBase) return;
    openSession(selectedStaff, Number(openingBase));
    onClose();
  };

  const handleClose = () => {
    const data = {
      openedAt:    cashSession.openedAt,
      openedBy:    cashSession.openedBy,
      closedAt:    new Date().toISOString(),
      initialBase: initialAmount,
      sales: {
        total:     totalSales,
        cash:      salesCash,
        card:      salesCard,
        nequi:     salesNequi,
        daviplata: salesDaviplata,
      },
      tips:         totalTips,
      cashExpenses: cashExpenses,
      expectedCash: expectedCash,
      countedCash:  countedAmount,
      difference:   diff,
      ordersCount:  todaysOrders.length,
    };
    addCashClosing(data);
    closeSession();
    setClosingData(data);
    setClosed(true);
  };

  const handlePrint = () => {
    if (!closingData) return;
    const cashierName = staff.find((s) => s.id === closingData.openedBy)?.name || closingData.openedBy || 'N/A';
    const openedAt    = new Date(closingData.openedAt).toLocaleString('es-CO');
    const closedAt    = new Date(closingData.closedAt).toLocaleString('es-CO');

    const html = `<!DOCTYPE html>
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
  <div class="row"><span>Efectivo:</span><span>${fmtCOP(closingData.sales.cash)}</span></div>
  <div class="row"><span>Tarjeta:</span><span>${fmtCOP(closingData.sales.card)}</span></div>
  <div class="row"><span>Nequi:</span><span>${fmtCOP(closingData.sales.nequi)}</span></div>
  <div class="row"><span>Daviplata:</span><span>${fmtCOP(closingData.sales.daviplata)}</span></div>
  <div class="divider"></div>
  <div class="row bold"><span>TOTAL VENTAS:</span><span>${fmtCOP(closingData.sales.total)}</span></div>
  <div class="row"><span>Propinas:</span><span>${fmtCOP(closingData.tips)}</span></div>
  ${closingData.cashExpenses > 0 ? `
  <div class="divider"></div>
  <p class="bold">GASTOS EN EFECTIVO</p>
  <div class="row red"><span>- Gastos del día:</span><span>-${fmtCOP(closingData.cashExpenses)}</span></div>` : ''}
  <div class="divider"></div>
  <p class="bold">CUADRE DE CAJA</p>
  <div class="row"><span>Base inicial:</span><span>${fmtCOP(closingData.initialBase)}</span></div>
  <div class="row"><span>+ Ventas efectivo:</span><span>${fmtCOP(closingData.sales.cash)}</span></div>
  ${closingData.cashExpenses > 0 ? `<div class="row red"><span>- Gastos efectivo:</span><span>-${fmtCOP(closingData.cashExpenses)}</span></div>` : ''}
  <div class="row bold"><span>= Esperado en caja:</span><span>${fmtCOP(closingData.expectedCash)}</span></div>
  <div class="row"><span>Efectivo contado:</span><span>${fmtCOP(closingData.countedCash)}</span></div>
  <div class="row big ${closingData.difference === 0 ? 'diff-ok' : 'diff-bad'}">
    <span>DIFERENCIA:</span>
    <span>${closingData.difference > 0 ? '+' : ''}${fmtCOP(closingData.difference)} ${closingData.difference > 0 ? '(Sobrante)' : closingData.difference < 0 ? '(Faltante)' : '(Cuadre Perfecto)'}</span>
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
  const diffColor = diff === null ? '' : diff === 0 ? 'text-success' : diff > 0 ? 'text-warning' : 'text-danger';
  const diffBg    = diff === null ? '' : diff === 0 ? 'bg-success/10 border-success' : diff > 0 ? 'bg-warning/10 border-warning' : 'bg-danger/10 border-danger';

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
                  onChange={(e) => setSelectedStaff(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {staff.map((s) => (
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
              <div className="grid-2">
                <div className="card p-3 border-light">
                  <div className="text-xs text-muted mb-1">Base Inicial</div>
                  <div className="font-bold">{fmtCOP(initialAmount)}</div>
                </div>
                <div className="card p-3 border-light">
                  <div className="text-xs text-muted mb-1">Pedidos Cobrados Hoy</div>
                  <div className="font-bold">{todaysOrders.length}</div>
                </div>
              </div>

              <div className="card p-3 border-light">
                <div className="text-xs text-muted font-bold uppercase mb-2">Ventas por Método de Pago</div>
                <div className="flex justify-between text-sm py-1"><span>💵 Efectivo</span><span className="font-bold">{fmtCOP(salesCash)}</span></div>
                <div className="flex justify-between text-sm py-1"><span>💳 Tarjeta</span><span className="font-bold">{fmtCOP(salesCard)}</span></div>
                <div className="flex justify-between text-sm py-1"><span>📱 Nequi</span><span className="font-bold">{fmtCOP(salesNequi)}</span></div>
                <div className="flex justify-between text-sm py-1"><span>📲 Daviplata</span><span className="font-bold">{fmtCOP(salesDaviplata)}</span></div>
                <div className="border-t border-border mt-2 pt-2 flex justify-between font-extrabold">
                  <span>Ventas totales</span>
                  <span className="text-accent">{fmtCOP(totalSales)}</span>
                </div>
              </div>

              <div className="card p-3 border-light">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Efectivo esperado en caja</span>
                  <span className="font-bold text-accent">{fmtCOP(expectedCash)}</span>
                </div>
                <div className="text-xs text-muted mt-1">
                  Base inicial + ventas efectivo{cashExpenses > 0 ? ` − gastos efectivo (${fmtCOP(cashExpenses)})` : ''}
                </div>
              </div>

              {/* ── Campo de ingreso del efectivo contado ── */}
              <div>
                <label className="block text-sm font-bold mb-1">
                  <Calculator size={13} className="inline mr-1" />
                  Efectivo Real Contado
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input w-full text-xl font-bold"
                  placeholder="Ej: 124732"
                  value={rawCash}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, '');
                    setRawCash(onlyDigits);
                  }}
                />
                {rawCash.length > 0 && (
                  <div className="text-sm font-bold text-accent mt-1 text-right">
                    Valor ingresado: {fmtCOP(Number(rawCash))}
                  </div>
                )}
              </div>

              {/* ── Resultado del cuadre ── */}
              <div className={`card p-4 text-center border-2 ${diff === null ? 'border-border' : diffBg}`}>
                <div className="text-xs font-bold uppercase mb-2 opacity-70">Resultado del Cuadre</div>
                {diff === null ? (
                  <div className="text-muted font-bold">Ingrese el efectivo contado arriba...</div>
                ) : (
                  <div className={diffColor}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1 }}>
                      {diff > 0 ? '+ ' : diff < 0 ? '- ' : ''}{fmtCOP(Math.abs(diff))}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 6 }}>
                      {diff > 0 ? '▲ SOBRANTE EN CAJA' : diff < 0 ? '▼ FALTANTE EN CAJA' : '✔ CUADRE PERFECTO'}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4, opacity: 0.7 }}>
                      Esperado: {fmtCOP(expectedCash)} · Contado: {fmtCOP(countedAmount)}
                    </div>
                  </div>
                )}
              </div>
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
              disabled={rawCash.length === 0}
            >
              🔴 Confirmar Cierre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
