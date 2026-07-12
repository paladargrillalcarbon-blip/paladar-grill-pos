import { useState, useMemo } from 'react';
import { CheckCircle, Clock, ChefHat, Truck } from 'lucide-react';
import { useOrdersStore } from '../../store/ordersStore';
import { formatCOP } from '../../utils/currency';
import { format } from 'date-fns';

export default function Orders() {
  const orders = useOrdersStore((s) => s.orders);
  const updateStatus = useOrdersStore((s) => s.updateStatus);
  
  const activeOrders = useMemo(() => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  }, [orders]);

  const [view, setView] = useState('kds'); // kds | history

  const handleStatusChange = (orderId, newStatus) => {
    updateStatus(orderId, newStatus);
  };

  if (view === 'kds') {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Vista de Cocina (KDS)</h1>
            <p className="page-subtitle">{activeOrders.length} pedidos en curso</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setView('history')}>Ver Historial</button>
        </div>

        <div className="grid-3">
          {['pending', 'preparing', 'ready'].map((status) => (
            <div key={status} className="card p-4 bg-elevated">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                {status === 'pending' && <Clock size={18} className="text-amber-400" />}
                {status === 'preparing' && <ChefHat size={18} className="text-blue-400" />}
                {status === 'ready' && <CheckCircle size={18} className="text-green-400" />}
                {status === 'pending' ? 'Pendientes' : status === 'preparing' ? 'Preparando' : 'Listos para entregar'}
              </h3>
              
              <div className="flex flex-col gap-3">
                {activeOrders.filter(o => o.status === status).map(order => (
                  <div key={order.id} className="card p-3 border-light cursor-pointer hover:border-accent">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">
                        {order.type === 'local' ? `Mesa ${order.tableNumber}` : order.type === 'own' ? 'Delivery Propio' : order.type}
                      </span>
                      <span className="text-xs text-secondary">{format(new Date(order.createdAt), 'HH:mm')}</span>
                    </div>
                    {order.customerName && <div className="text-sm mb-2 text-muted">{order.customerName}</div>}
                    
                    <ul className="text-sm mb-3 pl-4 list-disc marker:text-accent">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          <span className="font-bold">{item.quantity}x</span> {item.name}
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-2 mt-auto">
                      {status === 'pending' && (
                        <button className="btn btn-sm btn-primary w-full" onClick={() => handleStatusChange(order.id, 'preparing')}>A Preparar</button>
                      )}
                      {status === 'preparing' && (
                        <button className="btn btn-sm btn-success w-full" onClick={() => handleStatusChange(order.id, 'ready')}>Marcar Listo</button>
                      )}
                      {status === 'ready' && (
                        <button className="btn btn-sm btn-ghost w-full" onClick={() => handleStatusChange(order.id, 'delivered')}>Entregado</button>
                      )}
                    </div>
                  </div>
                ))}
                {activeOrders.filter(o => o.status === status).length === 0 && (
                   <div className="text-center text-sm text-muted py-4">No hay pedidos</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Pedidos</h1>
          <p className="page-subtitle">Todos los pedidos procesados</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setView('kds')}>Volver a Cocina</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha/Hora</th>
                <th>Tipo</th>
                <th>Cliente/Mesa</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="text-muted text-xs">#{order.id?.slice(-6) || '000000'}</td>
                  <td>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                  <td>
                    <span className="badge badge-local">{order.type}</span>
                  </td>
                  <td>{order.tableNumber || order.customerName || '-'}</td>
                  <td className="font-bold">{formatCOP(order.totals?.grandTotal)}</td>
                  <td>
                    <span className={`badge badge-${order.status}`}>
                      {order.status === 'delivered' ? 'Entregado' : order.status === 'cancelled' ? 'Cancelado' : order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
