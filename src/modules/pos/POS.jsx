import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, ChevronRight, Tag, Save, Coffee, Search, UserPlus, Printer } from 'lucide-react';
import TableMap                from './TableMap.jsx';
import { usePosStore }        from '../../store/posStore';
import { useOrdersStore }     from '../../store/ordersStore';
import { useInventoryStore }  from '../../store/inventoryStore';
import { useLoyaltyStore }    from '../../store/loyaltyStore';
import { useTableStore }      from '../../store/tableStore';
import { formatCOP }          from '../../utils/currency';
import { calcOrderTotals }    from '../../utils/taxes';
import { isPromotionActive }  from '../../utils/promotions';
import { format }             from 'date-fns';
import PaymentModal           from './PaymentModal.jsx';
import TipModal               from './TipModal.jsx';
import SplitModal             from './SplitModal.jsx';
import CashCloseModal         from './CashCloseModal.jsx';
import ProductCustomizerModal from './ProductCustomizerModal.jsx';
import ComandaModal           from './ComandaModal.jsx';
import ReceiptModal           from './ReceiptModal.jsx';

const ORDER_TYPES = [
  { id: 'local',     label: 'Mesa',           icon: '🍽️' },
  { id: 'takeaway',  label: 'Para llevar',     icon: '📦' },
  { id: 'own',       label: 'Domicilio Propio',icon: '🛵' },
  { id: 'rappi',     label: 'Rappi',           icon: '🔴' },
  { id: 'ifood',     label: 'iFood',           icon: '🟢' },
  { id: 'pedidosya', label: 'PedidosYa',       icon: '🔵' },
];

