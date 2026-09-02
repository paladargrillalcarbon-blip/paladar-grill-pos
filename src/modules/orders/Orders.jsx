import { useState, useMemo } from 'react';
import { CheckCircle, Clock, ChefHat, Truck, Printer, Eye, AlertCircle, Utensils } from 'lucide-react';
import { useOrdersStore } from '../../store/ordersStore';
import { usePosStore } from '../../store/posStore';
import { formatCOP } from '../../utils/currency';
import { format } from 'date-fns';
import ComandaModal from '../pos/ComandaModal.jsx';

export default function Orders() {
  const orders = useOrdersStore((s) => s.orders);
  const updateStatus = useOrdersStore((s) => s.updateStatus);
  const { products, modifiers } = usePosStore();
  
  const activeOrders = useMemo(() => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  }, [orders]);

  const [view, setView] = useState('kds'); // 'kds' | 'history'
  const [printingOrder, setPrintingOrder] = useState(null);

  const handleStatusChange = (orderId, newStatus) => {
    updateStatus(orderId, newStatus);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ChefHat className="text-accent" size={24} /> {view === 'kds' ? 'Vista de Cocina (KDS)' : 'Historial de Pedidos'}
          </h1>
          <p className="page-subtitle">
            {view === 'kds' ? `${activeOrders.length} pedidos activos en preparación` : 'Registro completo de órdenes del sistema'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            className={`btn ${view === 'kds' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setView('kds')}
          >
            <ChefHat size={16} /> Vista Cocina ({activeOrders.length})
          </button>
          <button 
            className={`btn ${view === 'history' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setView('history')}
          >
            📋 Historial Completo
          </button>
        </div>
      </div>

      {/* ─── VISTA KDS COCINA ─── */}
      {view === 'kds' && (
        <div className="grid-3">
          {['pending', 'preparing', 'ready'].map((status) => {
            const list = activeOrders.filter(o => o.status === status);
            return (
              <div key={status} className="card p-4 bg-elevated flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-light">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    {status === 'pending' && <Clock size={18} className="text-amber-400" />}
                    {status === 'preparing' && <ChefHat size={18} className="text-blue-400" />}
                    {status === 'ready' && <CheckCircle size={18} className="text-green-400" />}
                    {status === 'pending' ? 'Pendientes' : status === 'preparing' ? 'En Preparación' : 'Listos para Entregar'}
                  </h3>
                  <span className="badge badge-secondary font-bold">{list.length}</span>
                </div>
                
                <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '72vh' }}>
                  {list.map(order => (
                    <div 
                      key={order.id} 
                      className="card p-4 border-light flex flex-col gap-3 hover:border-accent transition"
                      style={{ background: 'var(--bg-card)' }}
                    >
                      {/* Cabecera del pedido */}
                      <div className="flex justify-between items-start border-b border-light pb-2">
                        <div>
                          <div className="font-extrabold text-base flex items-center gap-2">
                            {order.type === 'local' ? (
                              <span className="text-accent">🪑 Mesa {order.tableNumber || 'S/N'}</span>
                            ) : order.type === 'takeaway' ? (
                              <span className="text-amber-400">📦 Para Llevar</span>
                            ) : order.type === 'own' ? (
                              <span className="text-blue-400">🛵 Domicilio Propio</span>
                            ) : (
                              <span className="text-purple-400">📱 {order.type?.toUpperCase()}</span>
                            )}
                          </div>
                          {order.customerName && (
                            <div className="text-xs text-secondary mt-0.5">
                              Cliente: <strong>{order.customerName}</strong>
                            </div>
                          )}
                          {order.deliveryAddress && (
                            <div className="text-xs text-muted">
                              Dir: {order.deliveryAddress}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="badge badge-ghost text-xs font-mono">
                            #{order.id?.slice(-5) || '00000'}
                          </span>
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Clock size={11} /> {order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : '--:--'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Lista detallada de Ítems para Cocina */}
                      <div className="flex flex-col gap-2 my-1">
                        {(order.items || []).map((item, idx) => (
                          <div 
                            key={idx} 
                            className="p-2 rounded-lg"
                            style={{ background: 'var(--bg-elevated)', borderLeft: '3px solid var(--accent)' }}
                          >
                            <div className="flex justify-between items-baseline">
                              <span className="font-extrabold text-sm text-primary">
                                <span className="text-accent mr-1">[{item.quantity}x]</span> {item.name}
                              </span>
                              {item.comboDetails && (
                                <span className="badge badge-warning text-xs font-bold px-1.5 py-0.5">
                                  COMBO
                                </span>
                              )}
                            </div>

                            {/* Combo Breakdown */}
                            {item.comboDetails && (
                              <div className="text-xs font-semibold text-secondary mt-1 pl-2 border-l-2 border-amber-500/40">
                                <div>🍟 + {products.find(p => p.id === item.comboDetails.sideId)?.name || 'Papas'}</div>
                                <div>🥤 + {products.find(p => p.id === item.comboDetails.drinkId)?.name || 'Bebida'}</div>
                              </div>
                            )}

                            {/* Modificadores / Extras / Exclusiones */}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-xs mt-1 pl-2 flex flex-col gap-0.5">
                                {item.modifiers.map(modId => {
                                  const mod = (modifiers || []).find(m => m.id === modId);
                                  if (!mod) return null;
                                  return (
                                    <div key={modId} className={mod.priceDelta > 0 ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'}>
                                      {mod.priceDelta > 0 ? `• Extra: ${mod.name}` : `• Pref: ${mod.name}`}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Nota especial de preparación */}
                            {item.note && (
                              <div className="text-xs font-bold text-red-400 mt-1 pl-2 bg-red-500/10 p-1 rounded">
                                ⚠️ NOTA: "{item.note}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Botones de acción para el Cocinero */}
                      <div className="flex gap-2 mt-auto pt-2 border-t border-light">
                        <button 
                          className="btn btn-sm btn-ghost btn-icon" 
                          onClick={() => setPrintingOrder(order)}
                          title="Imprimir comanda de papel"
                        >
                          <Printer size={15} />
                        </button>

                        {status === 'pending' && (
                          <button 
                            className="btn btn-sm btn-primary flex-1 font-bold" 
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                          >
                            🧑‍🍳 A Preparar
                          </button>
                        )}
                        {status === 'preparing' && (
                          <button 
                            className="btn btn-sm btn-success flex-1 font-bold" 
                            onClick={() => handleStatusChange(order.id, 'ready')}
                          >
                            ✅ Marcar Listo
                          </button>
                        )}
                        {status === 'ready' && (
                          <button 
                            className="btn btn-sm btn-ghost flex-1 font-bold border border-success text-success" 
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                          >
                            📦 Entregado
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="text-center text-sm text-muted py-10">
                      No hay pedidos en este estado
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── VISTA HISTORIAL COMPLETO ─── */}
      {view === 'history' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Fecha/Hora</th>
                  <th>Tipo</th>
                  <th>Destino / Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className="font-mono font-bold text-accent">
                      #{order.id?.slice(-6) || '000000'}
                    </td>
                    <td>{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm') : '-'}</td>
                    <td>
                      <span className="badge badge-secondary uppercase text-xs font-bold">
                        {order.type === 'local' ? 'Mesa' : order.type === 'own' ? 'Domicilio' : order.type}
                      </span>
                    </td>
                    <td className="font-semibold">
                      {order.type === 'local' ? `Mesa ${order.tableNumber || '-'}` : order.customerName || '-'}
                    </td>
                    <td className="text-xs">
                      {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || '-'}
                    </td>
                    <td className="font-bold text-accent">
                      {formatCOP(order.totals?.grandTotal || order.totals?.total || 0)}
                    </td>
                    <td>
                      <span className={`badge ${
                        order.status === 'delivered' ? 'badge-success' :
                        order.status === 'cancelled' ? 'badge-danger' :
                        order.status === 'ready' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {order.status === 'delivered' ? 'Entregado' : 
                         order.status === 'ready' ? 'Listo' :
                         order.status === 'preparing' ? 'Preparando' :
                         order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-ghost btn-icon" 
                        onClick={() => setPrintingOrder(order)} 
                        title="Ver e Imprimir Comanda"
                      >
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted">
                      No hay historial de órdenes registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Impresión de Comanda */}
      {printingOrder && (
        <ComandaModal 
          order={printingOrder}
          totals={printingOrder.totals}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}
