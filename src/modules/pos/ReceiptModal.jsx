import { useRef } from 'react';
import { X, Printer, CheckCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatCOP } from '../../utils/currency';
import { usePosStore } from '../../store/posStore';
import { useLoyaltyStore } from '../../store/loyaltyStore';

export default function ReceiptModal({ completedData, onClose }) {
  const { products, modifiers, config } = usePosStore();
  const { customers } = useLoyaltyStore();
  const printRef = useRef(null);

  const { order, totals, payments, pointsEarned, change } = completedData;
  const orderNumber = order.id
    ? (typeof order.id === 'string' ? order.id.slice(-6).toUpperCase() : order.id)
    : '000000';
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const customer = order.customerId ? customers.find(c => c.id === order.customerId) : null;

  const taxRate   = config?.taxRate ?? 0.08;
  const taxName   = config?.taxName || 'Impoconsumo';
  const taxPct    = Math.round(taxRate * 100);

  const handlePrint = () => window.print();

  /* ── helpers ── */
  const Line = ({ label, value, bold, color }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      fontWeight: bold ? '800' : '400', color: color || 'inherit', marginBottom: 1,
    }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );

  const Divider = ({ dashed }) => (
    <hr style={{ border: 'none', borderTop: `1px ${dashed ? 'dashed' : 'solid'} #000`, margin: '6px 0' }} />
  );

  return (
    <div className="modal-backdrop" style={{ zIndex: 999999 }}>
      <div className="modal-content" style={{ maxWidth: 460, width: '95%' }}>

        {/* Header éxito */}
        <div className="modal-header" style={{ background: 'rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={22} />
            <div>
              <h2 className="modal-title" style={{ color: '#22c55e', fontSize: '1.1rem' }}>
                ¡Pago Exitoso!
              </h2>
              <p className="text-xs text-muted">La mesa / pedido ha sido cerrado y cobrado correctamente.</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Ticket imprimible */}
        <div className="modal-body p-4" style={{ background: '#f1f5f9', color: '#0f172a', borderRadius: 'var(--radius-md)', maxHeight: '68vh', overflowY: 'auto' }}>
          <div
            id="printable-receipt"
            ref={printRef}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '12px',
              lineHeight: '1.4',
              color: '#000',
              background: '#fff',
              padding: '16px',
              border: '1px dashed #cbd5e1',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {/* ── ENCABEZADO DEL NEGOCIO ── */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              {/* Logo */}
              {config?.logoUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 0.5 }}>
                {config?.name || 'PALADAR GRILL'}
              </div>
              {config?.slogan && (
                <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{config.slogan}</div>
              )}
              {config?.nit && (
                <div style={{ fontSize: 11 }}>NIT: {config.nit}</div>
              )}
              {config?.taxRegime && (
                <div style={{ fontSize: 10, color: '#555' }}>{config.taxRegime}</div>
              )}
              {config?.address && (
                <div style={{ fontSize: 11 }}>{config.address}</div>
              )}
              {config?.city && (
                <div style={{ fontSize: 11 }}>
                  {config.city}{config?.department ? ` - ${config.department}` : ''}
                  {config?.country ? `, ${config.country}` : ''}
                </div>
              )}
              {config?.phone && <div style={{ fontSize: 11 }}>Tel: {config.phone}</div>}
              {config?.email && <div style={{ fontSize: 10, color: '#555' }}>{config.email}</div>}

              <Divider dashed />

              <div style={{ fontSize: 13, fontWeight: 800 }}>FACTURA DE VENTA</div>

              {/* Resolución DIAN */}
              {config?.invoiceResolution && (
                <>
                  <div style={{ fontSize: 10, color: '#444' }}>
                    Resolución DIAN No. {config.invoiceResolution}
                    {config.invoiceResolutionDate ? ` del ${config.invoiceResolutionDate}` : ''}
                  </div>
                  {config.invoiceFrom && (
                    <div style={{ fontSize: 10, color: '#444' }}>
                      Rango: {config.invoicePrefix || ''}{config.invoiceFrom} – {config.invoicePrefix || ''}{config.invoiceTo}
                    </div>
                  )}
                </>
              )}

              <div style={{ fontSize: 12, fontWeight: 700 }}>
                No. {config?.invoicePrefix || 'FAC'}-{orderNumber}
              </div>
              <div style={{ fontSize: 11, color: '#444' }}>
                {format(orderDate, 'dd/MM/yyyy HH:mm:ss')}
              </div>
            </div>

            <Divider />

            {/* ── DATOS DEL PEDIDO / CLIENTE ── */}
            <div style={{ marginBottom: 8, fontSize: 12 }}>
              <div>
                <strong>Destino:</strong>{' '}
                {order.type === 'local'     ? `Mesa ${order.tableNumber || 'S/N'}` :
                 order.type === 'takeaway'  ? 'Para Llevar' :
                 order.type === 'own'       ? 'Domicilio Propio' :
                 (order.type || '').toUpperCase()}
              </div>
              {order.customerName && <div><strong>Cliente:</strong> {order.customerName}</div>}
              {order.deliveryAddress && <div><strong>Dirección:</strong> {order.deliveryAddress}</div>}
              {customer && (
                <div style={{ color: '#059669', fontWeight: 700, fontSize: 11, marginTop: 2 }}>
                  ⭐ Cliente Frecuente Club Paladar
                </div>
              )}
            </div>

            <Divider />

            {/* ── ITEMS ── */}
            <div style={{ marginBottom: 8 }}>
              <Line label="CANT / DESCRIPCIÓN" value="TOTAL" bold />
              <Divider />
              {(order.items || []).map((item, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <Line
                    label={`${item.quantity}x ${item.name}`}
                    value={formatCOP((item.price || 0) * (item.quantity || 1))}
                    bold
                  />
                  {/* Combo */}
                  {item.comboDetails && (
                    <div style={{ paddingLeft: 10, fontSize: 11, color: '#444' }}>
                      + Combo: {products.find(p => p.id === item.comboDetails.sideId)?.name || 'Papas'}
                      {' '}/ {products.find(p => p.id === item.comboDetails.drinkId)?.name || 'Bebida'}
                    </div>
                  )}
                  {/* Modificadores */}
                  {item.modifiers?.length > 0 && (
                    <div style={{ paddingLeft: 10, fontSize: 11, color: '#444' }}>
                      {item.modifiers.map(modId => {
                        const mod = (modifiers || []).find(m => m.id === modId);
                        return mod ? (
                          <div key={modId}>
                            • {mod.name}{mod.priceDelta > 0 ? ` (+${formatCOP(mod.priceDelta)})` : ''}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  {/* Nota del ítem */}
                  {item.note && (
                    <div style={{ paddingLeft: 10, fontSize: 10, color: '#666', fontStyle: 'italic' }}>
                      📝 {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Divider />

            {/* ── TOTALES ── */}
            <div style={{ marginBottom: 8, fontSize: 12 }}>
              <Line label="Subtotal Neto:" value={formatCOP(totals?.netTotal || 0)} />
              <Line
                label={`${taxName} (${taxPct}%):`}
                value={formatCOP(totals?.impoconsumo || totals?.tax || 0)}
              />
              {totals?.totalDiscounts > 0 && (
                <Line label="Descuentos:" value={`-${formatCOP(totals.totalDiscounts)}`} color="#dc2626" />
              )}
              {order.tip > 0 && (
                <Line label="Propina Voluntaria:" value={`+${formatCOP(order.tip)}`} />
              )}
              <Divider />
              <Line
                label="TOTAL PAGADO:"
                value={formatCOP(totals?.grandTotal || totals?.total || 0)}
                bold
              />
            </div>

            <Divider dashed />

            {/* ── FORMAS DE PAGO ── */}
            <div style={{ marginBottom: 8, fontSize: 11 }}>
              <div style={{ fontWeight: 800, marginBottom: 2 }}>FORMAS DE PAGO:</div>
              {(payments || []).map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>• {p.method?.toUpperCase()} {p.ref ? `(${p.ref})` : ''}:</span>
                  <span>{formatCOP(p.amount)}</span>
                </div>
              ))}
              {change > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#059669', marginTop: 2 }}>
                  <span>Cambio devuelto:</span>
                  <span>{formatCOP(change)}</span>
                </div>
              )}
            </div>

            {/* ── PUNTOS FIDELIZACIÓN ── */}
            {pointsEarned > 0 && (
              <div style={{
                textAlign: 'center', background: '#fef3c7', padding: '6px',
                borderRadius: 4, border: '1px solid #fde68a',
                margin: '6px 0', fontSize: 11, fontWeight: 800, color: '#92400e',
              }}>
                ⭐ ¡Acumulaste {pointsEarned} puntos Club Paladar!
                {customer && (
                  <div style={{ fontSize: 10 }}>Nuevo Saldo: {customer.points} pts</div>
                )}
              </div>
            )}

            {/* ── FOOTER LEGAL ── */}
            <Divider dashed />
            <div style={{ textAlign: 'center', fontSize: 11, marginTop: 6 }}>
              <div style={{ fontWeight: 800 }}>
                {config?.thankYouMessage || '¡Gracias por su compra!'}
              </div>
              {config?.returnPolicy && (
                <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
                  {config.returnPolicy}
                </div>
              )}
              {config?.legalFooter && (
                <>
                  <Divider dashed />
                  <div style={{ fontSize: 9, color: '#888', lineHeight: 1.4 }}>
                    {config.legalFooter}
                  </div>
                </>
              )}
              <div style={{ fontSize: 9, color: '#aaa', marginTop: 6 }}>
                Sistema Paladar Grill POS v2.0
              </div>
            </div>
          </div>
        </div>

        {/* Footer botones */}
        <div className="modal-footer flex justify-between items-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-lg flex-1 flex items-center justify-center gap-2 font-bold"
            onClick={handlePrint}
          >
            <Printer size={18} /> Imprimir Factura
          </button>
          <button
            type="button"
            className="btn btn-secondary flex items-center gap-1"
            onClick={onClose}
          >
            Nueva Orden <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