export default function POS() {
  const { categories, products, modifiers, currentOrder, promotions, applyPromoToOrder, cashSession } = usePosStore();
  const setOrderType  = usePosStore((s) => s.setOrderType);
  const setOrderMeta  = usePosStore((s) => s.setOrderMeta);
  const addItem       = usePosStore((s) => s.addItem);
  const updateQty     = usePosStore((s) => s.updateItemQuantity);
  const removeItem    = usePosStore((s) => s.removeItem);
  const clearOrder    = usePosStore((s) => s.clearOrder);
  const loadOrder     = usePosStore((s) => s.loadOrder);
  
  const orders        = useOrdersStore((s) => s.orders);
  const saveOrder     = useOrdersStore((s) => s.saveOrder);
  
  const consumeForOrder = useInventoryStore((s) => s.consumeForOrder);
  
  const activePromos = useMemo(() => {
    return promotions.filter(isPromotionActive);
  }, [promotions]);

  const activeUnpaidOrders = useMemo(() => {
    return orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled');
  }, [orders]);

  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'tables'
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  
  const { tables } = useTableStore();
  const [showPayment,    setShowPayment]    = useState(false);
  const [showTip,        setShowTip]        = useState(false);
  const [showSplit,      setShowSplit]       = useState(false);
  const [showCashClose,  setShowCashClose]  = useState(false);
  const [showPromo,      setShowPromo]      = useState(false);
  const [showComanda,    setShowComanda]    = useState(false);
  const [completedReceiptData, setCompletedReceiptData] = useState(null);
  const [customizingProduct, setCustomizingProduct] = useState(null);

  // Loyalty states
  const { customers, settings, addCustomer, addPoints, redeemPoints } = useLoyaltyStore();
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({ name: '', phone: '', email: '' });

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const handleQuickCustomerSubmit = (e) => {
    e.preventDefault();
    if (!quickCustomerForm.name || !quickCustomerForm.phone) {
      alert('Nombre y Teléfono son obligatorios.');
      return;
    }
    try {
      addCustomer({
        name: quickCustomerForm.name,
        phone: quickCustomerForm.phone,
        email: quickCustomerForm.email,
        points: 0
      });
      // Search for the added customer to associate them
      const added = useLoyaltyStore.getState().customers.find(c => c.phone === quickCustomerForm.phone);
      if (added) {
        setOrderMeta({ customerId: added.id, customerName: added.name });
      }
      setShowQuickCustomerModal(false);
      setQuickCustomerForm({ name: '', phone: '', email: '' });
      setCustomerSearch('');
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProducts = useMemo(
    () => products.filter((p) => p.categoryId === activeCategory && p.isActive),
    [products, activeCategory]
  );

  const totals = useMemo(
    () => calcOrderTotals(currentOrder.items, currentOrder.tip),
    [currentOrder.items, currentOrder.tip]
  );

  const handleProductClick = (product) => {
    // Abrir siempre el customizer para poder elegir cantidad, notas, combos, etc.
    setCustomizingProduct(product);
  };

  const handleConfirmCustomization = (product, selectedModifiers, comboDetails, specialNote, quantity = 1) => {
    const promo = activePromos.find((p) => {
      if (p.productIds?.includes(product.id)) return true;
      if (p.categoryIds?.includes(product.categoryId)) return true;
      return false;
    });
    
    addItem(product, { selectedModifiers, comboDetails }, promo || null, specialNote, quantity);
    setCustomizingProduct(null);
  };

  const validateOrderDestination = () => {
    if (currentOrder.type === 'local') {
      if (!currentOrder.tableNumber || currentOrder.tableNumber.trim() === '') {
        alert('⚠️ ATENCIÓN: Debes asignar un Número de Mesa antes de enviar a cocina o cobrar.');
        return false;
      }
    } else if (['takeaway', 'own'].includes(currentOrder.type)) {
      if (!currentOrder.customerName || currentOrder.customerName.trim() === '') {
        alert('⚠️ ATENCIÓN: Debes ingresar el Nombre del Cliente antes de continuar.');
        return false;
      }
      if (currentOrder.type === 'own' && (!currentOrder.deliveryAddress || currentOrder.deliveryAddress.trim() === '')) {
        alert('⚠️ ATENCIÓN: Debes ingresar la Dirección de Entrega para el domicilio propio.');
        return false;
      }
    } else if (['rappi', 'ifood', 'pedidosya'].includes(currentOrder.type)) {
      if (!currentOrder.customerName && !currentOrder.platformOrderId) {
        alert('⚠️ ATENCIÓN: Debes ingresar el nombre del cliente o el número de pedido de la plataforma.');
        return false;
      }
    }
    return true;
  };

  const handleSaveToKitchen = () => {
    if (!validateOrderDestination()) return;
    const saved = saveOrder(currentOrder, totals, []);
    consumeForOrder(saved.id, currentOrder.items, products, activePromos);
    alert(`✅ Pedido guardado y enviado a Cocina (${currentOrder.type === 'local' ? `Mesa ${currentOrder.tableNumber}` : currentOrder.type})`);
    clearOrder();
  };

  const handleOpenPayment = () => {
    if (!validateOrderDestination()) return;
    setShowPayment(true);
  };

  const handleConfirmPayment = (payments, selectedCustId = null) => {
    if (!validateOrderDestination()) return;
    
    const activeCustomerId = selectedCustId !== null ? selectedCustId : currentOrder.customerId;
    const finalCustomer = activeCustomerId ? customers.find(c => c.id === activeCustomerId) : null;
    
    const orderToSave = {
      ...currentOrder,
      customerId: activeCustomerId,
      customerName: finalCustomer?.name || currentOrder.customerName || (currentOrder.type === 'local' ? `Mesa ${currentOrder.tableNumber}` : '')
    };

    const saved = saveOrder(orderToSave, totals, payments);
    const orderId = saved.id || Date.now().toString();
    if (!currentOrder.id) {
       consumeForOrder(orderId, currentOrder.items, products, activePromos);
    }

    let earnedPoints = 0;
    // Acumulación y redención de puntos
    if (settings.isActive && activeCustomerId) {
      const pointsPayment = payments.find(p => p.method === 'points');
      if (pointsPayment) {
        const pointsCost = Math.round(Number(pointsPayment.amount) / settings.redemptionRate);
        try {
          redeemPoints(activeCustomerId, pointsCost, `Redención de puntos en Pedido #${orderId}`);
        } catch (err) {
          console.error('Error al redimir puntos:', err);
        }
      }

      // Acumular puntos por la compra
      const cashOrOtherAmount = payments
        .filter(p => p.method !== 'points')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
      earnedPoints = Math.floor(cashOrOtherAmount / settings.accumulationRate);
      if (earnedPoints > 0) {
        addPoints(activeCustomerId, earnedPoints, `Acumulado en compra de Pedido #${orderId}`);
      }
    }

    // Calcular cambio devuelto si aplica
    const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const calculatedChange = Math.max(0, totalPaid - totals.grandTotal);

    // Preparar y mostrar modal de factura para imprimir
    setCompletedReceiptData({
      order: saved,
      totals,
      payments,
      pointsEarned: earnedPoints,
      change: calculatedChange
    });

    clearOrder();
    setShowPayment(false);
  };

  const handleLoadOrder = (order) => {
    loadOrder(order);
    setViewMode('menu');
  };

  const canCheckout = currentOrder.items.length > 0;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 128px)', gap: 'var(--space-4)', overflow: 'hidden' }}>

      {/* ── LEFT: Menú o Mesas ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflow: 'hidden' }}>

        {/* Fila superior: Tabs + Botón de Caja */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button 
              className={`btn ${viewMode === 'menu' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('menu')}
            >
              🍔 Menú y Toma de Pedidos
            </button>
            <button 
              className={`btn ${viewMode === 'tables' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('tables')}
            >
              <Coffee size={18}/> Órdenes Activas ({activeUnpaidOrders.length})
            </button>
          </div>

          {/* Botón Abrir / Cerrar Caja — Siempre visible */}
          <button
            className={`btn ${cashSession ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setShowCashClose(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cashSession ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
            {cashSession ? '🔓 Caja Abierta — Cerrar' : '🔒 Caja Cerrada — Abrir'}
          </button>
        </div>

        {viewMode === 'tables' ? (
           <TableMap
             activeUnpaidOrders={activeUnpaidOrders}
             onLoadOrder={handleLoadOrder}
             onOpenTable={(tableId) => {
               clearOrder();
               setOrderType('local');
               setOrderMeta({ tableNumber: tableId.toString() });
               setViewMode('menu');
             }}
             onPayOrder={(order) => {
               loadOrder(order);
               setShowPayment(true);
             }}
           />
        ) : (
          <>
            {/* Tipo de pedido */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOrderType(t.id)}
                  className="btn btn-sm"
                  style={{
                    background: currentOrder.type === t.id
                      ? 'linear-gradient(135deg, var(--amber-500), var(--amber-600))'
                      : 'var(--bg-elevated)',
                    color: currentOrder.type === t.id ? '#000' : 'var(--text-secondary)',
                    border: `1px solid ${currentOrder.type === t.id ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Datos del pedido según tipo */}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {currentOrder.type === 'local' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    className="form-select"
                    value={currentOrder.tableNumber || ''}
                    onChange={(e) => setOrderMeta({ tableNumber: e.target.value })}
                    style={{ 
                      minWidth: 200,
                      borderColor: !currentOrder.tableNumber ? '#ef4444' : 'var(--border)',
                      background: !currentOrder.tableNumber ? 'rgba(239,68,68,0.05)' : 'var(--bg-elevated)',
                    }}
                  >
                    <option value="" disabled>⚠️ Seleccionar mesa (Obligatorio)...</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id.toString()}>
                        {t.name} ({t.zone}) - {t.capacity} pers.
                      </option>
                    ))}
                  </select>
                  {!currentOrder.tableNumber && (
                    <span className="badge badge-danger text-xs font-bold" style={{ whiteSpace: 'nowrap' }}>
                      Requerido
                    </span>
                  )}
                </div>
              )}
              {['own','rappi','ifood','pedidosya','takeaway'].includes(currentOrder.type) && (
                <input
                  className="form-input"
                  placeholder="Nombre del cliente"
                  value={currentOrder.customerName}
                  onChange={(e) => setOrderMeta({ customerName: e.target.value })}
                  style={{ maxWidth: 220 }}
                />
              )}
              {currentOrder.type === 'own' && (
                <input
                  className="form-input"
                  placeholder="Dirección de entrega"
                  value={currentOrder.deliveryAddress}
                  onChange={(e) => setOrderMeta({ deliveryAddress: e.target.value })}
                />
              )}
              {['rappi','ifood','pedidosya'].includes(currentOrder.type) && (
                <input
                  className="form-input"
                  placeholder="# de pedido en plataforma"
                  value={currentOrder.platformOrderId}
                  onChange={(e) => setOrderMeta({ platformOrderId: e.target.value })}
                  style={{ maxWidth: 220 }}
                />
              )}
            </div>

            {/* Categorías */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="btn btn-sm"
                  style={{
                    background: activeCategory === cat.id ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: activeCategory === cat.id ? '#000' : 'var(--text-secondary)',
                    border: `1px solid ${activeCategory === cat.id ? 'var(--accent)' : 'var(--border)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Grid de productos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 'var(--space-3)',
              overflowY: 'auto',
              flex: 1,
            }}>
              {filteredProducts.map((product) => {
                const promo = activePromos.find(
                  (p) => p.productIds?.includes(product.id) || p.categoryIds?.includes(product.categoryId)
                );
                const discountedPrice = promo
                  ? product.price * (1 - (promo.type === 'percentage' ? promo.value / 100 : 0))
                  : null;

                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      cursor: 'pointer',
                      text: 'left',
                      transition: 'all var(--transition)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {promo && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'var(--red-500)', color: 'white',
                        fontSize: '0.6rem', fontWeight: 700,
                        padding: '2px 6px', borderRadius: 'var(--radius-full)',
                      }}>
                        {promo.type === 'percentage' ? `-${promo.value}%` : 'PROMO'}
                      </div>
                    )}
                    <div style={{ fontSize: '2rem', lineHeight: 1 }}>🍔</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {product.name}
                    </div>
                    <div>
                      {promo && discountedPrice ? (
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatCOP(product.price)}
                          </span>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--amber-400)' }}>
                            {formatCOP(discountedPrice)}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--amber-400)' }}>
                          {formatCOP(product.price)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Carrito ───────────────────── */}
      <div style={{
        width: 340,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Cart Header */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShoppingCart size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700 }}>{currentOrder.id ? 'Editando Pedido' : 'Nuevo Pedido'}</span>
            {currentOrder.items.length > 0 && (
              <span className="badge badge-warning">{currentOrder.items.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setShowCashClose(true)} title="Cierre de caja">
              💰
            </button>
            {currentOrder.items.length > 0 && (
              <button className="btn btn-sm btn-danger btn-icon" onClick={clearOrder} title="Limpiar pedido">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Widget de Fidelización de Clientes */}
        {settings.isActive && (
          <div style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
            {currentOrder.customerId ? (
              (() => {
                const customer = customers.find(c => c.id === currentOrder.customerId);
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        👤 {customer?.name || currentOrder.customerName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--green-400)', fontWeight: 600 }}>
                        {customer ? `${customer.points} pts disponibles ($${customer.points * settings.redemptionRate})` : ''}
                      </span>
                    </div>
                    <button 
                      className="btn btn-sm btn-ghost btn-icon" 
                      onClick={() => setOrderMeta({ customerId: null, customerName: '' })}
                      style={{ padding: 4 }}
                      title="Quitar cliente"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })()
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 8px' }}>
                    <Search size={12} className="text-muted" style={{ marginRight: 4 }} />
                    <input 
                      type="text" 
                      placeholder="Fidelizar por cel/nombre..." 
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerResults(true);
                      }}
                      onFocus={() => setShowCustomerResults(true)}
                      style={{ width: '100%', background: 'transparent', border: 0, outline: 'none', fontSize: '0.75rem', padding: '4px 0', color: 'var(--text-primary)' }}
                    />
                    {customerSearch && (
                      <button onClick={() => setCustomerSearch('')} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => setShowQuickCustomerModal(true)}
                    style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Nuevo cliente rápido"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>

                {showCustomerResults && filteredCustomers.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0 0 var(--radius-md) var(--radius-md)', maxHeight: 150, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {filteredCustomers.map(cust => (
                      <div 
                        key={cust.id} 
                        onClick={() => {
                          setOrderMeta({ customerId: cust.id, customerName: cust.name });
                          setShowCustomerResults(false);
                          setCustomerSearch('');
                        }}
                        style={{ padding: '8px 12px', fontSize: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{cust.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{cust.phone}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--green-400)' }}>{cust.points} pts</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
          {currentOrder.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">Selecciona productos del menú</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {currentOrder.items.map((item, idx) => (
                <div key={item.id + idx} style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {item.name} {item.comboDetails && <span className="badge badge-warning" style={{fontSize: '0.6rem', padding: '2px 4px'}}>COMBO</span>}
                      </div>
                      
                      {/* Detalles de Combo */}
                      {item.comboDetails && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          + Acompañamiento: {products.find(p => p.id === item.comboDetails.sideId)?.name}
                          <br />
                          + Bebida: {products.find(p => p.id === item.comboDetails.drinkId)?.name}
                        </div>
                      )}

                      {/* Modificadores */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {item.modifiers.map(modId => {
                            const mod = modifiers.find(m => m.id === modId);
                            return mod ? <div key={modId}>• {mod.name}</div> : null;
                          })}
                        </div>
                      )}

                      {/* Nota */}
                      {item.note && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontStyle: 'italic', marginTop: 2 }}>
                          "{item.note}"
                        </div>
                      )}

                      {item.promotionId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--red-400)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Tag size={10} /> Promo aplicada − {formatCOP(item.discountAmount)}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => removeItem(item.id)}>
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-sm btn-ghost btn-icon"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        style={{ width: 28, height: 28, padding: 0 }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        className="btn btn-sm btn-ghost btn-icon"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        style={{ width: 28, height: 28, padding: 0 }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.discountAmount > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCOP(item.price * item.quantity)}
                        </div>
                      )}
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {formatCOP((item.price - item.discountAmount) * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales */}
        {currentOrder.items.length > 0 && (
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal bruto</span>
                <span>{formatCOP(totals.grossTotal)}</span>
              </div>
              {totals.totalDiscounts > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--red-400)' }}>
                  <span>Descuentos / Promos</span>
                  <span>− {formatCOP(totals.totalDiscounts)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Venta neta</span>
                <span>{formatCOP(totals.netTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Impoconsumo 8%</span>
                <span>{formatCOP(totals.impoconsumo)}</span>
              </div>
              {currentOrder.tip > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--green-400)' }}>
                  <span>Propina</span>
                  <span>+ {formatCOP(currentOrder.tip)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                <span>TOTAL</span>
                <span style={{ color: 'var(--accent)' }}>{formatCOP(totals.grandTotal)}</span>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ flex: 1 }} 
                onClick={() => {
                  if (!validateOrderDestination()) return;
                  setShowComanda(true);
                }}
                title="Previsualizar e imprimir comanda de cocina"
              >
                <Printer size={15} /> Comanda
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowPromo(true)}>
                <Tag size={15} className="text-accent" /> Promos
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowTip(true)}>
                💰 Propina
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowSplit(true)}>
                ✂️ Dividir
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}
                onClick={handleSaveToKitchen}
                disabled={!canCheckout}
                title="Guardar en mesa y mandar a cocina sin cobrar"
              >
                <Save size={16} /> Guardar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}
                onClick={handleOpenPayment}
                disabled={!canCheckout}
              >
                Cobrar <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showPayment && (
        <PaymentModal
          totals={totals}
          customerId={currentOrder.customerId}
          onClose={() => setShowPayment(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
      {showTip && (
        <TipModal
          netTotal={totals.netTotal}
          onClose={() => setShowTip(false)}
        />
      )}
      {showSplit && (
        <SplitModal
          totals={totals}
          items={currentOrder.items}
          onClose={() => setShowSplit(false)}
        />
      )}
      {showCashClose && (
        <CashCloseModal onClose={() => setShowCashClose(false)} />
      )}
      {showPromo && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Aplicar Descuento a la Orden</h2>
            </div>
            <div className="modal-body flex flex-col gap-2">
              <div 
                className="card p-3 cursor-pointer border-light hover:border-accent"
                onClick={() => { applyPromoToOrder(null); setShowPromo(false); }}
              >
                <span className="font-bold">❌ Quitar Promociones</span>
              </div>
              {promotions.filter(p => p.isActive).map(promo => (
                <div 
                  key={promo.id} 
                  className="card p-3 cursor-pointer border-light hover:border-accent flex justify-between items-center"
                  onClick={() => { applyPromoToOrder(promo); setShowPromo(false); }}
                >
                  <div>
                    <div className="font-bold text-lg">{promo.name}</div>
                    <div className="text-sm text-muted">{promo.description}</div>
                  </div>
                  <div className="font-bold text-accent">
                    {promo.type === 'percentage' ? `${promo.value}% DCTO` : `-$${promo.value}`}
                  </div>
                </div>
              ))}
              {promotions.filter(p => p.isActive).length === 0 && (
                <div className="text-center text-muted p-4">No hay promociones activas.</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost w-full" onClick={() => setShowPromo(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {showQuickCustomerModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar Cliente Rápido</h2>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowQuickCustomerModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleQuickCustomerSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" required value={quickCustomerForm.name} onChange={(e) => setQuickCustomerForm({...quickCustomerForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono *</label>
                  <input className="form-input" required value={quickCustomerForm.phone} onChange={(e) => setQuickCustomerForm({...quickCustomerForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Opcional)</label>
                  <input type="email" className="form-input" value={quickCustomerForm.email} onChange={(e) => setQuickCustomerForm({...quickCustomerForm, email: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowQuickCustomerModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar y Seleccionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Personalización de Producto */}
      {customizingProduct && (
        <ProductCustomizerModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* Modal de Impresión de Comanda */}
      {showComanda && (
        <ComandaModal 
          order={currentOrder}
          totals={totals}
          onClose={() => setShowComanda(false)}
        />
      )}

      {/* Modal de Impresión de Factura al Cobrar */}
      {completedReceiptData && (
        <ReceiptModal 
          completedData={completedReceiptData}
          onClose={() => setCompletedReceiptData(null)}
        />
      )}
    </div>
  );
}
