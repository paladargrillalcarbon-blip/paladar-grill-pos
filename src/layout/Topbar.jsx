import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useOrdersStore } from '../store/ordersStore';
import { useState, useEffect, useMemo } from 'react';

export default function Topbar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const orders = useOrdersStore((s) => s.orders);
  const ingredients = useInventoryStore((s) => s.ingredients);

  const activeOrders = useMemo(() => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  }, [orders]);

  const lowStock = useMemo(() => {
    return ingredients.filter(i => i.stock <= i.minStock);
  }, [ingredients]);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const now = new Date();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-date">
          {format(now, "EEEE dd 'de' MMMM, yyyy", { locale: es })}
        </span>
      </div>

      <div className="topbar-right">
        {/* Alertas */}
        {lowStock.length > 0 && (
          <div className="badge badge-danger" title={`${lowStock.length} ingredientes con stock bajo`}>
            ⚠️ Stock Bajo ({lowStock.length})
          </div>
        )}

        {activeOrders.length > 0 && (
          <div className="badge badge-warning">
            🍳 {activeOrders.length} pedido{activeOrders.length > 1 ? 's' : ''} activo{activeOrders.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Estado online/offline */}
        <div className={`online-badge`} style={!isOnline ? { color: 'var(--red-400)', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' } : {}}>
          <span className="online-dot" style={!isOnline ? { background: 'var(--red-400)' } : {}} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </header>
  );
}
