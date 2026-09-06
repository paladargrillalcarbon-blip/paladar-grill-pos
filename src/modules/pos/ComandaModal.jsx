import { useRef } from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { formatCOP } from '../../utils/currency';
import { usePosStore } from '../../store/posStore';

export default function ComandaModal({ order, totals, onClose }) {
  const { products, modifiers, config } = usePosStore();
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const orderNumber = order.id ? (typeof order.id === 'string' ? order.id.slice(-6).toUpperCase() : order.id) : 'NUEVO';
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

  return (
    <div className="modal-backdrop" style={{ zIndex: 99999 }}>
      <div className="modal-content" style={{ maxWidth: 420, width: '95%' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2">
            <Printer size={18} className="text-accent" /> Comanda de Cocina
          </h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="modal-body p-4" style={{ background: '#f8fafc', color: '#0f172a', borderRadius: 'var(--radius-md)', maxHeight: '70vh', overflowY: 'auto' }}>
          
          <div id="printable-comanda" ref={printRef} style={{
            fontFamily: 'monospace, Courier, monospace',
            fontSize: '13px',
            lineHeight: '1.4',
            color: '#000',
            background: '#fff',
            padding: '16px',
            border: '1px dashed #cbd5e1',
            borderRadius: '6px'
          }}>
            {/* Header Comanda */}
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>
                {config?.name || 'PALADAR GRILL'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '2px', background: '#000', color: '#fff', padding: '2px 6px', display: 'inline-block', borderRadius: '3px' }}>
                *** COMANDA COCINA ***
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                ORDEN: <strong>#{orderNumber}</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#333' }}>
                {format(orderDate, 'dd/MM/yyyy - HH:mm:ss')}
              </div>
            </div>

            {/* Info Destino */}
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px', fontSize: '13px' }}>
              <div style={{ fontWeight: '800', fontSize: '15px' }}>
                {order.type === 'local' ? `🪑 MESA: ${order.tableNumber || 'S/N'}` :
                 order.type === 'takeaway' ? `📦 PARA LLEVAR: ${order.customerName || 'Cliente'}` :
                 order.type === 'own' ? `🛵 DOMICILIO PROPIO: ${order.customerName || ''}` :
                 `📱 ${order.type?.toUpperCase()}: ${order.customerName || order.platformOrderId || ''}`}
              </div>
              {order.deliveryAddress && (
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  <strong>Dir:</strong> {order.deliveryAddress}
                </div>
              )}
            </div>

            {/* Ítems con Modificadores y Combos */}
            <div style={{ borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '6px' }}>
                <span>CANT. PRODUCTO</span>
                {totals && <span>TOTAL</span>}
              </div>

              {(order.items || []).map((item, idx) => (
                <div key={idx} style={{ marginBottom: '8px', borderBottom: idx < order.items.length - 1 ? '1px dotted #ccc' : 'none', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: '900', fontSize: '14px' }}>
                      [{item.quantity}X] {item.name}
                    </span>
                    {totals && (
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>
                        {formatCOP((item.price || 0) * (item.quantity || 1))}
                      </span>
                    )}
                  </div>

                  {/* Combo Specs */}
                  {item.comboDetails && (
                    <div style={{ paddingLeft: '14px', fontSize: '12px', fontWeight: '700', color: '#000', marginTop: '2px' }}>
                      🍟 COMBO:
                      <div style={{ paddingLeft: '8px' }}>
                        + {products.find(p => p.id === item.comboDetails.sideId)?.name || 'Papas'}
                      </div>
                      <div style={{ paddingLeft: '8px' }}>
                        + {products.find(p => p.id === item.comboDetails.drinkId)?.name || 'Bebida'}
                      </div>
                    </div>
                  )}

                  {/* Modifiers / Adiciones / Exclusiones */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div style={{ paddingLeft: '14px', fontSize: '12px', fontWeight: '800', marginTop: '2px' }}>
                      {item.modifiers.map(modId => {
                        const mod = (modifiers || []).find(m => m.id === modId);
                        return mod ? (
                          <div key={modId} style={{ color: mod.priceDelta > 0 ? '#000' : '#d97706' }}>
                            {mod.priceDelta > 0 ? `+ EXTRA: ${mod.name}` : `* PREF: ${mod.name}`}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Nota de Cocina */}
                  {item.note && (
                    <div style={{ paddingLeft: '14px', fontSize: '11px', fontWeight: '800', background: '#fef08a', padding: '2px 4px', borderRadius: '3px', marginTop: '3px', display: 'inline-block' }}>
                      ⚠️ NOTA: "{item.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Resumen Total si aplica */}
            {totals && (
              <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>
                TOTAL: {formatCOP(totals.grandTotal || totals.total || 0)}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#666' }}>
              --- Fin de la Comanda ---
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer flex justify-between items-center">
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn btn-primary flex items-center gap-2" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Comanda
          </button>
        </div>

      </div>
    </div>
  );
}
